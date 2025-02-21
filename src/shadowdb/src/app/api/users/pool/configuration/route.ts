import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import "../../../../../db/index";
import { getDefaultReaderPool,getDefaultWriterPool } from "../../../../../lib/userPools";

export async function POST(req: Request) {



  const cookieHeader = req.headers.get("cookie");
  console.log("Cookie header:", cookieHeader);
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
  if (tenancy_type === "isolated" && !db_name) {
    return NextResponse.json(
      { error: "db_name is required for isolated tenancy" },
      { status: 400 }
    );
  }

  try {
    // Update user's pool configuration in the database
    const query = `
      UPDATE users 
      SET tenancy_type = $1, 
          db_name = $2, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING id, name, email, tenancy_type, db_name, updated_at;
    `;

    const values = [
      tenancy_type,
      tenancy_type === "isolated" ? db_name : null,
      session.user.id,
    ];
    console.log("Query:", session.user.id,session.user.name,session.user.email,tenancy_type,db_name);
    const result = await getDefaultWriterPool().query(query, values);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Pool configuration updated",
      user: result.rows[0],
    });
  } catch (error: any) {
    console.error("Pool configuration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
