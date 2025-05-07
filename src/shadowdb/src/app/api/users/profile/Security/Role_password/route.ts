import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getDefaultReaderPool, getDefaultWriterPool } from "@/lib/userPools";
import { z } from "zod";
import type { User } from "../../../../../../../types/DatabaseSchemaType";
export async function PATCH(req: NextRequest) {
  const { currentPasswordRole, newPasswordRole } = await req.json();
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 401 });
  }
  if (!session.user.id) {
    return NextResponse.json(
      { error: "User ID not found in session" },
      { status: 401 }
    );
  }
  const userId = session.user.id;
  if (!currentPasswordRole || !newPasswordRole) {
    return NextResponse.json(
      { error: "Old password and new password are required" },
      { status: 400 }
    );
  }
  if (currentPasswordRole === newPasswordRole) {
    return NextResponse.json(
      { error: "New password cannot be the same as old password" },
      { status: 400 }
    );
  }

  const userinfo = await getDefaultReaderPool().query(
    `SELECT * FROM users WHERE id = $1`,
    [userId]
  );
  if (userinfo.rowCount === 0) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const user: User = userinfo.rows[0];

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.role_password !== currentPasswordRole) {
    return NextResponse.json(
      { error: "Old password is incorrect" },
      { status: 400 }
    );
  }
  const updatePassword = await getDefaultWriterPool().query(
    `UPDATE users SET role_password = $1 WHERE id = $2`,
    [newPasswordRole, userId]
  );
  if (updatePassword.rowCount === 0) {
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
  return NextResponse.json(
    { message: "Password updated successfully" },
    { status: 200 }
  );
}
