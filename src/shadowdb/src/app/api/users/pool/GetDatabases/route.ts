import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import "../../../../../db/index";
import { getDefaultReaderPool } from "../../../../../lib/userPools";

export async function GET() {
  const session = await getServerSession(authOptions);


  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("session123", session);
  const getallDatabases = `
    SELECT d.id, d.tenancy_type, d.name as db_name, ud.access_level
    FROM databases d
    JOIN user_databases ud ON d.id = ud.database_id
    WHERE ud.user_id = $1 and d.is_replica = false;
  `;
  const values = [session.user.id];
  const result = await getDefaultReaderPool().query(getallDatabases, values);

  if (result.rowCount === 0) {
    console.log("Database not found or no access");
    return NextResponse.json(
      { error: "Database not found or no access" },
      { status: 404 }
    );
  }

  const databases = result.rows.map((row) => {
    return {
      id: row.id,
      tenancy_type: row.tenancy_type,
      db_name: row.db_name,
      access_level: row.access_level,
    };
  });
console.log("databases123", databases);
  return NextResponse.json({
    message: "User application started",
    databases: databases,
  });
}
