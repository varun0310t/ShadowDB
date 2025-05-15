import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {  patroni_scope } = body;
 console.log("Request to start database:", { patroni_scope });
    // We need database_Scope for the DB service API
    if (!patroni_scope) {
      return NextResponse.json(
        { error: "Database scope is required" },
        { status: 400 }
      );
    }
    console.log("Request to start database:", { patroni_scope });

    // Call the database service API
    const response = await axios.post(
      `${process.env.DB_Service_url}/api/databases/start`,
      { database_Scope: patroni_scope }
    );

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("Error starting database:", error);
    return NextResponse.json(
      {
        error: "Failed to start database",
        message: error.response?.data?.message || error.message,
      },
      { status: error.response?.status || 500 }
    );
  }
}
