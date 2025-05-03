import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import "../../../../../db/index";
import {
  getAppropriatePool,
  getDefaultReaderPool,
} from "../../../../../lib/userPools";
import { initializeUserPool } from "../../../../../lib/initializeUserPools";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { db_name } = await req.json();
  try {
    const query = `
    SELECT d.id, d.tenancy_type, d.name as db_name, ud.access_level
    FROM databases d
    JOIN user_databases ud ON d.id = ud.database_id
    WHERE ud.user_id = $1 AND d.name = $2;
`;
    const values = [session.user.id, db_name];
    const result = await getAppropriatePool(null, false).query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Database not found or no access" },
        { status: 404 }
      );
    }

    const {
      tenancy_type,
      db_name: dbName,
      access_level,
      id,
      patroni_scope,
    } = result.rows[0];
    const poolStatus = await initializeUserPool(
      tenancy_type,
      dbName + id,
      session.user.id,
      patroni_scope
    );

    const sanitizedStatus = {
      type: poolStatus.message ? "shared" : "isolated",
      status: poolStatus.status || "connected",
      readerCount: poolStatus.readerCount || 0,
      dbName: dbName,
      accessLevel: access_level,
    };

    return NextResponse.json({
      message: "User application started",
      config: {
        tenancy_type,
        db_name: dbName,
        access_level,
      },
      poolStatus: sanitizedStatus,
    });
  } catch (error: unknown) {
    console.error("Error starting user application:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const database_id = searchParams.get("database_id");

  if (!database_id) {
    return NextResponse.json(
      { error: "Database ID is required" },
      { status: 400 }
    );
  }
  try {
    const query = `
    SELECT d.id, d.tenancy_type, d.name as db_name, ud.access_level, d.patroni_scope,d.haproxy_id,d.pgpool_id
    FROM databases d
    JOIN user_databases ud ON d.id = ud.database_id
    WHERE ud.user_id = $1 AND d.id = $2;
`;
    const values = [session.user.id, database_id];
    const result = await getDefaultReaderPool().query(query, values);
    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: "Database not found or no access" },
        { status: 404 }
      );
    }
    const {
      tenancy_type,
      db_name: dbName,
      access_level,
      id,
      patroni_scope,
      haproxy_id,
      pgpool_id,
    } = result.rows[0];

    const querytogethaproxypool = `
    SELECT * FROM haproxy_instances WHERE id = $1;
    `;
    const valuesforhaproxy = [haproxy_id];
    const resultforhaproxy = await getDefaultReaderPool().query(
      querytogethaproxypool,
      valuesforhaproxy
    );
    const querytogetpgpool = `
    SELECT * FROM pgpool_instances WHERE id = $1;
    `;
    const valuesforpgpool = [pgpool_id];
    const resultforpgpool = await getDefaultReaderPool().query(
      querytogetpgpool,
      valuesforpgpool
    );
    const querytogetalldbpool = `
    Select * from databases where patroni_scope = $1;
    `;
    const valuesforalldbpool = [patroni_scope];
    const resultforalldbpool = await getDefaultReaderPool().query(
      querytogetalldbpool,
      valuesforalldbpool
    );
    const response = {
      id: id,
      tenancy_type: tenancy_type,
      db_name: dbName,
      access_level: access_level,
      patroni_scope: patroni_scope,
      role_user:session.user.email,
      hostname: process.env.DB_Service_Host || "localhost",
      haproxy: {
        write_port: resultforhaproxy.rows[0].write_port,
        read_port: resultforhaproxy.rows[0].read_port,
      },
      pgpool: {
        port: resultforpgpool.rows[0].port,
      },
      all_db_pools: resultforalldbpool.rows.map((row: any) => ({
        id: row.id,
        db_name: row.name,
        tenancy_type: row.tenancy_type,
        access_level: row.access_level,
        status: row.status,
        port:row.port,
      })),
    };
    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("Error starting user application:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
