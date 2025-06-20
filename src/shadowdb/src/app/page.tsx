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
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
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
          </Link>{" "}
          <Link href="#faq" className="hover:text-purple-400 transition-colors">
            FAQ
          </Link>
        </nav>
        {renderAuthButton(isClient, status)}
      </header>{" "}
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-4 py-20 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-bounce"
            style={{ animationDuration: "3s" }}
          ></div>
          <div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-purple-400/10 rounded-full blur-2xl animate-spin"
            style={{ animationDuration: "20s" }}
          ></div>
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-2 h-2 bg-purple-400 rounded-full animate-float-1"></div>
          <div className="absolute top-40 right-32 w-1 h-1 bg-blue-400 rounded-full animate-float-2"></div>
          <div className="absolute bottom-32 left-16 w-1.5 h-1.5 bg-purple-300 rounded-full animate-float-3"></div>
          <div
            className="absolute bottom-40 right-20 w-2 h-2 bg-blue-300 rounded-full animate-float-1"
            style={{ animationDelay: "2s" }}
          ></div>
          <div
            className="absolute top-32 left-1/2 w-1 h-1 bg-purple-200 rounded-full animate-float-2"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in-up">
            Production-Ready Database{" "}
            <span className="text-purple-500 inline-block animate-gradient-text bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              as a Service
            </span>
          </h1>
          <p
            className="text-xl mb-8 max-w-2xl animate-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            Scale your applications with ease using ShadowDB's powerful,
            reliable, and secure database solution.
          </p>
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            {isClient && status === "authenticated" ? (
              <Button
                onClick={() => {
                  router.push("/Home");
                }}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                Dashboard
              </Button>
            ) : (
              <Button
                onClick={() => {
                  router.push("/Users/login");
                }}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                Sign Up Now
              </Button>
            )}
          </div>
        </div>
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
            description="Read and Write replicas, backups, and 24/7 monitoring."
          />
          <FeatureCard
            icon={<Cloud className="w-12 h-12 text-purple-500" />}
            title="Scalable Cloud"
            description="Grow your database effortlessly with our scaling cloud infrastructure."
          />
        </div>
      </section>
      {/* Pricing Section */}
      <PricingSection /> {/* FAQ Section */}
      <FAQSection />
      {/* Footer */}
      <FooterSection />
      {/* Bottom Spacer */}
    </div>
  );
}
