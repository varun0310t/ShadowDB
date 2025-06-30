import { NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultWriterPool } from "@/lib/userPools";
import crypto from "crypto";
import bcrypt from "bcrypt";
import "../../../../../db//index"; 

// Define schema for password reset
const completeResetSchema = z.object({
  token: z.string().min(32, "Invalid token"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
      "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate with Zod
    const validationResult = completeResetSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token, password } = validationResult.data;
    
    // Hash the token (since we store hashed tokens in the database)
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
    // Get database connection
    const client = await getDefaultWriterPool().connect();
    
    try {
      await client.query("BEGIN");
      
      // Check if token exists and is valid
      const tokenQuery = `
        SELECT prt.*, u.id as user_id 
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = $1 
          AND prt.is_used = false 
          AND prt.expires_at > NOW()
      `;
      
      const tokenResult = await client.query(tokenQuery, [tokenHash]);
      
      if (tokenResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 400 }
        );
      }
      
      const resetTokenData = tokenResult.rows[0];
      const userId = resetTokenData.user_id;
      
      // Hash the new password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Update user's password
      await client.query(
        "UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2",
        [hashedPassword, userId]
      );
      
      // Mark token as used
      await client.query(
        "UPDATE password_reset_tokens SET is_used = true WHERE id = $1",
        [resetTokenData.id]
      );
      
      await client.query("COMMIT");
      
      return NextResponse.json(
        { success: true, message: "Password has been reset successfully" },
        { status: 200 }
      );
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Password reset error:", error);
      return NextResponse.json(
        { error: "Failed to reset password" },
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
