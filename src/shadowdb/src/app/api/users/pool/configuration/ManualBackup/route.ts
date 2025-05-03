import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getDefaultReaderPool } from "@/lib/userPools";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config(); // Loads variables from a .env file (if present)
// POST: Create a new backup
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { databaseName, databaseID } = await req.json();
console.log("Request body:", databaseName, databaseID);
    if (!databaseName) {
      return NextResponse.json(
        { error: "Database name is required" },
        { status: 400 }
      );
    }
    console.log("Database name:", databaseName);
    // Create backup by calling dbservice API
    console.log(`http://${process.env.DB_SERVICE_HOST}:${process.env.DB_SERVICE_PORT}/api/backup/create`);
    
    const backupResponse = await axios.post(
      `http://${process.env.DB_SERVICE_HOST}:${process.env.DB_SERVICE_PORT}/api/backup/create`,
      {
        databaseId: databaseID,
        userId: session.user.id,
      }
    );
    console.log("Backup response:", backupResponse.data);
    if (backupResponse.status !== 201) {
      return NextResponse.json(
        { error: "Failed to create backup" },
        { status: 500 }
      );
    }
    const backupId = backupResponse.data.id;

    console.log("Backup ID:", backupId);

    return NextResponse.json({
      success: true,
      message: "Backup process started successfully",
      backupId,
    });
  } catch (error: unknown) {
    console.error("Backup API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create backup", details: errorMessage },
      { status: 500 }
    );
  }
}

// GET: List all backups for the current user or get details of a specific backup
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const backupId = url.searchParams.get("id");

    // Get reader pool for queries
    console.log("Reader pool initialized");
    // If an ID is provided, get specific backup details
    if (backupId) {
      const { rows: backup } = await getDefaultReaderPool().query(
        `SELECT * FROM backup_records 
         WHERE id = $1 
         AND user_id = $2`,
        [backupId, session.user.id]
      );

      if (!backup || backup.length === 0) {
        console.error("Backup not found:", backupId);
        return NextResponse.json(
          { error: "Backup not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        backup: {
          id: backup[0].id,
          status: backup[0].status,
          databaseName: backup[0].database_name,
          fileName: backup[0].file_name,
          fileSize: backup[0].file_size,
          createdAt: backup[0].created_at,
          completedAt: backup[0].completed_at,
          downloadUrl: backup[0].storage_path,
        },
      });
    }

    // Otherwise, list all backups for this user
    else {
      // Add pagination parameters
      const limit = parseInt(url.searchParams.get("limit") || "10");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      console.log("Limit:", limit, "Offset:", offset);
      // Get list of backups
      const { rows: backups } = await getDefaultReaderPool().query(
        `SELECT * FROM backup_records 
         WHERE user_id = $1 
         AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [session.user.id, limit, offset]
      );

      // Get total count for pagination
      const { rows: countResult } = await getDefaultReaderPool().query(
        `SELECT COUNT(*) as total FROM backup_records 
         WHERE user_id = $1
         AND deleted_at IS NULL`,
        [session.user.id]
      );

      const total = parseInt(countResult[0].total);

      // Format backups for the response
      const formattedBackups = backups.map((backup) => ({
        id: backup.id,
        status: backup.status,
        databaseName: backup.database_name,
        fileName: backup.file_name,
        fileSize: backup.file_size,
        backupType: backup.backup_type,
        createdAt: backup.created_at,
        completedAt: backup.completed_at,
      }));

      return NextResponse.json({
        success: true,
        backups: formattedBackups,
        pagination: {
          total,
          limit,
          offset,
        },
      });
    }
  } catch (error: unknown) {
    console.error("Backup API error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    // Handle axios errors specifically
    return NextResponse.json(
      { error: "Failed to get backup information", details: errorMessage },
      { status: 500 }
    );
  }
}
