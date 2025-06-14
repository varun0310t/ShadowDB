import React from "react";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

export const PricingSection = () => {
return (
       <section id="pricing" className="py-20 px-4 bg-gray-800">
        <h2 className="text-3xl font-bold text-center mb-12">
          Simple, Transparent Pricing
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            title="Starter"
            price="$29"
            features={[
              "Up to 10GB storage",
              "1,000 requests/day",
              "Basic support",
              "1 database",
            ]}
          />
          <PricingCard
            title="Pro"
            price="$99"
            features={[
              "Up to 100GB storage",
              "10,000 requests/day",
              "24/7 support",
              "5 databases",
            ]}
            highlighted={true}
          />
          <PricingCard
            title="Enterprise"
            price="Custom"
            features={[
              "Unlimited storage",
              "Unlimited requests",
              "Dedicated support",
              "Unlimited databases",
            ]}
          />
        </div>
      </section>
)
}
function PricingCard({
  title,
  price,
  features,
  highlighted = false,
}: {
  title: string;
  price: string;
  features: string[];
  highlighted?: boolean;
}) {
  return (
    <div
      className={`bg-gray-800 p-6 rounded-lg text-center ${
        highlighted ? "ring-2 ring-purple-500" : ""
      }`}
    >
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-4">
        {price}
        <span className="text-sm font-normal">/month</span>
      </p>
      <ul className="text-left space-y-2 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <DollarSign className="w-5 h-5 text-purple-500 mr-2" />
            {feature}
          </li>
        ))}
      </ul>
      <Button
        className={highlighted ? "bg-purple-600 hover:bg-purple-700" : ""}
        variant={highlighted ? "default" : "outline"}
      >
        Choose Plan
      </Button>
    </div>
  );
}
