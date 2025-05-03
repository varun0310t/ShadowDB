import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getDefaultReaderPool, getDefaultWriterPool } from "@/lib/userPools";
import { z } from "zod";
import { hash, compare } from "bcrypt";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/Emails/UserAcountEmails";

// Schema for password change validation
const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^[A-Za-z\d@$!%*?&#]{8,}$/,
        "Password must be at least 8 characters and can contain letters, numbers, and special characters"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Schema for password reset request
const resetRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Schema for password reset validation
const resetValidationSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^[A-Za-z\d@$!%*?&#]{8,}$/,
        "Password must be at least 8 characters and can contain letters, numbers, and special characters"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// PATCH: Change password when logged in
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    try {
      passwordChangeSchema.parse(body);
    } catch (validationError: unknown) {
      const errorMessage =
        validationError instanceof z.ZodError
          ? validationError.message
          : "Unknown error";
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { currentPassword, newPassword } = body;

    // Get current user's password
    const user = await getDefaultReaderPool().query(
      `SELECT password, provider FROM users WHERE id = $1`,
      [session.user.id]
    );

    if (user.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user uses password authentication
    if (user.rows[0].provider !== "credentials") {
      return NextResponse.json(
        { error: "Password change not available for OAuth users" },
        { status: 400 }
      );
    }

    // Verify current password
    const isValidPassword = await compare(
      currentPassword,
      user.rows[0].password
    );
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password and update
    const hashedPassword = await hash(newPassword, 10);
    await getDefaultWriterPool().query(
      `UPDATE users 
       SET 
        password = $1,
        last_password_change = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        updated_by = $2
       WHERE id = $2`,
      [hashedPassword, session.user.id]
    );

    return NextResponse.json({
      message: "Password updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error changing password:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST: Request password reset
export async function POST(req: Request) {
  try {
    const body = await req.json();

    try {
      resetRequestSchema.parse(body);
    } catch (validationError: unknown) {
      const errorMessage =
        validationError instanceof z.ZodError
          ? validationError.message
          : "Unknown error";

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const { email } = body;

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Update user with reset token
    const result = await getDefaultWriterPool().query(
      `UPDATE users 
       SET 
        reset_password_token = $1,
        reset_password_expires = $2,
        updated_at = CURRENT_TIMESTAMP
       WHERE email = $3 AND provider = 'credentials' AND deleted_at IS NULL
       RETURNING id, email`,
      [resetToken, resetExpires, email]
    );

    if (result.rows.length === 0) {
      // Don't reveal if email exists
      return NextResponse.json({
        message:
          "If an account exists with this email, a reset link will be sent",
      });
    }

    // Send reset password email
    try {
      await sendPasswordResetEmail(email, resetToken);

      return NextResponse.json({
        message: "Password reset instructions sent",
        success: true,
      });
    } catch (emailError) {
      console.error("Failed to send reset password email:", emailError);

      // Cleanup the token if email fails
      await getDefaultWriterPool().query(
        `UPDATE users 
         SET 
          reset_password_token = NULL,
          reset_password_expires = NULL
         WHERE email = $1`,
        [email]
      );

      return NextResponse.json(
        { error: "Failed to send reset instructions" },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error("Error requesting password reset:", error);
    return NextResponse.json(
      { error: "Failed to process reset request" },
      { status: 500 }
    );
  }
}

// PUT: Reset password using token
export async function PUT(req: Request) {
  try {
    const body = await req.json();

    try {
      resetValidationSchema.parse(body);
    } catch (validationError: unknown) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { token, newPassword } = body;

    // Verify token and get user
    const user = await getDefaultReaderPool().query(
      `SELECT id FROM users 
       WHERE reset_password_token = $1 
       AND reset_password_expires > CURRENT_TIMESTAMP
       AND provider = 'credentials'
       AND deleted_at IS NULL`,
      [token]
    );

    if (user.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash new password and update user
    const hashedPassword = await hash(newPassword, 10);
    await getDefaultWriterPool().query(
      `UPDATE users 
       SET 
        password = $1,
        reset_password_token = NULL,
        reset_password_expires = NULL,
        last_password_change = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [hashedPassword, user.rows[0].id]
    );

    return NextResponse.json({
      message: "Password reset successful",
    });
  } catch (error: unknown) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
