import { NextResponse } from "next/server";

import {
  getDefaultReaderPool,
  getDefaultWriterPool,
} from "../../../../../lib/userPools";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationEmail } from "../../../../../db/email";
import "../../../../../db/index"; // Ensure this import is at the top to initialize the pools
import { checkAndUpdateLeader } from "../../../../../lib/LeaderCheck";
export async function POST(req: Request) {
  try {
    if (process.env.environment === "dvelopment") {
      await checkAndUpdateLeader();
    }

    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if the user exists
    const exists = await getDefaultReaderPool().query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (exists.rows.length > 0) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash the password before storing (increase saltRounds in production)
    const hashedPassword = await bcrypt.hash(password, 10);
    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // Insert new user into the database
    const res = await getDefaultWriterPool().query(
      "INSERT INTO users (name, email, password,verification_token, verification_expires) VALUES ($1, $2, $3,$4,$5) RETURNING id, name, email",
      [name, email, hashedPassword, verification_token, verification_expires]
    );

    const user = res.rows[0];
    //console.log("New user:", user);

    //sends verification email
    try {
      await sendVerificationEmail(email, verification_token);
    } catch (mailError) {
      console.error("Verification email error:", mailError);
    }

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Sign up error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
