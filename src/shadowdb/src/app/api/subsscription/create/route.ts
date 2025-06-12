import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getDefaultReaderPool, getDefaultWriterPool } from "@/lib/userPools";
import type { User as UserType } from "../../../../../types/DatabaseSchemaType";
// PayU configuration
const PAYU_KEY = process.env.PAYU_KEY!;
const PAYU_SALT = process.env.PAYU_SALT!;
const PAYU_BASE_URL = "https://test.payu.in/_payment";
const WEBSITE_BASE_URL = process.env.NEXT_PUBLIC_APP_URL!;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
 
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { duration, amount } = await req.json();

    if (!duration || !amount) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get user from database
    const users: UserType[] = (
      await getDefaultReaderPool().query(
        `
      SELECT id, name, email 
      FROM users 
      WHERE email = $1
    `,
        [session.user.email]
      )
    ).rows;

    if (users.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users[0];

    // Create a unique transaction ID
    const txnId = `SDB_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    if (amount !== 999 && amount !== 9990) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Create a payment record in your database
    const payment = await getDefaultWriterPool().query(
      `
      INSERT INTO payments (
        user_id, transaction_id, amount, currency, status, duration
      ) VALUES (
        $1, $2, $3, 'INR', 'PENDING', $4
      )
      RETURNING id
    `,
      [user.id, txnId, amount, duration]
    );
    if (payment.rowCount === 0) {
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 }
      );
    }
    // Prepare data for PayU
    const productInfo = `ShadowDB Pro (${duration})`;
    const firstName = user.name?.split(" ")[0] || "User";
    const lastName = user.name?.split(" ").slice(1).join(" ") || "";
    const email = user.email;

    // Prepare hash
    const amount_in_rupees = amount; // Convert from paise to rupees
    const hashString = `${PAYU_KEY}|${txnId}|${amount_in_rupees}|${productInfo}|${firstName}|${email}|||||||||||${PAYU_SALT}`;
    const hash = crypto.createHash("sha512").update(hashString).digest("hex");

    // Prepare PayU form data
    const payuData = {
      key: PAYU_KEY,
      txnid: txnId,
      amount: amount_in_rupees,
      productinfo: productInfo,
      firstname: firstName,
      lastname: lastName,
      email: email,
      phone: "9999999999", // Default phone
      surl: `${WEBSITE_BASE_URL}/api/subsscription/success`,
      furl: `${WEBSITE_BASE_URL}/api/subsscription/failure`,
      hash: hash,
      service_provider: "payu_paisa",
    };

    return NextResponse.json({
      success: true,
      paymentId: payment.rows[0].id,
      formData: payuData,
      redirectUrl: PAYU_BASE_URL,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}
