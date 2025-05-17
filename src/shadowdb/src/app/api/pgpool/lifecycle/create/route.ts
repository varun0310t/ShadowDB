import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getDefaultReaderPool } from "@/lib/userPools";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { database_id, patroni_scope } = body;
    console.log("Request to create PgPool:", { database_id, patroni_scope });

    if (!patroni_scope || !database_id) {
      return NextResponse.json(
        { error: "Database scope and ID are required" },
        { status: 400 }
      );
    }

    // Get database details first to get the database name, haproxy_id and owner
    const dbResult = await getDefaultReaderPool().query(
      `SELECT d.id, d.name, d.haproxy_id, u.email, u.role_password 
       FROM databases d
       JOIN users u ON d.owner_id = u.id
       WHERE d.id = $1`,
      [database_id]
    );

    if (dbResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Database not found" },
        { status: 404 }
      );
    }

    const dbInfo = dbResult.rows[0];

    // Check if we have HAProxy ID, which is required for PgPool
    if (!dbInfo.haproxy_id) {
      return NextResponse.json(
        { error: "HAProxy must be created before PgPool" },
        { status: 400 }
      );
    }

    // Check if we have the user's role password
    if (!dbInfo.role_password) {
      return NextResponse.json(
        { error: "Database user password not found" },
        { status: 404 }
      );
    }

    // Call the database service API to create PgPool
    const response = await axios.post(
      `${process.env.DB_Service_url}/api/pgpool/create`,
      {
        haproxy_id: dbInfo.haproxy_id,
        database_id: database_id,
        userID: session.user.id,
        enableQueryCache: true,
        enableLoadBalancing: true,
        enableConnectionPooling: true,
      }
    );

    // Update the database record with the new pgpool_id
    if (response.data && response.data.pgpool && response.data.pgpool.id) {
      await getDefaultReaderPool().query(
        `UPDATE databases SET pgpool_id = $1 WHERE id = $2`,
        [response.data.pgpool.id, database_id]
      );
    }

    return NextResponse.json({
      success: true,
      message: "PgPool instance created successfully",
      data: response.data,
    });
  } catch (error: any) {
    console.error("Error creating PgPool instance:", error);
    const errorMessage =
      error?.response?.data?.message || error.message || "Unknown error";
    return NextResponse.json(
      {
        error: "Failed to create PgPool instance",
        details: errorMessage,
      },
      { status: error?.response?.status || 500 }
    );
  }
}
