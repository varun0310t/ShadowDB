//// filepath: /b:/git repos B/ShadowDB/src/shadowdb/src/app/api/query/executeQueryRoute.ts
import { NextResponse } from "next/server";
import { executeQuery } from "../../../../lib/queryExecutor";
import { verifyQueryToken } from "../../../../lib/QueryAuth";
export async function POST(req: Request) {
  try {
    // In production, extract the userId from authentication (here we get it from a header for example).
    const UserToken = req.headers.get("API_TOKEN");

    if (!UserToken) {
      return NextResponse.json(
        { message: "API_TOKEN is required" },
        { status: 400 }
      );
    }
    const { userId } = verifyQueryToken(UserToken);
    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }

    const { query, params } = await req.json();
    if (!query) {
      return NextResponse.json(
        { message: "SQL query is required" },
        { status: 400 }
      );
    }

    const result = await executeQuery(userId, query, params);
    return NextResponse.json({ rows: result.rows });
  } catch (error: unknown) {
    console.error("Error executing query:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message:errorMessage || "Internal Server Error" },
      { status: 500 }
    );
  }
}
