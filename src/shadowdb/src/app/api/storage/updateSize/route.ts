import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import axios from "axios";
import { getDefaultWriterPool } from "@/lib/userPools";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const { databaseId, maxSizeMB } = await request.json();

    // Validate required fields
    if (!databaseId) {
      return NextResponse.json(
        { success: false, error: "Database ID is required" },
        { status: 400 }
      );
    }

    if (!maxSizeMB || isNaN(parseInt(String(maxSizeMB)))) {
      return NextResponse.json(
        { success: false, error: "Valid maxSizeMB value is required" },
        { status: 400 }
      );
    }

    const maxSizeMBNumber = parseInt(String(maxSizeMB));

    // Check if database exists and belongs to the user
    const dbResult = await getDefaultWriterPool().query(
      "SELECT id, name, owner_id FROM databases WHERE id = $1",
      [databaseId]
    );

    if (dbResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Database not found" },
        { status: 404 }
      );
    }

    const database = dbResult.rows[0];

    // Check ownership
    if (database.owner_id !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to modify this database",
        },
        { status: 403 }
      );
    }

    // Update the database max size
    await getDefaultWriterPool().query(
      "UPDATE databases SET max_size_mb = $1 WHERE id = $2",
      [maxSizeMBNumber, databaseId]
    );

    // Check the current size after update
    const sizeResult = await getDefaultWriterPool().query(
      "SELECT name, max_size_mb, COALESCE(current_size_mb, 0) as current_size_mb FROM databases WHERE id = $1",
      [databaseId]
    );

    const updatedDB = sizeResult.rows[0];
    const usagePercent =
      updatedDB.max_size_mb > 0
        ? (updatedDB.current_size_mb / updatedDB.max_size_mb) * 100
        : 0;

    // Return success with updated information
    return NextResponse.json({
      success: true,
      message: "Storage size updated successfully",
      storage: {
        database_id: parseInt(databaseId),
        database_name: updatedDB.name,
        max_size_mb: updatedDB.max_size_mb,
        current_size_mb: updatedDB.current_size_mb,
        usage_percent: parseFloat(usagePercent.toFixed(2)),
      },
    });
  } catch (error) {
    console.error("Error updating storage size:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
