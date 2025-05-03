import { useState } from "react"
import { Key, Shield, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ApiKeysTab() {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="bg-[#151923] border-gray-800">
      <CardHeader>
        <CardTitle className="text-gray-200">API Keys</CardTitle>
        <CardDescription>Manage your API keys for programmatic access</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium">Your API Keys</h3>
            <p className="text-sm text-gray-400">Use these keys to authenticate API requests</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Key size={16} className="mr-2" />
            Generate New Key
          </Button>
        </div>

        {/* API Keys List */}
        <div className="space-y-4">
          <div className="p-4 border border-gray-800 rounded-md bg-[#0B0F17]">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium">Production API Key</h4>
                <p className="text-sm text-gray-400 mt-1">Created on Mar 15, 2024</p>
              </div>
              <Badge className="bg-green-600">Active</Badge>
            </div>
            <div className="mt-4 flex items-center">
              <code className="bg-gray-900 p-2 rounded text-gray-300 font-mono text-sm flex-1 overflow-x-auto">
                sdb_prod_••••••••••••••••••••••••••••••
              </code>
              <Button
                variant="outline"
                size="icon"
                className="ml-2 border-gray-700"
                onClick={() => copyToClipboard("sdb_prod_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6")}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" className="border-red-800 text-red-400 hover:bg-red-900/20">
                Revoke
              </Button>
            </div>
          </div>
        </div>

        {/* Security Best Practices */}
        <div className="bg-[#0B0F17] rounded-md p-4 border border-gray-800 mt-6">
          <h4 className="font-medium flex items-center">
            <Shield size={16} className="mr-2 text-purple-500" />
            API Security Best Practices
          </h4>
          <ul className="mt-2 space-y-2 text-sm text-gray-400">
            <li>• Never share your API keys in public repositories or client-side code</li>
            <li>• Rotate your API keys regularly for enhanced security</li>
            <li>• Use different API keys for development and production environments</li>
            <li>• Set up IP restrictions to limit access to your API keys</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
