import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import "../../../../../db/index";
import {
  getDefaultReaderPool,
  getDefaultWriterPool,
} from "../../../../../lib/userPools";
import { checkAndUpdateLeader ,leaderPoolIndex} from "@/lib/LeaderCheck";

export async function POST(req: Request) {
  // Validate session
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Parse incoming JSON request body
  const { tenancy_type, db_name } = await req.json();

  // Validate tenancy_type
  if (!["shared", "isolated"].includes(tenancy_type)) {
    return NextResponse.json(
      { error: "Invalid tenancy type" },
      { status: 400 }
    );
  }

  // Validate db_name for isolated tenancy
  if (!db_name) {
    return NextResponse.json(
      { error: "db_name is required " },
      { status: 400 }
    );
  }

  try {
    // Begin transaction
    await checkAndUpdateLeader();
    console.log("Leader is ", leaderPoolIndex);
    const client = await getDefaultWriterPool().connect();
    try {
      await client.query("BEGIN");

      // First, create the new database entry
      const createDbQuery = `
            INSERT INTO databases (name, tenancy_type, created_by)
            VALUES ($1, $2, $3)
            RETURNING id, name, tenancy_type;
        `;
      const dbValues = [db_name, tenancy_type, session.user.id];
      console.log("leaderPoolIndex",client);
      const dbResult = await client.query(createDbQuery, dbValues);

      // Then, create the user-database relationship with admin access
      const createUserDbQuery = `
            INSERT INTO user_databases (user_id, database_id, access_level)
            VALUES ($1, $2, 'admin')
            RETURNING *;
        `;
      const userDbValues = [session.user.id, dbResult.rows[0].id];
      await client.query(createUserDbQuery, userDbValues);

      // Get the complete user database information
      const getUserDbQuery = `
            SELECT 
                u.id as user_id, 
                u.name as user_name, 
                u.email,
                d.id as database_id, 
                d.name as database_name, 
                d.tenancy_type,
                ud.access_level,
                d.created_at,
                d.updated_at
            FROM users u
            JOIN user_databases ud ON u.id = ud.user_id
            JOIN databases d ON ud.database_id = d.id
            WHERE u.id = $1 AND d.id = $2;
        `;
      const result = await client.query(getUserDbQuery, userDbValues);

      const commitResult = await client.query("COMMIT");

      if (commitResult.command !== "COMMIT") {
        throw new Error("Database creation failed");
      }

      console.log("Database created:", {
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        databaseName: db_name,
        tenancyType: tenancy_type,
        accessLevel: "admin",
      });

      return NextResponse.json({
        message: "Database created and access granted",
        database: result.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Database creation error:", error);
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}
