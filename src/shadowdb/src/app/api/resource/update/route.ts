import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import axios from "axios";
import { getDefaultReaderPool, getDefaultWriterPool } from "@/lib/userPools";

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
    
    // Parse request body
    const { database_id, cpu_limit, memory_limit } = await request.json();
    
    // Validate required fields
    if (!database_id) {
      return NextResponse.json(
        { success: false, error: "Database ID is required" },
        { status: 400 }
      );
    }
    
    // Ensure at least one limit is provided
    if (cpu_limit === undefined && memory_limit === undefined) {
      return NextResponse.json(
        { success: false, error: "At least one resource limit must be provided" },
        { status: 400 }
      );
    }
    
    // Validate CPU limit if provided
    if (cpu_limit !== undefined) {
      const cpuValue = parseFloat(String(cpu_limit));
      if (isNaN(cpuValue) || cpuValue <= 0) {
        return NextResponse.json(
          { success: false, error: "CPU limit must be a positive number" },
          { status: 400 }
        );
      }
    }
    
    // Validate memory limit if provided
    if (memory_limit !== undefined) {
      const memoryValue = parseInt(String(memory_limit));
      if (isNaN(memoryValue) || memoryValue <= 0) {
        return NextResponse.json(
          { success: false, error: "Memory limit must be a positive number" },
          { status: 400 }
        );
      }
    }
    
    // Check if database exists and belongs to the user
    const dbResult = await getDefaultReaderPool().query(
      "SELECT id, name, owner_id FROM databases WHERE id = $1",
      [database_id]
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
        { success: false, error: "You don't have permission to modify this database" },
        { status: 403 }
      );
    }
    
  
    // Try to notify the DB service if available
    const dbServiceUrl = process.env.DB_Service_url;
    if (dbServiceUrl) {
      try {
        await axios.post(`${dbServiceUrl}/api/resource/update`, {
          database_id,
          cpu_limit,
          memory_limit
        });
      } catch (error) {
        // Just log the error but continue
        console.error("Failed to update DB service resources:", error);
      }
    }
    
    // Return success with updated information
    return NextResponse.json({
      success: true,
      message: "Resource limits updated successfully",
    });
    
  } catch (error) {
    console.error("Error updating resource limits:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}