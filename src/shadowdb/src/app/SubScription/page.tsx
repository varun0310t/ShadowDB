"use client";

import { useEffect, useState } from "react";
import { ProPlanCard } from "./component/ProPlanCard";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Shield, Database } from 'lucide-react';
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
      <div className="flex h-full items-center justify-center bg-[#0B0F17] p-4 min-h-[80vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0B0F17] p-4 overflow-y-auto h-full">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-6 pt-4">
          <Badge className="bg-purple-600 mb-3">
            <Star className="h-3 w-3 mr-1" />
            Premium Features
          </Badge>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 mb-2">
            Upgrade to ShadowDB Pro
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Unlock enterprise-grade features and take your database management to the next level
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          {/* Free Plan Comparison */}
          <Card className="bg-[#151923] border-gray-800">
            <CardContent className="p-5">
              <div className="text-center mb-5">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Database className="h-5 w-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Free Plan</h3>
                <div className="text-xl font-bold text-gray-300">₹0</div>
                <p className="text-gray-400 text-sm">Current plan</p>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center text-gray-400">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  1 database instance
                </li>
                <li className="flex items-center text-gray-400">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Basic monitoring
                </li>
                <li className="flex items-center text-gray-400">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  Community support
                </li>
                <li className="flex items-center text-gray-400">
                  <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                 250mb storage
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Pro Plan Card - Removed scaling and added proper spacing */}
          <div className="flex justify-center ">
            <ProPlanCard isSubscribed={isSubscribed} />
          </div>

          {/* Benefits Highlight */}
          <Card className="bg-[#151923] border-gray-800">
            <CardContent className="p-5">
              <div className="text-center mb-5">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Why Upgrade?</h3>
                <p className="text-gray-400 text-sm">Unlock your full potential</p>
              </div>
              
              <ul className="space-y-3 text-sm">
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-purple-600/20 rounded flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <Zap className="h-3 w-3 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">10x Performance</div>
                      <div className="text-gray-400">No limits on resources</div>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="w-6 h-6 bg-purple-600/20 rounded flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                    <Database className="h-3 w-3 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-medium">Unlimited Scale</div>
                    <div className="text-gray-400">No limits on growth</div>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        {isSubscribed && (
          <div className="mt-6 text-center">
            <Card className="bg-green-900/20 border-green-500/30 max-w-md mx-auto">
              <CardContent className="p-4">
                <div className="flex items-center justify-center mb-2">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-400 font-medium">Active Subscription</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  You're enjoying all Pro features
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-green-500 text-green-400 hover:bg-green-500/10"
                >
                  Manage Subscription
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="mt-8 text-center pb-16">
          <div className="flex items-center justify-center space-x-8 text-gray-400 text-sm">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-green-500 mr-2" />
              SSL Secured
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              30-day Guarantee
            </div>
            <div className="flex items-center">
              <Zap className="h-4 w-4 text-blue-500 mr-2" />
              Instant Activation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}