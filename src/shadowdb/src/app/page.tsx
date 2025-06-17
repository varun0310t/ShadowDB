"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Database, Shield, Zap, Cloud, DollarSign, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { FeatureCard } from "./Components/FeatureCard";
import { renderAuthButton } from "./Components/RendarAuthButton";
import { ArchitectureSection } from "./Components/ArchitechitureSection";
import { FooterSection } from "./Components/Footer";
import { PricingSection } from "./Components/PricingSection";
import { FAQSection } from "./Components/FAQSection";
export default function Home() {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);

  // Use this to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-auto bg-gray-900 text-white">
      {/* Header */}
      <header className="py-4 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Database className="w-8 h-8 text-purple-500" />
          <span className="text-2xl font-bold">ShadowDB</span>
        </div>
        <nav className="hidden md:flex space-x-6">
          <Link
            href="#features"
            className="hover:text-purple-400 transition-colors"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="hover:text-purple-400 transition-colors"
          >
            Pricing
          </Link>          <Link
            href="#faq"
            className="hover:text-purple-400 transition-colors"
          >
            FAQ
          </Link>
        </nav>
        {renderAuthButton(isClient, status)}
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-20 bg-gradient-to-b from-gray-900 to-gray-800">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Production-Ready Database{" "}
          <span className="text-purple-500">as a Service</span>
        </h1>
        <p className="text-xl mb-8 max-w-2xl">
          Scale your applications with ease using ShadowDB's powerful, reliable,
          and secure database solution.
        </p>
        {isClient && status === "authenticated" ? (
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
            <Link href="/Home">Go to Dashboard</Link>
          </Button>
        ) : (
          <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
            <Link href="/Users/login">Sign Up Now</Link>
          </Button>
        )}
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose ShadowDB?
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <FeatureCard
            icon={<Zap className="w-12 h-12 text-purple-500" />}
            title="In build Redis Caching"
            description="Experience unparalleled speed with our optimized database architecture."
          />
          <FeatureCard
            icon={<Shield className="w-12 h-12 text-purple-500" />}
            title="Produciton Ready"
            description="Read and Write replicas, automated backups, and 24/7 monitoring."
          />
          <FeatureCard
            icon={<Cloud className="w-12 h-12 text-purple-500" />}
            title="Scalable Cloud"
            description="Grow your database effortlessly with our auto-scaling cloud infrastructure."
          />
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />      {/* FAQ Section */}
      <FAQSection />

     
      {/* Footer */}
      <FooterSection />
      {/* Bottom Spacer */}
    </div>
  );
}