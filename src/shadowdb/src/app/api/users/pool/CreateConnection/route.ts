import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import "../../../../../db/index";
import { getAppropriatePool } from "../../../../../lib/userPools";
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
  } catch (error: any) {
    console.error("Error starting user application:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
