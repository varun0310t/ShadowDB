import { NextResponse } from "next/server";
import { getDefaultWriterPool } from "../../../../../lib/userPools";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  try {
    // Update the user to mark them as verified and clear the token
    const res = await getDefaultWriterPool().query(
      "UPDATE users SET is_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id, name, email, is_verified",
      [token]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }
    
    if(res.rows[0].verification_expires < new Date()){
        return NextResponse.json({ error: "Expired token" }, { status: 400 });
    }

    return NextResponse.json({ message: "User successfully verified", user: res.rows[0] }, { status: 200 });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}