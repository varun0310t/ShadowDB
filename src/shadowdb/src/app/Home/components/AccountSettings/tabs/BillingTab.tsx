import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TabWrapper } from "../TabWrapper"

export function BillingTab() {
  return (
    <TabWrapper>
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/50 rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-white">Pro Plan</h3>
                <p className="text-gray-300 mt-1">$49.99/month</p>
                <ul className="mt-4 space-y-2 text-sm text-gray-300">
                  <li className="flex items-center">
                    <Check size={16} className="text-green-400 mr-2" />
                    Up to 10 databases
                  </li>
                  <li className="flex items-center">
                    <Check size={16} className="text-green-400 mr-2" />
                    100GB storage per database
                  </li>
                  <li className="flex items-center">
                    <Check size={16} className="text-green-400 mr-2" />
                    Priority support
                  </li>
                  <li className="flex items-center">
                    <Check size={16} className="text-green-400 mr-2" />
                    Advanced analytics
                  </li>
                </ul>
              </div>
              <Badge className="bg-purple-600">Current Plan</Badge>
            </div>
            <div className="mt-6 flex space-x-3">
              <Button variant="outline" className="border-purple-500 text-purple-300 hover:bg-purple-900/30">
                Change Plan
              </Button>
              <Button variant="outline" className="border-red-500 text-red-300 hover:bg-red-900/30">
                Cancel Subscription
              </Button>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="pt-4">
            <h3 className="text-lg font-medium mb-4">Payment Method</h3>
            <div className="flex items-center p-4 border border-gray-800 rounded-md bg-[#0B0F17]">
              <div className="h-10 w-14 bg-gradient-to-r from-blue-600 to-blue-400 rounded-md mr-4 flex items-center justify-center text-white font-bold">
                VISA
              </div>
              <div>
                <p className="font-medium">Visa ending in 4242</p>
                <p className="text-sm text-gray-400">Expires 12/2025</p>
              </div>
              <Button variant="ghost" size="sm" className="ml-auto">
                Update
              </Button>
            </div>
          </div>

          {/* Billing History Section */}
          <div className="pt-4">
            <h3 className="text-lg font-medium mb-4">Billing History</h3>
            <div className="rounded-md border border-gray-800">
              <table className="w-full caption-bottom text-sm">
                <thead className="bg-[#0B0F17]">
                  <tr className="border-b border-gray-800">
                    <th className="h-10 px-4 text-left font-medium text-gray-400">Date</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">Amount</th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">Status</th>
                    <th className="h-10 px-4 text-right font-medium text-gray-400">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-800">
                    <td className="p-4">Apr 1, 2024</td>
                    <td className="p-4">$49.99</td>
                    <td className="p-4"><Badge className="bg-green-600">Paid</Badge></td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">Download</Button>
                    </td>
                  </tr>
                  {/* Add more rows as needed */}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </TabWrapper>
  )
}
