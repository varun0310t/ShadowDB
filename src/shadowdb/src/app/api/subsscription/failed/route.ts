import { NextRequest, NextResponse } from "next/server";
import { getDefaultReaderPool,getDefaultWriterPool } from "@/lib/userPools";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Extract PayU response parameters
    const txnId = formData.get('txnid') as string;
    const status = formData.get('status') as string;
    const error = formData.get('error') as string;
    const errorMessage = formData.get('error_Message') as string;
    
    // Update payment record in database
    if (txnId) {
      const payments = await getDefaultReaderPool().query(`
        SELECT id FROM payments WHERE transaction_id = ${txnId}
      `);
      
      if (payments.rows.length > 0) {
        await getDefaultWriterPool().query(`
          UPDATE payments
          SET 
            status = 'FAILED',
            failure_reason = ${errorMessage || error || status},
            updated_at = NOW()
          WHERE id = ${payments.rows[0].id}
        `);
      }
    }
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/failed?reason=${encodeURIComponent(errorMessage || error || "Payment failed")}`
    );
    
  } catch (error) {
    console.error("Payment failure handling error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/error?reason=server_error`
    );
  }
}