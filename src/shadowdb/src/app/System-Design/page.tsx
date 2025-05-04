import Link from "next/link"
import { Database } from "lucide-react"
import Image from "next/image"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Database className="h-6 w-6 text-purple-500" />
          <span className="font-semibold">ShadowDB</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
            Testimonials
          </Link>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">System Architecture</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Discover how ShadowDB's architecture ensures high availability, scalability, and reliability through its
            sophisticated multi-layered design.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="mb-16">
          <div className="relative w-full aspect-[16/9] bg-[#151923] rounded-lg overflow-hidden border border-gray-800">
            <Image
              src="/image.png"
              alt="ShadowDB System Architecture"
              fill
              className="object-contain p-4"
            />
          </div>
        </div>

        {/* Architecture Components */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle className="text-purple-500">Security and Load Balancing</CardTitle>
              <CardDescription>Frontend protection and traffic distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-400">
                <li>• Advanced load balancing algorithms</li>
                <li>• DDoS protection</li>
                <li>• SSL/TLS encryption</li>
                <li>• Request filtering and validation</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle className="text-purple-500">Backend Services</CardTitle>
              <CardDescription>Express/Fastify powered API layer</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-400">
                <li>• High-performance Node.js runtime</li>
                <li>• Connection pooling</li>
                <li>• Query optimization</li>
                <li>• Request handling and routing</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle className="text-purple-500">Query Cache</CardTitle>
              <CardDescription>Intelligent caching system</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-400">
                <li>• In-memory cache storage</li>
                <li>• Automatic cache invalidation</li>
                <li>• Cache hit ratio monitoring</li>
                <li>• Configurable cache policies</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle className="text-purple-500">Database Layer</CardTitle>
              <CardDescription>Distributed database system</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-400">
                <li>• Primary-replica architecture</li>
                <li>• Automatic failover</li>
                <li>• Data replication</li>
                <li>• Read/write split optimization</li>
              </ul>
            </CardContent>
          </Card>

         {/*  <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle className="text-purple-500">Queue System</CardTitle>
              <CardDescription>Reliable message processing</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-400">
                <li>• Failed query retry mechanism</li>
                <li>• Queue monitoring</li>
                <li>• Dead letter queues</li>
                <li>• Priority queue support</li>
              </ul>
            </CardContent>
          </Card>
 */}
          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle className="text-purple-500">Monitoring & Analytics</CardTitle>
              <CardDescription>Real-time system insights</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-400">
                <li>• Prometheus metrics collection</li>
                <li>• Grafana dashboards</li>
                <li>• Alert management</li>
                <li>• Performance analytics</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8">Experience the power of our robust architecture firsthand.</p>
          <Button className="bg-purple-600 hover:bg-purple-700">Start Free Trial</Button>
        </div>
      </main>
    </div>
  )
}

