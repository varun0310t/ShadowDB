import { NextResponse } from "next/server";
import { z } from "zod";
import { sendPasswordResetEmail } from "@/lib/Emails/UserAcountEmails";
import { getDefaultWriterPool } from "@/lib/userPools";
import crypto from "crypto";
import { checkAndUpdateLeader } from "@/lib/LeaderCheck";
import "../../../../db/index"; // Ensure database connection is established
// Validate email format
const requestSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();

    // Validate with Zod
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Get database connection
    await checkAndUpdateLeader();
    const client = await getDefaultWriterPool().connect();

    try {
      // Check if user exists
      const userQuery = "SELECT * FROM users WHERE email = $1";
      const userResult = await client.query(userQuery, [email]);

      if (userResult.rows.length === 0) {
        // Don't reveal that the user doesn't exist for security reasons
        return NextResponse.json(
          {
            success: true,
            message:
              "If your email is registered, you will receive a password reset link",
          },
          { status: 200 }
        );
      }

      const user = userResult.rows[0];

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      // Token expires in 1 hour
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Save token to database
      await client.query("BEGIN");

      // First, invalidate any existing tokens
      await client.query(
        "UPDATE password_reset_tokens SET is_used = true WHERE user_id = $1 AND is_used = false",
        [user.id]
      );

      // Then create a new token
      await client.query(
        `INSERT INTO password_reset_tokens 
        (user_id, token, expires_at, is_used) 
        VALUES ($1, $2, $3, $4)`,
        [user.id, tokenHash, expiresAt, false]
      );

      await client.query("COMMIT");

      // Send email with reset link
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/Users/reset-password/${resetToken}`;

      await sendPasswordResetEmail(email, resetToken);

      return NextResponse.json(
        { success: true, message: "Password reset email sent" },
        { status: 200 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Password reset error:", error);
      return NextResponse.json(
        { error: "Failed to process password reset request" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
