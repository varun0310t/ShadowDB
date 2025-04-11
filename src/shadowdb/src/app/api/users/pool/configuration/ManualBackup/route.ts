import { NextResponse } from "next/server";
import { BackupManager } from "@/db/psqlBackup";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getDefaultReaderPool, getDefaultWriterPool } from "@/lib/userPools";

// POST: Create a new backup
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { databaseName } = await req.json();

    if (!databaseName) {
      return NextResponse.json(
        { error: "Database name is required" },
        { status: 400 }
      );
    }
    console.log("Database name:", databaseName);
    // Create backup
    const backupManager = new BackupManager();
    const backupId = await backupManager.createBackup(
      session.user.id,
      databaseName
    );

    return NextResponse.json({
      success: true,
      message: "Backup process started successfully",
      backupId,
    });
  } catch (error: any) {
    console.error("Backup API error:", error);
    return NextResponse.json(
      { error: "Failed to create backup", details: error.message },
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
    const readerPool = await getDefaultReaderPool();

    // If an ID is provided, get specific backup details
    if (backupId) {
      const { rows: backup } = await readerPool.query(
        `SELECT * FROM backup_records 
         WHERE id = $1 
         AND user_id = $2`,
        [backupId, session.user.id]
      );

      if (!backup || backup.length === 0) {
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

      // Get list of backups
      const { rows: backups } = await readerPool.query(
        `SELECT * FROM backup_records 
         WHERE user_id = $1 
         AND deleted_at IS NULL
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [session.user.id, limit, offset]
      );

      // Get total count for pagination
      const { rows: countResult } = await readerPool.query(
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
  } catch (error: any) {
    console.error("Backup API error:", error);
    return NextResponse.json(
      { error: "Failed to get backup information", details: error.message },
      { status: 500 }
    );
  }
}
