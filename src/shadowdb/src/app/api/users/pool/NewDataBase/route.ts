import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getDefaultWriterPool } from "../../../../../lib/userPools";
import { checkAndUpdateLeader,scopeLeaderIndex } from "@/lib/LeaderCheck";
import axios from "axios";

// DB Service configuration
const DB_SERVICE_URL = `http://${process.env.DB_Service_Host || "localhost"}:${
  process.env.DB_Service_Port || 6000
}`;

export async function POST(req: Request) {
  // Validate session
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse incoming JSON request body
  let { tenancy_type, db_name, password } = await req.json();

  // Validate tenancy_type
  if (!["shared", "isolated"].includes(tenancy_type)) {
    return NextResponse.json(
      { error: "Invalid tenancy type" },
      { status: 400 }
    );
  }

  // Validate db_name
  if (!db_name) {
    return NextResponse.json({ error: "db_name is required" }, { status: 400 });
  }

  try {
    await checkAndUpdateLeader();
    console.log(scopeLeaderIndex);
    const client = await getDefaultWriterPool().connect();

    try {
      await client.query("BEGIN");

      let dbId;
      let connectionDetails = null;
      const userdetailsquery= `SELECT * FROM users WHERE id = $1`;
      const userdetailsvalues = [session.user.id];
      const {rows} = await client.query(userdetailsquery, userdetailsvalues);
      const userdetails = rows[0];
      const userEmail = userdetails.email;
      const role_password=  userdetails.role_password;
      if (tenancy_type === "isolated") {
        // For isolated databases, just call the DB service
        try {
          // Generate a secure password for the database
          if (password === undefined || password === null) {
            password = generateSecurePassword();
          }
          console.log(DB_SERVICE_URL);
          // Call DB service to create the container
          const dbServiceResponse = await axios.post(
            `${DB_SERVICE_URL}/api/databases/create`,
            {
              userId: session.user.id,
              databaseName: db_name,
              password: password,
              userEmail: userEmail,
              role_password: role_password,
            }
          );

          connectionDetails = dbServiceResponse.data;
          console.log("DB Service created database:", connectionDetails);

          // Use the ID from the DB service directly
          dbId = connectionDetails.id;
          console.log("DB Service ID:", dbId);
        } catch (dbServiceError: any) {
          console.error(
            "DB Service error:",
            dbServiceError.response?.data || dbServiceError.message
          );
          throw new Error(
            `Failed to provision isolated database: ${dbServiceError.message}`
          );
        }
      } else {
        // For shared databases, create database entry in metadata DB
        const createDbQuery = `
          INSERT INTO databases (
            name, 
            tenancy_type, 
            owner_id,
            status
          )
          VALUES ($1, $2, $3, $4)
          RETURNING id, name, tenancy_type;
        `;

        const dbValues = [db_name, "shared", session.user.id, "running"];

        const dbResult = await client.query(createDbQuery, dbValues);
        dbId = dbResult.rows[0].id;
      }
      console.log("here here");
      // Create user-database relationship with admin access
      const createUserDbQuery = `
        INSERT INTO user_databases (user_id, database_id, access_level)
        VALUES ($1, $2, 'admin')
        RETURNING *;
      `;
      await client.query(createUserDbQuery, [session.user.id, dbId]);
      console.log("here here 2");
      // Commit transaction
      await client.query("COMMIT");

      // Prepare the response
      const responseData = {
        message: "Database provisioned successfully",
        database: {
          id: dbId,
          name: db_name,
          tenancy_type: tenancy_type,
          status: tenancy_type === "isolated" ? "running" : "active",
          connection_string: getConnectionString(
            tenancy_type,
            dbId,
            db_name,
            connectionDetails?.port,
            connectionDetails?.password
          ),
        },
      };

      return NextResponse.json(responseData);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("Database provisioning error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to generate a secure password
function generateSecurePassword(length = 16) {
  return "varun@1234";
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Helper function to generate connection strings
function getConnectionString(
  tenancyType: string,
  dbId: number,
  dbName: string,
  port?: number,
  password?: string
) {
  if (tenancyType === "shared") {
    return `postgresql://shadow_user_${dbId}:${process.env.SHARED_DB_PASSWORD}@${process.env.SHARED_DB_HOST}:5432/${dbName}`;
  } else {
    return `postgresql://postgres:${password}@${
      process.env.DB_SERVICE_HOST || "localhost"
    }:${port}/${dbName}`;
  }
}
