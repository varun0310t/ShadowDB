import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getDefaultReaderPool, getDefaultWriterPool } from "@/lib/userPools";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("reached here");
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get user and subscription info
    const users = await getDefaultReaderPool().query(
      `SELECT u.id, u.email, u.AccountPlan, 
              s.id as subscription_id, s.start_date, s.end_date, s.is_active
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id
       WHERE u.email = $1`,
      [session.user.email]
    );
    
    if (users.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = users.rows[0];
    
    // Check if subscription is active and not expired
    const hasActiveSubscription = 
      !!user.subscription_id && 
      user.is_active && 
      new Date(user.end_date) > new Date();
    
    // Get subscription details if it exists
    const subscription = user.subscription_id ? {
      id: user.subscription_id,
      startDate: user.start_date,
      endDate: user.end_date,
      active: user.is_active
    } : null;
    
    return NextResponse.json({ 
      subscription,
      hasActiveSubscription,
      accountPlan: user.AccountPlan
    });
    
  } catch (error) {
    console.error("Subscription fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription data" },
      { status: 500 }
    );
  }
}