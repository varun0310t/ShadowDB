import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getDefaultReaderPool, getDefaultWriterPool } from "@/lib/userPools";
import { z } from "zod";
import { Noto_Znamenny_Musical_Notation } from "next/font/google";

// Supabase client setup

// Schema for validating personal info updates
const email_notifications_preferrences = z.object({
  security_alerts: z.boolean(),
  product_updates: z.boolean(),
  marketing: z.boolean(),
  usage_reports: z.boolean(),
  new_login: z.boolean(),
});

// GET: Fetch user email notifications preferences
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await getDefaultReaderPool().query(
      `SELECT 
        Security_alert,Marketing_alert,Product_alert,Usage_alert,New_login_alert
      FROM users
      WHERE id = $1`,
      [session.user.id]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const user = result.rows[0];
    const preferences = {
      security_alerts: user.security_alert,
      product_updates: user.product_alert,
      marketing: user.marketing_alert,
      usage_reports: user.usage_alert,
      new_login: user.new_login_alert,
    };
    console.log(preferences);
    return NextResponse.json(preferences, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch user preferences" },
      { status: 500 }
    );
  }
}

// PATCH: Update user's personal info
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate request body
    try {
      console.log(body);
      email_notifications_preferrences.parse(body.emailPreferences);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: `Invalid data: ${validationError.message}` },
        { status: 400 }
      );
    }

    const {
      security_alerts,
      product_updates,
      marketing,
      usage_reports,
      new_login,
    } = body.emailPreferences;
    const userId = session.user.id;
    console.log("here");
    const result = await getDefaultWriterPool().query(
      `UPDATE users
      SET Security_alert = $1, Product_alert = $2, Marketing_alert = $3, Usage_alert = $4, New_login_alert = $5
      WHERE id = $6`,
      [
        security_alerts,
        product_updates,
        marketing,
        usage_reports,
        new_login,
        userId,
      ]
    );
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(
      { message: "Preferences updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating personal info:", error);
    return NextResponse.json(
      { error: "Failed to update personal information" },
      { status: 500 }
    );
  }
}
