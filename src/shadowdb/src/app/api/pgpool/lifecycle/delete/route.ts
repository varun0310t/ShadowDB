import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const database_id = url.searchParams.get("database_id");
    const patroni_scope = url.searchParams.get("patroni_scope");

    // We need patroni_scope for the DB service API
    if (!patroni_scope) {
      return NextResponse.json(
        { error: "Database scope is required" },
        { status: 400 }
      );
    }

    // Call the database service API to delete PgPool
    const response = await axios.delete(
      `${process.env.DB_Service_url}/api/pgpool/delete`,
      { data: { clusterName: patroni_scope } }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error deleting PgPool:", error);
    return NextResponse.json(
      {
        error: "Failed to delete PgPool",
        message: error.response?.data?.message || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
