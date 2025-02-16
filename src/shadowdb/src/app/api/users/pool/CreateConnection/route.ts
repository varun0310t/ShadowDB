import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import pool from "../../../../../../db";
import { Pool } from "pg";
import { getUserPool, setUserPool } from "../../../../../../lib/userPools";

async function initializeUserPool(
  tenancy_type: string,
  db_name: string | null,
  userId: string
) {
  if (tenancy_type === "isolated" && db_name) {
    // Check if a pool already exists
    let userPool = getUserPool(userId);
    if (!userPool) {
      userPool = new Pool({
        connectionString: `postgres://postgres:${process.env.PG_PASSWORD}@localhost:${process.env.PG_PORT}/${db_name}`,
      });
      setUserPool(userId, userPool);
    }
    return userPool;
  }

  return { message: "Shared pool in use" };
}

export async function POST(req: Request) {
  // Validate session
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Retrieve the user's pool configuration from the database
    const query = `SELECT tenancy_type, db_name FROM users WHERE id = $1`;
    const values = [session.user.id];
    const result = await pool.query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "User configuration not found" },
        { status: 404 }
      );
    }

    const { tenancy_type, db_name } = result.rows[0];

    // Initialize or get the user's dedicated pool based on their configuration
    const poolStatus = await initializeUserPool(
      tenancy_type,
      db_name,
      session.user.id
    );

    return NextResponse.json({
      message: "User application started",
      config: { tenancy_type, db_name },
      poolStatus,
    });
  } catch (error: any) {
    console.error("Error starting user application:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
