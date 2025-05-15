import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import cluster from "cluster";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { database_id, patroni_scope } = body;
    console.log("Request to stop database:", { database_id, patroni_scope });
    
    // We need patroni_scope for the DB service API
    if (!patroni_scope) {
      return NextResponse.json(
        { error: "Database scope is required" },
        { status: 400 }
      );
    }

    // Call the database service API to stop the database
    const dbResponse = await axios.post(
      `${process.env.DB_Service_url}/api/databases/stop`,
      { database_Scope: patroni_scope }
    );
    
    // Also stop associated HAProxy and PgPool instances
    try {
      console.log("Stopping associated HAProxy instance for scope:", patroni_scope);
      await axios.post(
        `${process.env.DB_Service_url}/api/haproxy/stop`,
        { clusterName: patroni_scope }
      );
    } catch (haproxyError) {
      console.error("Error stopping HAProxy:", haproxyError);
      // Continue execution even if HAProxy stop failed
    }
    
    try {
      console.log("Stopping associated PgPool instance for scope:", patroni_scope);
      await axios.post(
        `${process.env.DB_Service_url}/api/pgpool/stop`,
        { clusterName: patroni_scope }
      );    } catch (pgpoolError) {
      console.error("Error stopping PgPool:", pgpoolError);
      // Continue execution even if PgPool stop failed
    }
      // Return the original database stop response
    return NextResponse.json(dbResponse.data);
  } catch (error: any) {
    console.error("Error stopping database:", error);
    return NextResponse.json(
      {
        error: "Failed to stop database",
        message: error.response?.data?.message || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
