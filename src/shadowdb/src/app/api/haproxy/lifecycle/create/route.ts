import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { database_id, patroni_scope } = body;
    console.log("Request to create HAProxy:", { database_id, patroni_scope });
    
    if (!patroni_scope) {
      return NextResponse.json(
        { error: "Database scope is required" },
        { status: 400 }
      );
    }

    // Call the database service API
    const response = await axios.post(
      `${process.env.DB_Service_url}/api/haproxy/create`,
      { patroni_scope: patroni_scope }
    );

    return NextResponse.json({
      success: true,
      message: "HAProxy instance created successfully",
      data: response.data
    });
  } catch (error: any) {
    console.error("Error creating HAProxy instance:", error);
    return NextResponse.json(
      { 
        error: "Failed to create HAProxy instance", 
        details: error?.response?.data?.message || error.message 
      },
      { status: error?.response?.status || 500 }
    );
  }
}