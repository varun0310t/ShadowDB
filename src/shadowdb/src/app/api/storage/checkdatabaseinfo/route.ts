import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import axios from "axios";
import { getDefaultReaderPool } from "@/lib/userPools";

export async function GET(
  request: NextRequest
) {
  try {
    const url = new URL(request.url);
    const databaseId = url.searchParams.get('databaseId');

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }


    // Get database information including container resources using axios
    const response = await getDefaultReaderPool().query(
      "select * from databases where id = $1",
      [databaseId]
    );

    // Handle errors
    if (!response || response.rowCount === 0) {
      return NextResponse.json(
        { success: false, error: "Database not found" },
        { status: 404 }
      );
    }

    const data = response.rows[0];

    // Format and return resource info
    return NextResponse.json({
      success: true,
      resources: {
        allocated_resources: {
          cpu: data.cpu_limit || "1",
          memory: data.memory_limit || "1g",
        },
        current_usage: {
          // This would come from container stats if available
          cpu_percentage: data.database?.cpu_usage || "0%",
          memory_usage: data.database?.memory_usage || "0 MB / 0 MB",
        },
      },
      storageData: {
        storage: {
          allocated_storage: data.max_size_mb || "1 GB",
          current_storage: data.current_size_mb || "0 MB / 0 MB",
        },
      },
    });
  } catch (error) {
    console.error("Error fetching database resources:", error);

    // Handle axios errors specifically
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const errorMessage = error.response?.data?.error || error.message;

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
