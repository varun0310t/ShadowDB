//// filepath: /b:/git repos B/ShadowDB/src/shadowdb/src/app/api/query/executeQueryRoute.ts
import { NextResponse } from "next/server";
import { executeQuery } from "../../../../lib/queryExecutor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
export async function POST(req: Request) {
  try {
    // In production, extract the userId from authentication (here we get it from a header for example).

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const { query, db_name } = await req.json();
    if (!query) {
      return NextResponse.json(
        { message: "SQL query is required" },
        { status: 400 }
      );
    }

    if (!db_name) {
      return NextResponse.json(
        { message: "db_name is required" },
        { status: 400 }
      );
    }

    const result = await executeQuery(userId, db_name, query);
    return NextResponse.json({ rows: result.rows });
  } catch (error: unknown) {
    console.error("Error executing query:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: errorMessage || "Internal Server Error" },
      { status: 500 }
    );
  }
}
