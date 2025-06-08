import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDefaultReaderPool,getDefaultWriterPool } from "@/lib/userPools";
import { get } from "http";

const PAYU_SALT = process.env.PAYU_SALT!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    console.log("Received form data:", formData);
    // Extract PayU response parameters
    const txnId = formData.get('txnid') as string;
    const status = formData.get('status') as string;
    const amount = formData.get('amount') as string;
    const mihpayid = formData.get('mihpayid') as string;
    const payuMoneyId = formData.get('payuMoneyId') as string;
    const hash = formData.get('hash') as string;
    
    // Verify the hash to ensure response is from PayU
    const dataString = `${PAYU_SALT}|${status}|||||||||${payuMoneyId}|${txnId}`;
    const calculatedHash = crypto.createHash('sha512').update(dataString).digest('hex');
    
    if (hash !== calculatedHash) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/error?reason=invalid_hash`
      );
    }
    
    // Get payment from database
    const payments = await getDefaultReaderPool().query(`
      SELECT id, user_id, duration 
      FROM payments 
      WHERE transaction_id = ${txnId}
    `);

    if (payments.rows.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/error?reason=payment_not_found`
      );
    }

    const payment = payments.rows[0];

    // Update payment status
    await getDefaultWriterPool().query(`
      UPDATE payments 
      SET 
        status = 'COMPLETED', 
        payu_payment_id = ${mihpayid}, 
        payu_money_id = ${payuMoneyId}, 
        updated_at = NOW()
      WHERE id = ${payment.id}
    `);
    
    // Calculate subscription end date
    const now = new Date();
    let endDate = new Date();
    
    if (payment.duration === "monthly") {
      endDate.setMonth(now.getMonth() + 1);
    } else if (payment.duration === "yearly") {
      endDate.setFullYear(now.getFullYear() + 1);
    }
    
    // Check if user already has a subscription
    const subscriptions = await getDefaultReaderPool().query(`
      SELECT id FROM subscriptions WHERE user_id = ${payment.user_id}
    `);

    if (subscriptions.rows.length > 0) {
      // Update existing subscription
      await getDefaultWriterPool().query(`
        UPDATE subscriptions 
        SET 
          start_date = ${now.toISOString()}, 
          end_date = ${endDate.toISOString()}, 
          is_active = TRUE, 
          updated_at = NOW()
        WHERE user_id = ${payment.user_id}
      `);
    } else {
      // Create new subscription
      await getDefaultWriterPool().query(`
        INSERT INTO subscriptions (user_id, start_date, end_date, is_active)
        VALUES (${payment.user_id}, ${now.toISOString()}, ${endDate.toISOString()}, TRUE)
      `);
    }
    
    // Update user's account plan to Pro
    await getDefaultWriterPool().query(`
      UPDATE users
      SET AccountPlan = 'pro'
      WHERE id = ${payment.user_id}
    `);

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?txnId=${txnId}`
    );
    
  } catch (error) {
    console.error("Payment success handling error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/error?reason=server_error`
    );
  }
}