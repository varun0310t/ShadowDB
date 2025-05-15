import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import cluster from "cluster";

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const database_id = url.searchParams.get("database_id");
    const patroni_scope = url.searchParams.get("patroni_scope");

    // We need database_Scope for the DB service API
    if (!patroni_scope) {
      return NextResponse.json(
        { error: "Database scope is required" },
        { status: 400 }
      );
    }
    
    // First delete associated HAProxy and PgPool instances
    try {
      console.log("Deleting associated HAProxy instance for scope:", patroni_scope);
      await axios.delete(
        `${process.env.DB_Service_url}/api/haproxy/delete`,
        { data: { clusterName: patroni_scope } }
      );
    } catch (haproxyError) {
      console.error("Error deleting HAProxy:", haproxyError);
      // Continue execution even if HAProxy deletion failed
    }
    
    try {
      console.log("Deleting associated PgPool instance for scope:", patroni_scope);
      await axios.delete(
        `${process.env.DB_Service_url}/api/pgpool/delete`,
        { data: { clusterName: patroni_scope } }
      );
    } catch (pgpoolError) {
      console.error("Error deleting PgPool:", pgpoolError);
      // Continue execution even if PgPool deletion failed
    }

    // Finally delete the database instance
    const response = await axios.post(
      `${process.env.DB_Service_url}/api/databases/delete`,
      { database_Scope: patroni_scope }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error deleting database:", error);
    return NextResponse.json(
      {
        error: "Failed to delete database",
        message: error.response?.data?.message || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
