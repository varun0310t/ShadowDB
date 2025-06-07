"use client";

import { useEffect, useState } from "react";
import { ProPlanCard } from "./component/ProPlanCard";
import axios from "axios";

export default function SubscriptionPage() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function checkSubscription() {
      try {
        const response = await axios.get("/api/subsscription");
        setIsSubscribed(response.data.hasActiveSubscription);
      } catch (error) {
        console.error("Failed to check subscription:", error);
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F17] p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0B0F17] p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-200 mb-2">Upgrade to Pro</h1>
        <p className="text-gray-400 max-w-md mx-auto">
          Unlock all features and enhance your database management experience
        </p>
      </div>
      
      <ProPlanCard isSubscribed={isSubscribed} />
      
      {isSubscribed && (
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            You already have an active subscription. 
            <a href="/subscription/manage" className="text-purple-500 ml-1 hover:underline">
              Manage your subscription
            </a>
          </p>
        </div>
      )}
    </div>
  );
}