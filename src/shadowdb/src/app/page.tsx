"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Database, Shield, Zap, Cloud, DollarSign, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Home() {
  const { data: session, status } = useSession();
  const [isClient, setIsClient] = useState(false);

  // Use this to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auth button content and redirect logic
  const renderAuthButton = () => {
    // Only render content once we're on client-side
    if (!isClient) return <Button variant="outline" className="text-black">Loading...</Button>;

    if (status === "authenticated") {
      return (
        <Button variant="outline" className="hidden md:inline-flex text-black">
          <Link href="/Home">Dashboard</Link>
        </Button>
      );
    } else {
      return (
        <Button variant="outline" className="hidden md:inline-flex text-black">
          <Link href="/Users/login">Sign In</Link>
        </Button>
      );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto bg-gray-900 text-white">
      {/* Header */}
      <header className="py-4 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Database className="w-8 h-8 text-purple-500" />
          <span className="text-2xl font-bold">ShadowDB</span>
        </div>
        <nav className="hidden md:flex space-x-6">
          <Link href="#features" className="hover:text-purple-400 transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="hover:text-purple-400 transition-colors">
            Pricing
          </Link>
          <Link href="#testimonials" className="hover:text-purple-400 transition-colors">
            Testimonials
          </Link>
        </nav>
        {renderAuthButton()}
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center text-center px-4 py-20 bg-gradient-to-b from-gray-900 to-gray-800">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Production-Ready Database <span className="text-purple-500">as a Service</span>
        </h1>
        <p className="text-xl mb-8 max-w-2xl">
          Scale your applications with ease using ShadowDB's powerful, reliable, and secure database solution.
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
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose ShadowDB?</h2>
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
      <section id="pricing" className="py-20 px-4 bg-gray-800">
        <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <PricingCard
            title="Starter"
            price="$29"
            features={["Up to 10GB storage", "1,000 requests/day", "Basic support", "1 database"]}
          />
          <PricingCard
            title="Pro"
            price="$99"
            features={["Up to 100GB storage", "10,000 requests/day", "24/7 support", "5 databases"]}
            highlighted={true}
          />
          <PricingCard
            title="Enterprise"
            price="Custom"
            features={["Unlimited storage", "Unlimited requests", "Dedicated support", "Unlimited databases"]}
          />
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <TestimonialCard
            quote="ShadowDB has revolutionized our data management. It's fast, reliable, and incredibly easy to use."
            author="Jane Doe"
            company="Tech Innovators Inc."
          />
          <TestimonialCard
            quote="The scalability of ShadowDB allowed us to grow our startup without worrying about database limitations."
            author="John Smith"
            company="GrowFast Startups"
          />
        </div>
      </section>

      {/* architechture Section */}
      <section className="py-20 px-4 bg-purple-600 text-center">
        <h2 className="text-3xl font-bold mb-6">Curious how we manage your data ?</h2>
        <p className="text-xl mb-8">  We ensure security, scalability, and reliability with a modern architecture. </p>
        {isClient && status === "authenticated" ? (
          <Button size="lg" variant="secondary">
            <Link href="/System-Design">Our Architecture</Link>
          </Button>
        ) : (
          <Button size="lg" variant="secondary">
            <Link href="/System-Design">Our Architecture</Link>
          </Button>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold mb-4">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors">
                  Case Studies
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-purple-400 transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-center text-sm text-gray-400">
          © {new Date().getFullYear()} ShadowDB. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg text-center">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  )
}

function PricingCard({ title, price, features, highlighted = false }: { title: string; price: string; features: string[]; highlighted?: boolean }) {
  return (
    <div className={`bg-gray-800 p-6 rounded-lg text-center ${highlighted ? "ring-2 ring-purple-500" : ""}`}>
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
  )
}

function TestimonialCard({ quote, author, company }: { quote: string; author: string; company: string }) {
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <p className="mb-4 italic">"{quote}"</p>
      <div className="flex items-center">
        <Users className="w-10 h-10 text-purple-500 mr-3" />
        <div>
          <p className="font-semibold">{author}</p>
          <p className="text-sm text-gray-400">{company}</p>
        </div>
      </div>
    </div>
  )
}

