import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { database_id, patroni_scope } = body;

    if (!patroni_scope) {
      return NextResponse.json(
        { error: "Database scope is required" },
        { status: 400 }
      );
    }    // Call the database service API
    const response = await axios.post(
      `${process.env.DB_Service_url}/api/pgpool/start`,
      { clusterName: patroni_scope }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error starting PgPool:", error);
    return NextResponse.json(
      {
        error: "Failed to start PgPool",
        message: error.response?.data?.message || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
