import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import pool from "../../../../../../db";
import { Pool } from "pg";
import { getUserPool, setUserPool } from "../../../../../../lib/userPools";

async function initializeUserPool(
  tenancy_type: string,
  db_name: string | null,
  userId: string,
  replicaCount: number = 1
) {
  if (tenancy_type === "isolated" && db_name) {
    // Check existing pools
    const existingPools = getUserPool(userId);
    if (existingPools) {
      console.log("Using existing pools for user:", userId);
      return {
        writer: existingPools.writer,
        readerCount: existingPools.readers.length,
        status: 'connected'
      };
    }

    // Create writer pool
    console.log("Creating new pools for user:", userId);
    const password = encodeURIComponent(process.env.PG_PASSWORD || "");
    const writerPool = new Pool({
      connectionString: `postgresql://${process.env.PG_USER}:${password}@${process.env.PG_HOST}:${process.env.PG_PORT}/${db_name}`,
      application_name: "writer",
    });

    try {
      // Test and set up writer pool (only once)
      const res = await writerPool.query("SELECT NOW()");
      console.log("Connected to PostgreSQL writer at:", res.rows[0].now);
      setUserPool(userId, writerPool, false);

      // Set up read replicas
      for (let i = 0; i < replicaCount; i++) {
        const readerPool = new Pool({
          connectionString: `postgresql://${process.env.PG_USER}:${password}@${process.env.PG_HOST}:${process.env.PG_PORT}/${db_name}`,
          application_name: `reader-${i + 1}`,
        });

        await readerPool.query("SELECT NOW()");
        console.log(`Connected to PostgreSQL reader-${i + 1} at:`, new Date().toISOString());
        setUserPool(userId, readerPool, true);
      }

      const pools = getUserPool(userId);
      return {
        writer: pools?.writer,
        readerCount: pools?.readers.length || 0,
        status: 'connected'
      };
    } catch (err) {
      console.error("Connection error", err);
      throw err;
    }
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

    const sanitizedStatus = {
      type: poolStatus.message ? "shared" : "isolated",
      status: poolStatus.status || "connected",
      readerCount: poolStatus.readerCount || 0,
      dbName: db_name,
    };

    return NextResponse.json({
      message: "User application started",
      config: { tenancy_type, db_name },
      poolStatus: sanitizedStatus,
    });
  } catch (error: any) {
    console.error("Error starting user application:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
