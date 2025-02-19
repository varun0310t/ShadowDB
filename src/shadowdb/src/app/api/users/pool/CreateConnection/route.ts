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
import { initializeUserPool } from "../../../../../../lib/initializeUserPools";

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
