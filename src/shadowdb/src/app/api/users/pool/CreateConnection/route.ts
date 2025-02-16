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
    // First, try to create the database using the main pool
    try {
      await pool.query(`CREATE DATABASE ${db_name}`);
      console.log(`Database ${db_name} created successfully`);
    } catch (err: any) {
      // Ignore error if database already exists
      if (err.code !== '42P04') { // 42P04 is the error code for "database already exists"
        console.error("Error creating database:", err);
        throw err;
      }
    }

    // Now create/get the user-specific pool
    let userPool = getUserPool(userId);
    if (!userPool) {
      console.log("Creating new pool for user:", userId);
      const password = encodeURIComponent(process.env.PG_PASSWORD || '');
      userPool = new Pool({
        connectionString: `postgresql://${process.env.PG_USER}:${password}@${process.env.PG_HOST}:${process.env.PG_PORT}/${db_name}`,
      });

      try {
        const res = await userPool.query("SELECT NOW()");
        console.log("Connected to PostgreSQL for user at:", res.rows[0].now);
        setUserPool(userId, userPool);
      } catch (err) {
        console.error("Connection error", err);
        throw err; // Propagate the error
      }
 
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


    const sanitizedStatus = poolStatus instanceof Pool ? {
      totalCount: (poolStatus as any).totalCount,
      idleCount: (poolStatus as any).idleCount,
      waitingCount: (poolStatus as any).waitingCount,
      status: 'connected'
    } : poolStatus;

    return NextResponse.json({
      message: "User application started",
      config: { tenancy_type, db_name },
      poolStatus: sanitizedStatus
    });
  } catch (error: any) {
    console.error("Error starting user application:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
