import { NextResponse } from "next/server";
import { z } from "zod";
import { getDefaultWriterPool } from "@/lib/userPools";
import crypto from "crypto";
import "../../../../db/index"; // Ensure database connection is established
// Validate token format
const requestSchema = z.object({
  token: z.string().min(32, "Invalid token"),
});

export async function POST(req: Request) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate with Zod
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid token format" },
        { status: 400 }
      );
    }

    const { token } = validationResult.data;
    
    // Hash the token (since we store hashed tokens in the database)
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
    // Get database connection
    const client = await getDefaultWriterPool().connect();
    
    try {
      // Check if token exists and is valid
      const tokenQuery = `
        SELECT prt.*, u.email 
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.id
        WHERE prt.token = $1 
          AND prt.is_used = false 
          AND prt.expires_at > NOW()
      `;
      
      const tokenResult = await client.query(tokenQuery, [tokenHash]);
      
      if (tokenResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 400 }
        );
      }
      
      const resetTokenData = tokenResult.rows[0];
      
      return NextResponse.json(
        { 
          valid: true, 
          message: "Token is valid",
          email: resetTokenData.email 
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Token verification error:", error);
      return NextResponse.json(
        { error: "Failed to verify token" },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Token verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
