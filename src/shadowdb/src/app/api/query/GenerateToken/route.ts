import { NextResponse } from "next/server";
import { generateQueryToken } from "../../../../lib/QueryAuth";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }

    // Generate a token encoding the user's session info
    const token = generateQueryToken({ userId });
    return NextResponse.json({ token });
  } catch (error: any) {
    console.error("Error generating token:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
