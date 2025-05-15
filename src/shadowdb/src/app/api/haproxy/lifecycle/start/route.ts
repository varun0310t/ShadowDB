import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import cluster from "cluster";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { database_id, patroni_scope } = body;
    console.log("Request to start HAProxy:", { database_id, patroni_scope });
    
    // We need patroni_scope for the DB service API
    if (!patroni_scope) {
      return NextResponse.json(
        { error: "Database scope is required" },
        { status: 400 }
      );
    }

    // Call the database service API to start HAProxy
    const response = await axios.post(
      `${process.env.DB_Service_url}/api/haproxy/start`,
      { clusterName: patroni_scope }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error starting HAProxy:", error);
    return NextResponse.json(
      {
        error: "Failed to start HAProxy",
        message: error.response?.data?.message || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
