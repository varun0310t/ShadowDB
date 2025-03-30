import { getDefaultWriterPool, getDefaultReaderPool } from "@/lib/userPools";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { z } from "zod";
import { generateQueryToken } from "@/lib/QueryAuth";
// Define types for type safety
type TokenResponse = {
  id: number;
  user_id: number;
  token_type: string;
  token: string;
  device_info: string | null;
  ip_address: string | null;
  expires_at: string;
  created_at: string;
  last_used_at: string | null;
  is_revoked: boolean;
};

// Schema for token update validation
const TokenUpdateSchema = z.object({
  is_revoked: z.boolean().optional(),
});

// GET - List all tokens for the authenticated user
export async function GET(req: Request) {
  try {
    // Validate authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const showRevoked = url.searchParams.get("showRevoked") === "true";
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Validate limits
    if (limit > 100) {
      return NextResponse.json(
        { error: "Maximum limit is 100" },
        { status: 400 }
      );
    }

    // Build query based on parameters
    let query = `
      SELECT id, user_id, token_type, token, device_info, ip_address, 
             created_at, expires_at, last_used_at, is_revoked
      FROM user_tokens
      WHERE user_id = $1
    `;

    const queryParams = [session.user.id];

    // Add filter for revoked tokens if needed
    if (!showRevoked) {
      query += " AND is_revoked = false";
    }

    // Add sorting and pagination
    query += " ORDER BY created_at DESC LIMIT $2 OFFSET $3";
    queryParams.push("" + limit, "" + offset);

    // Execute query
    const result = await getDefaultReaderPool().query(query, queryParams);

    // Return results
    return NextResponse.json({
      tokens: result.rows,
      count: result.rowCount,
    });
  } catch (error: any) {
    console.error("Error retrieving tokens:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST - Create a new token
export async function POST(req: Request) {
  try {
    // Validate authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { expiresInDays = 30 } = body;

    const token = generateQueryToken({ userId: session.user.id });

    // Get client IP and user agent
    const forwardedFor = req.headers.get("x-forwarded-for") as string;
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "";

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Insert new token
    const insertQuery = `
      INSERT INTO user_tokens (
        user_id, token_type, token, device_info, ip_address, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, user_id, token_type, token, device_info, ip_address, 
                created_at, expires_at, last_used_at, is_revoked
    `;

    const values = [
      session.user.id,
      "query",
      token,
      userAgent,
      ip,
      expiresAt.toISOString(),
    ];

    const result = await getDefaultWriterPool().query(insertQuery, values);

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error creating token:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH - Update token properties (revocation status)
export async function PATCH(req: Request) {
  try {
    // Validate authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { id, ...updates } = body;

    // Validate token ID
    if (!id) {
      return NextResponse.json(
        { error: "Token ID is required" },
        { status: 400 }
      );
    }

    // Validate update fields (only is_revoked can be updated)
    try {
      TokenUpdateSchema.parse(updates);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: `Invalid update data: ${validationError.message}` },
        { status: 400 }
      );
    }

    if (updates.is_revoked === undefined) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    // Update token revocation status
    const updateQuery = `
      UPDATE user_tokens
      SET is_revoked = $3
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, token_type, token, device_info, ip_address, 
                created_at, expires_at, last_used_at, is_revoked
    `;

    const values = [id, session.user.id, updates.is_revoked];
    const result = await getDefaultWriterPool().query(updateQuery, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Token not found or you don't have permission to update it" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error("Error updating token:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a token
export async function DELETE(req: Request) {
  try {
    // Validate authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the URL to extract token ID from query parameters
    const url = new URL(req.url);
    const tokenId = url.searchParams.get("id");

    if (!tokenId) {
      return NextResponse.json(
        { error: "Token ID is required" },
        { status: 400 }
      );
    }

    // Delete the token (users can only delete their own tokens)
    const deleteQuery = `
      DELETE FROM user_tokens
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;

    const result = await getDefaultWriterPool().query(deleteQuery, [
      tokenId,
      session.user.id,
    ]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Token not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Token deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting token:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
