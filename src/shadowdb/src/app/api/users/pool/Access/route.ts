import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import "../../../../../db/index";
import {
  getDefaultReaderPool,
  getDefaultWriterPool,
} from "../../../../../lib/userPools";
import {
  terminateDbConnections,
  CheckIfUserHasAccess,
  databaseExists,
} from "../../../../../lib/utils/DButils";
import { findUserByEmail } from "../../../../../lib/utils/UserUtils";
import { z } from "zod";

// Schema validation for request bodies
const grantAccessSchema = z.object({
  dbName: z.string().min(1),
  email: z.string().email("Invalid email address format"),
  accessLevel: z.enum(["admin", "user", "read"])
});

const updateAccessSchema = z.object({
  dbName: z.string().min(1),
  email: z.string().email("Invalid email address format"),
  accessLevel: z.enum(["admin", "user", "read"])
});

// GET - List all users with access to a specific database
export async function GET(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const dbName = url.searchParams.get("dbName");

    if (!dbName) {
      return NextResponse.json(
        { error: "Database name is required" },
        { status: 400 }
      );
    }

    // Check if database exists
    const dbExists = await databaseExists(dbName);
    if (!dbExists) {
      return NextResponse.json(
        { error: `Database "${dbName}" does not exist` },
        { status: 404 }
      );
    }

    // Check if the requesting user has admin access to the database
    const hasAdminAccess = await CheckIfUserHasAccess(session.user.id, dbName, "admin");
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: "You don't have permission to view access for this database" },
        { status: 403 }
      );
    }

    // Get database ID
    const dbIdResult = await getDefaultReaderPool().query(
      `SELECT id FROM databases WHERE name = $1`,
      [dbName]
    );

    if (dbIdResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Database "${dbName}" not found in the registry` },
        { status: 404 }
      );
    }

    const dbId = dbIdResult.rows[0].id;

    // Query for all users with access to this database
    const accessList = await getDefaultReaderPool().query(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        ud.access_level, 
        ud.user_id = d.created_by as is_owner  /* Use created_by instead of owner_id */
       FROM 
        user_databases ud
       JOIN 
        users u ON ud.user_id = u.id
       JOIN
        databases d ON ud.database_id = d.id
       WHERE 
        ud.database_id = $1
       ORDER BY 
        is_owner DESC, u.name ASC`,
      [dbId]
    );

    return NextResponse.json({
      database: dbName,
      users: accessList.rows
    });

  } catch (error: any) {
    console.error("Error retrieving database access list:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Grant database access to a user
export async function POST(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    
    try {
      grantAccessSchema.parse(body);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: `Invalid request data: ${validationError.message}` },
        { status: 400 }
      );
    }
    
    const { dbName, email, accessLevel } = body;

    // Check if database exists
    const dbExists = await databaseExists(dbName);
    if (!dbExists) {
      return NextResponse.json(
        { error: `Database "${dbName}" does not exist` },
        { status: 404 }
      );
    }

    // Check if the requesting user has admin access to the database
    const hasAdminAccess = await CheckIfUserHasAccess(session.user.id, dbName, "admin");
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: "You don't have permission to grant access to this database" },
        { status: 403 }
      );
    }

    // Find target user by email
    const targetUser = await findUserByEmail(email);
    if (!targetUser) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      );
    }
    
    const targetUserId = targetUser.id;

    // Get database ID
    const dbIdResult = await getDefaultReaderPool().query(
      `SELECT id, created_by FROM databases WHERE name = $1`,  /* Use created_by instead of owner_id */
      [dbName]
    );

    if (dbIdResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Database "${dbName}" not found in the registry` },
        { status: 404 }
      );
    }

    const dbId = dbIdResult.rows[0].id;
    const ownerId = dbIdResult.rows[0].created_by;  /* Use created_by instead of owner_id */

    // If the created_by is null, we don't need to do owner-specific checks
    if (ownerId && targetUserId.toString() === ownerId.toString() && accessLevel !== "admin") {
      return NextResponse.json(
        { error: "Cannot change the database owner's access level from admin" },
        { status: 400 }
      );
    }

    // Check if the user already has access to the database
    const existingAccess = await getDefaultReaderPool().query(
      `SELECT user_id, access_level FROM user_databases WHERE user_id = $1 AND database_id = $2`,
      [targetUserId, dbId]
    );

    if (existingAccess.rows.length > 0) {
      // User already has access, return current access level
      return NextResponse.json(
        { 
          message: `User ${email} already has access to this database`, 
          currentAccess: existingAccess.rows[0].access_level,
          success: false
        },
        { status: 200 }
      );
    }

    // Grant access by inserting into user_databases table
    await getDefaultWriterPool().query(
      `INSERT INTO user_databases (user_id, database_id, access_level) VALUES ($1, $2, $3)`,
      [targetUserId, dbId, accessLevel]
    );

    return NextResponse.json({
      message: `Access granted to ${email} for database "${dbName}" with role: ${accessLevel}`,
      success: true
    });

  } catch (error: any) {
    console.error("Error granting database access:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH - Update a user's access level for a database
export async function PATCH(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate the request body
    const body = await req.json();
    
    try {
      updateAccessSchema.parse(body);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: `Invalid request data: ${validationError.message}` },
        { status: 400 }
      );
    }
    
    const { dbName, email, accessLevel } = body;

    // Check if database exists
    const dbExists = await databaseExists(dbName);
    if (!dbExists) {
      return NextResponse.json(
        { error: `Database "${dbName}" does not exist` },
        { status: 404 }
      );
    }

    // Check if the requesting user has admin access to the database
    const hasAdminAccess = await CheckIfUserHasAccess(session.user.id, dbName, "admin");
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: "You don't have permission to update access for this database" },
        { status: 403 }
      );
    }

    // Find target user by email
    const targetUser = await findUserByEmail(email);
    if (!targetUser) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      );
    }
    
    const targetUserId = targetUser.id;

    // Get database ID and owner info
    const dbIdResult = await getDefaultReaderPool().query(
      `SELECT id, created_by FROM databases WHERE name = $1`,  /* Use created_by instead of owner_id */
      [dbName]
    );

    if (dbIdResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Database "${dbName}" not found in the registry` },
        { status: 404 }
      );
    }

    const dbId = dbIdResult.rows[0].id;
    const ownerId = dbIdResult.rows[0].created_by;  /* Use created_by instead of owner_id */

    // If updating the owner's access, ensure they always have admin privileges
    if (targetUserId.toString() === ownerId.toString() && accessLevel !== "admin") {
      return NextResponse.json(
        { error: "Cannot change the database owner's access level from admin" },
        { status: 400 }
      );
    }

    // Update the user's access level
    const updateResult = await getDefaultWriterPool().query(
      `UPDATE user_databases 
       SET access_level = $1 
       WHERE user_id = $2 AND database_id = $3
       RETURNING access_level`,
      [accessLevel, targetUserId, dbId]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json(
        { error: `User ${email} does not have access to this database` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Access level updated to "${accessLevel}" for user ${email} on database "${dbName}"`,
      success: true,
      accessLevel
    });

  } catch (error: any) {
    console.error("Error updating database access:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Revoke a user's access to a database
export async function DELETE(req: Request) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const dbName = url.searchParams.get("dbName");
    const email = url.searchParams.get("email");

    if (!dbName || !email) {
      return NextResponse.json(
        { error: "Database name and user email are required" },
        { status: 400 }
      );
    }

    // Check if database exists
    const dbExists = await databaseExists(dbName);
    if (!dbExists) {
      return NextResponse.json(
        { error: `Database "${dbName}" does not exist` },
        { status: 404 }
      );
    }

    // Check if the requesting user has admin access to the database
    const hasAdminAccess = await CheckIfUserHasAccess(session.user.id, dbName, "admin");
    if (!hasAdminAccess) {
      return NextResponse.json(
        { error: "You don't have permission to revoke access for this database" },
        { status: 403 }
      );
    }

    // Find target user by email
    const targetUser = await findUserByEmail(email);
    if (!targetUser) {
      return NextResponse.json(
        { error: `User with email ${email} not found` },
        { status: 404 }
      );
    }
    
    const targetUserId = targetUser.id;

    // Get database ID and owner info
    const dbIdResult = await getDefaultReaderPool().query(
      `SELECT id, created_by FROM databases WHERE name = $1`,  /* Use created_by instead of owner_id */
      [dbName]
    );

    if (dbIdResult.rows.length === 0) {
      return NextResponse.json(
        { error: `Database "${dbName}" not found in the registry` },
        { status: 404 }
      );
    }

    const dbId = dbIdResult.rows[0].id;
    const ownerId = dbIdResult.rows[0].created_by;  /* Use created_by instead of owner_id */

    // Prevent revoking the owner's access
    if (targetUserId.toString() === ownerId.toString()) {
      return NextResponse.json(
        { error: "Cannot revoke access from the database owner" },
        { status: 400 }
      );
    }

    // Prevent users from removing their own access if they're an admin
    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot revoke your own access" },
        { status: 400 }
      );
    }

    // Delete the access record
    const deleteResult = await getDefaultWriterPool().query(
      `DELETE FROM user_databases 
       WHERE user_id = $1 AND database_id = $2
       RETURNING user_id`,
      [targetUserId, dbId]
    );

    if (deleteResult.rowCount === 0) {
      return NextResponse.json(
        { error: `User ${email} does not have access to this database` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Access revoked for user ${email} on database "${dbName}"`,
      success: true
    });

  } catch (error: any) {
    console.error("Error revoking database access:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}