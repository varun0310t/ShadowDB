import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import "../../../../../../../shadowdb/db/index";
import {
  getDefaultWriterPool,
  getAppropriatePool,
  getUserPool,
  setUserPool,
} from "../../../../../../lib/userPools";
import { Pool } from "pg";

async function initializeUserPool(
  tenancy_type: string,
  db_name: string | null,
  userId: string,
  replicaCount: number = 1
) {
  if (tenancy_type === "isolated" && db_name) {
    // Check existing pools
    const existingPools = getUserPool(userId);
    if (existingPools && existingPools.length > 0) {
      console.log("Using existing pools for user:", userId);
      return {
        writer: existingPools[0],
        readerCount: existingPools.length - 1,
        status: "connected",
      };
    }

    // Create database
    try {
      await getDefaultWriterPool().query(`CREATE DATABASE ${db_name}`);
    } catch (error: any) {
      if (error.code === "42P04") {
        console.log(`Database ${db_name} already exists`);
      } else {
        console.error("Error creating database:", error);
        return { message: "Database creation failed" };
      }
    }

    // Create writer pool
    console.log("Creating new pools for user:", userId);
    const password = encodeURIComponent(process.env.PG_PASSWORD || "");
    const writerPool = new Pool({
      connectionString: `postgresql://${process.env.PG_USER}:${password}@${process.env.PG_HOST}:${process.env.PG_PORT}/${db_name}`,
      application_name: "writer",
    });

    try {
      // Test and set up writer pool (index 0)
      await writerPool.query("SELECT NOW()");
      console.log("Connected to PostgreSQL writer");
      setUserPool(userId, writerPool, 0);

      // Set up read replicas (index 1 onwards)
      for (let i = 0; i < replicaCount; i++) {
        const replicaUser = process.env[`PG_REPLICA${i + 1}_USER`];
        const replicaHost = process.env[`PG_REPLICA${i + 1}_HOST`];
        const replicaPort = process.env[`PG_REPLICA${i + 1}_PORT`];
        const replicaPassword = encodeURIComponent(process.env[`PG_REPLICA${i + 1}_PASSWORD`] || "");

        const readerPool = new Pool({
          connectionString: `postgresql://${replicaUser}:${replicaPassword}@${replicaHost}:${replicaPort}/${db_name}`,
          application_name: `reader-${i + 1}`,
        });

        await readerPool.query("SELECT NOW()");
        console.log(`Connected to PostgreSQL reader-${i + 1}`);
        setUserPool(userId, readerPool, i + 1);
      }

      const pools = getUserPool(userId);
      return {
        writer: pools?.[0],
        readerCount: (pools?.length || 1) - 1,
        status: "connected",
      };
    } catch (err) {
      console.error("Connection error", err);
      throw err;
    }
  }
  return { message: "Shared pool in use" };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const query = `SELECT tenancy_type, db_name FROM users WHERE id = $1`;
    const values = [session.user.id];
    // Use appropriate pool for reading user config
    const result = await getAppropriatePool(null, false).query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "User configuration not found" },
        { status: 404 }
      );
    }

    const { tenancy_type, db_name } = result.rows[0];
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
