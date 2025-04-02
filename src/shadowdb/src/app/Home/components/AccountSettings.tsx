"use client"

import type React from "react"

import { useState } from "react"
import { User, Shield, Bell, CreditCard, Key, LogOut, Copy, Check, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { signOut } from "next-auth/react"

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState("profile")
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="container mx-auto animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="bg-[#151923] border-gray-800 sticky top-6">
            <CardContent className="p-4">
              <div className="flex flex-col items-center py-6">
                <Avatar className="h-24 w-24 mb-4 border-2 border-purple-500">
                  <AvatarImage src="/placeholder.svg?height=96&width=96" alt="User" />
                  <AvatarFallback className="bg-purple-800 text-xl">JD</AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-semibold">John Doe</h3>
                <p className="text-gray-400 text-sm">john.doe@example.com</p>
                <Badge className="mt-2 bg-purple-600">Pro Plan</Badge>
              </div>

              <nav className="mt-6 space-y-1">
                <AccountNavItem
                  icon={<User size={18} />}
                  title="Profile"
                  active={activeTab === "profile"}
                  onClick={() => setActiveTab("profile")}
                />
                <AccountNavItem
                  icon={<Shield size={18} />}
                  title="Security"
                  active={activeTab === "security"}
                  onClick={() => setActiveTab("security")}
                />
                <AccountNavItem
                  icon={<Bell size={18} />}
                  title="Notifications"
                  active={activeTab === "notifications"}
                  onClick={() => setActiveTab("notifications")}
                />
                <AccountNavItem
                  icon={<CreditCard size={18} />}
                  title="Billing"
                  active={activeTab === "billing"}
                  onClick={() => setActiveTab("billing")}
                />
                <AccountNavItem
                  icon={<Key size={18} />}
                  title="API Keys"
                  active={activeTab === "api"}
                  onClick={() => setActiveTab("api")}
                />
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-800">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  onClick={() => signOut()}
                >
                  <LogOut size={18} className="mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-[#151923] border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700"
                      onClick={() => setEditing(!editing)}
                    >
                      {editing ? "Cancel" : <Edit2 size={16} className="mr-2" />}
                      {editing ? "Cancel" : "Edit Profile"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-gray-200">Full Name</Label>
                      <Input
                        id="fullName"
                        defaultValue="John Doe"
                        className="bg-[#0B0F17] border-gray-800 text-white"
                        disabled={!editing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-200">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        defaultValue="john.doe@example.com"
                        className="bg-[#0B0F17] border-gray-800 text-white"
                        disabled={!editing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-gray-200">Company</Label>
                      <Input
                        id="company"
                        defaultValue="Acme Inc"
                        className="bg-[#0B0F17] border-gray-800 text-white"
                        disabled={!editing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-gray-200">Job Title</Label>
                      <Input
                        id="role"
                        defaultValue="Database Administrator"
                        className="bg-[#0B0F17] border-gray-800 text-white"
                        disabled={!editing}
                      />
                    </div>
                  </div>

                  {editing && (
                    <div className="flex justify-end">
                      <Button className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#151923] border-gray-800">
                <CardHeader>
                  <CardTitle>Account Preferences</CardTitle>
                  <CardDescription>Manage your account settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Dark Mode</Label>
                      <p className="text-gray-200">Use dark theme across the application</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Time Zone</Label>
                      <p className="text-gray-200">Current: UTC-05:00 (Eastern Time)</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-gray-700">
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Language</Label>
                      <p className="text-gray-200">Current: English (US)</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-gray-700">
                      Change
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card className="bg-[#151923] border-gray-800">
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>Update your password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-gray-200">Current Password</Label>
                    <Input id="currentPassword" type="password" className="bg-[#0B0F17] border-gray-800 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-gray-200">New Password</Label>
                    <Input id="newPassword" type="password" className="bg-[#0B0F17] border-gray-800 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-200">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" className="bg-[#0B0F17] border-gray-800 text-white" />
                  </div>
                  <div className="pt-2">
                    <Button className="bg-purple-600 hover:bg-purple-700">Update Password</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#151923] border-gray-800">
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-400">Protect your account with 2FA</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Login Notifications</Label>
                      <p className="text-sm text-gray-400">Get notified of new logins to your account</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Session Management</Label>
                      <p className="text-sm text-gray-400">Manage your active sessions</p>
                    </div>
                    <Button variant="outline" size="sm" className="border-gray-700">
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="bg-[#151923] border-gray-800">
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Manage how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Email Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-security">Security Alerts</Label>
                        <Switch id="email-security" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-updates">Product Updates</Label>
                        <Switch id="email-updates" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-marketing">Marketing</Label>
                        <Switch id="email-marketing" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="email-usage">Usage Reports</Label>
                        <Switch id="email-usage" defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">In-App Notifications</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="app-security">Security Alerts</Label>
                        <Switch id="app-security" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="app-updates">Product Updates</Label>
                        <Switch id="app-updates" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="app-usage">Usage Alerts</Label>
                        <Switch id="app-usage" defaultChecked />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button className="bg-purple-600 hover:bg-purple-700">Save Preferences</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              <Card className="bg-[#151923] border-gray-800">
                <CardHeader>
                  <CardTitle>Current Plan</CardTitle>
                  <CardDescription>Manage your subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
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

                  <div className="pt-4">
                    <h3 className="text-lg font-medium mb-4">Billing History</h3>
                    <div className="rounded-md border border-gray-800">
                      <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm text-gray-200">
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
                              <td className="p-4 align-middle">Apr 1, 2024</td>
                              <td className="p-4 align-middle">$49.99</td>
                              <td className="p-4 align-middle">
                                <Badge className="bg-green-600">Paid</Badge>
                              </td>
                              <td className="p-4 align-middle text-right">
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                  Download
                                </Button>
                              </td>
                            </tr>
                            <tr className="border-b border-gray-800">
                              <td className="p-4 align-middle">Mar 1, 2024</td>
                              <td className="p-4 align-middle">$49.99</td>
                              <td className="p-4 align-middle">
                                <Badge className="bg-green-600">Paid</Badge>
                              </td>
                              <td className="p-4 align-middle text-right">
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                  Download
                                </Button>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-4 align-middle">Feb 1, 2024</td>
                              <td className="p-4 align-middle">$49.99</td>
                              <td className="p-4 align-middle">
                                <Badge className="bg-green-600">Paid</Badge>
                              </td>
                              <td className="p-4 align-middle text-right">
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                                  Download
                                </Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Keys Tab */}
            <TabsContent value="api" className="space-y-6">
              <Card className="bg-[#151923] border-gray-800">
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
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

                    <div className="p-4 border border-gray-800 rounded-md bg-[#0B0F17]">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Development API Key</h4>
                          <p className="text-sm text-gray-400 mt-1">Created on Feb 10, 2024</p>
                        </div>
                        <Badge className="bg-green-600">Active</Badge>
                      </div>
                      <div className="mt-4 flex items-center">
                        <code className="bg-gray-900 p-2 rounded text-gray-300 font-mono text-sm flex-1 overflow-x-auto">
                          sdb_dev_••••••••••••••••••••••••••••••
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-700"
                          onClick={() => copyToClipboard("sdb_dev_z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4")}
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function AccountNavItem({
  icon,
  title,
  active,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-all duration-200 ${
        active ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white" : "text-gray-300 hover:bg-gray-700"
      }`}
    >
      {icon}
      <span>{title}</span>
    </button>
  )
}

