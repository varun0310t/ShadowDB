import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  Database,
  DollarSign,
  Zap,
  Shield,
  Users,
  Cloud,
  Sparkles,
} from "lucide-react";
import { ProPlanCard } from "../SubScription/component/ProPlanCard";

export const PricingSection = () => {
  return (
    <section id="pricing" className="py-20 px-4 bg-gray-800">
      <h2 className="text-3xl font-bold text-center mb-4 text-white">
        Simple, Transparent Pricing
      </h2>
      <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">
        Choose the perfect plan for your needs. All plans include our core
        features with varying limits and support levels.
      </p>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {/* Starter Plan */}
        <PricingCard
          title="Starter"
          price="Free"
          period="forever"
          description="Perfect for getting started"
          features={[
            "Up to 1GB storage",
            "1,000 requests/day",
            "Basic monitoring",
            "1 database",
            "Community support",
          ]}
          buttonText="Get Started"
          buttonVariant="outline"
        />

        {/* Pro Plan - Highlighted */}
        <div className="relative">
          <ProPlanCard />
        </div>

        {/* Enterprise Plan */}
        <PricingCard
          title="Enterprise"
          price="Custom"
          period="contact us"
          description="For large scale applications"
          features={[
            "Unlimited storage",
            "Unlimited requests",
            "Advanced monitoring",
            "Unlimited databases",
            "Dedicated support",
            "SLA guarantee",
          ]}
          buttonText="Contact Sales"
          buttonVariant="default"
        />
      </div>
    </section>
  );
};

function PricingCard({
  title,
  price,
  period,
  description,
  features,
  buttonText,
  buttonVariant = "default",
  highlighted = false,
}: {
  title: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  buttonVariant?: "default" | "outline";
  highlighted?: boolean;
}) {
  return (
    <Card className="bg-[#151923] border-gray-800 relative hover:shadow-xl hover:shadow-gray-900/20 transition-all duration-300 h-full flex flex-col">
      <div className="absolute inset-[1px] bg-[#151923] rounded-lg"></div>

      <div className="relative z-10 flex flex-col h-full">
        <CardHeader className="text-center pt-6 pb-3">
          <div className="mx-auto w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center mb-3">
            <Database className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl font-bold text-white">
            {title}
          </CardTitle>
          <CardDescription className="text-gray-400 text-sm">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 px-6">
          {/* Pricing */}
          <div className="text-center py-4 mb-6">
            <div className="flex items-baseline justify-center space-x-1">
              <span className="text-3xl font-bold text-white">
                {price === "Custom"
                  ? "Custom"
                  : price === "Free"
                  ? "₹0"
                  : price}
              </span>
              {price !== "Custom" && price !== "Free" && (
                <span className="text-gray-400 text-sm">/{period}</span>
              )}
            </div>
            {price === "Custom" && (
              <span className="text-gray-400 text-sm">{period}</span>
            )}
          </div>

          {/* Features */}
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>

        <CardFooter className="px-6 pb-6 pt-4 mt-auto">
          <Button
            className={`w-full ${
              buttonVariant === "outline"
                ? "bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
                : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white"
            } font-semibold transition-all duration-200`}
            variant={buttonVariant}
            size="sm"
            onClick={() => {
              if (buttonText === "Get Started") {
                window.location.href = "/Users/Signup";
              } else if (buttonText === "Contact Sales") {
                window.location.href = "/contact";
              }
            }}
          >
            {buttonText}
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
