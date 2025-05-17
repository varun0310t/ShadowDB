import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const database_id = url.searchParams.get("database_id");
    const patroni_scope = url.searchParams.get("patroni_scope");
console.log("Request to delete HAProxy:", { database_id, patroni_scope });
    // We need patroni_scope for the DB service API
    if (!patroni_scope) {
      return NextResponse.json(
        { error: "Database scope is required" },
        { status: 400 }
      );
    }

    // Call the database service API to delete HAProxy
    const response = await axios.delete(
      `${process.env.DB_Service_url}/api/haproxy/delete`,
      { data: { clusterName: patroni_scope } }
    );

    //also delete the associated PgPool instance
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

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error deleting HAProxy:", error);
    return NextResponse.json(
      {
        error: "Failed to delete HAProxy",
        message: error.response?.data?.message || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
