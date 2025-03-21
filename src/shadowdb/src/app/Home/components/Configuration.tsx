"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Database,
  Shield,
  Settings,
  Key,
  Save,
  RefreshCw,
  Copy,
  Trash2,
  Plus,
  AlertCircle,
  Server,
  Lock,
  HardDrive,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DatabaseEntry {
  id: number
  tenancy_type: "shared" | "isolated"
  db_name: string
  access_level: "admin" | "user"
  region?: string
  created_at?: string
  status?: "active" | "inactive" | "maintenance"
}

interface DatabaseConfigProps {
  databases: DatabaseEntry[]
}

export default function DatabaseConfiguration({ databases }: DatabaseConfigProps) {
  const [activeTab, setActiveTab] = useState("general")
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>("")
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseEntry | null>(null)
  const [apiTokens, setApiTokens] = useState<
    Array<{ id: string; name: string; created: string; lastUsed: string | null }>
  >([
    { id: "tok_1234567890", name: "Production API", created: "2023-12-01", lastUsed: "2023-12-15" },
    { id: "tok_0987654321", name: "Development API", created: "2023-11-15", lastUsed: null },
  ])
  const [newToken, setNewToken] = useState<{ token: string; name: string } | null>(null)
  const [isGeneratingToken, setIsGeneratingToken] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Update selected database when the ID changes
  useEffect(() => {
    if (selectedDatabaseId && databases.length > 0) {
      const database = databases.find((db) => db.id.toString() === selectedDatabaseId) || null

      // Enhance the database object with default values if properties are missing
      if (database) {
        setSelectedDatabase({
          ...database,
          region: database.region || "us-east-1",
          created_at: database.created_at || new Date().toISOString().split("T")[0],
          status: database.status || "active",
        })
        setIsLoading(false)
      }
    } else {
      setSelectedDatabase(null)
      setIsLoading(databases.length === 0)
    }
  }, [selectedDatabaseId, databases])

  // Set the first database as selected by default if none is selected
  useEffect(() => {
    if (databases.length > 0 && !selectedDatabaseId) {
      setSelectedDatabaseId(databases[0].id.toString())
    }
  }, [databases, selectedDatabaseId])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const generateNewToken = (tokenName: string) => {
    setIsGeneratingToken(true)

    // Simulate API call to generate token
    setTimeout(() => {
      const token = `sdb_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      setNewToken({ token, name: tokenName })
      setApiTokens([
        ...apiTokens,
        { id: token, name: tokenName, created: new Date().toISOString().split("T")[0], lastUsed: null },
      ])
      setIsGeneratingToken(false)
    }, 1000)
  }

  const deleteToken = (tokenId: string) => {
    setApiTokens(apiTokens.filter((token) => token.id !== tokenId))
  }

  // Show loading state if databases are loading or none are selected
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 animate-fadeIn">
        <Card className="bg-[#151923] border-gray-800">
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mb-4"></div>
            <h2 className="text-xl font-medium mb-2">Loading database configuration...</h2>
            <p className="text-gray-400">Please wait while we fetch your database details.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show database selection if no database is selected or multiple databases are available
  if (!selectedDatabase) {
    return (
      <div className="container mx-auto p-6 animate-fadeIn">
        <Card className="bg-[#151923] border-gray-800">
          <CardHeader>
            <CardTitle>Select Database</CardTitle>
            <CardDescription>Choose a database to configure</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {databases.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No Databases Available</h3>
                <p className="text-gray-400 mb-4">You don't have any databases yet.</p>
                <Button className="bg-purple-600 hover:bg-purple-700">Create Database</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Label htmlFor="database-select">Select a database to configure</Label>
                <Select value={selectedDatabaseId} onValueChange={setSelectedDatabaseId}>
                  <SelectTrigger id="database-select" className="w-full bg-[#0B0F17] border-gray-800">
                    <SelectValue placeholder="Select Database" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151923] border-gray-800">
                    {databases.map((db) => (
                      <SelectItem key={db.id} value={db.id.toString()}>
                        {db.db_name} ({db.tenancy_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-md bg-purple-600/20 flex items-center justify-center">
            <Database className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">{selectedDatabase.db_name}</h1>
              <Select value={selectedDatabaseId} onValueChange={setSelectedDatabaseId}>
                <SelectTrigger className="h-8 px-2 text-sm bg-transparent border-0 hover:bg-gray-800 focus:ring-0">
                  <span className="sr-only">Change database</span>
                </SelectTrigger>
                <SelectContent className="bg-[#151923] border-gray-800">
                  {databases.map((db) => (
                    <SelectItem key={db.id} value={db.id.toString()}>
                      {db.db_name} ({db.tenancy_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Badge
                className={
                  selectedDatabase.status === "active"
                    ? "bg-green-600"
                    : selectedDatabase.status === "maintenance"
                      ? "bg-yellow-600"
                      : "bg-red-600"
                }
              >
                {(selectedDatabase.status||"unknown").charAt(0).toUpperCase() + (selectedDatabase.status||"unknown").slice(1)}
              </Badge>
              <Badge className="bg-purple-600">
                {selectedDatabase.tenancy_type.charAt(0).toUpperCase() + selectedDatabase.tenancy_type.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gray-800 p-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-purple-600">
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-purple-600">
            <Server className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="backup" className="data-[state=active]:bg-purple-600">
            <HardDrive className="h-4 w-4 mr-2" />
            Backup & Recovery
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-purple-600">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-purple-600">
            <Key className="h-4 w-4 mr-2" />
            API Tokens
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle>Database Information</CardTitle>
              <CardDescription>View and update basic information about your database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="db_name">Database Name</Label>
                  <Input
                    id="db_name"
                    defaultValue={selectedDatabase.db_name}
                    className="bg-[#0B0F17] border-gray-800"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select defaultValue={selectedDatabase.region}>
                    <SelectTrigger className="bg-[#0B0F17] border-gray-800">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#151923] border-gray-800">
                      <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                      <SelectItem value="us-west-1">US West (N. California)</SelectItem>
                      <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                      <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="created">Created At</Label>
                  <Input
                    id="created"
                    value={selectedDatabase.created_at}
                    disabled
                    className="bg-[#0B0F17] border-gray-800 opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue={selectedDatabase.status}>
                    <SelectTrigger className="bg-[#0B0F17] border-gray-800">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#151923] border-gray-800">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle>Connection Settings</CardTitle>
              <CardDescription>Configure how applications connect to your database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="connection_string">Connection String</Label>
                <div className="flex">
                  <Input
                    id="connection_string"
                    value={`postgresql://user:password@${selectedDatabase.db_name}.shadowdb.com:5432/main`}
                    readOnly
                    className="bg-[#0B0F17] border-gray-800 font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="ml-2 border-gray-800"
                    onClick={() =>
                      copyToClipboard(`postgresql://user:password@${selectedDatabase.db_name}.shadowdb.com:5432/main`)
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SSL Enforcement</Label>
                  <p className="text-sm text-gray-400">Require SSL/TLS for all connections</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Connection Pooling</Label>
                  <p className="text-sm text-gray-400">Optimize connection management</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Settings */}
        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle>Resource Allocation</CardTitle>
              <CardDescription>Configure compute and memory resources</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>CPU Allocation</Label>
                  <span className="text-sm font-medium">2 vCPUs</span>
                </div>
                <Slider defaultValue={[2]} max={8} step={1} className="w-full" />
                <p className="text-xs text-gray-400">Adjust the number of virtual CPUs allocated to your database</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Memory</Label>
                  <span className="text-sm font-medium">4 GB</span>
                </div>
                <Slider defaultValue={[4]} max={32} step={1} className="w-full" />
                <p className="text-xs text-gray-400">Adjust the amount of RAM allocated to your database</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Storage</Label>
                  <span className="text-sm font-medium">100 GB</span>
                </div>
                <Slider defaultValue={[100]} max={1000} step={10} className="w-full" />
                <p className="text-xs text-gray-400">Adjust the storage capacity for your database</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle>Query Optimization</CardTitle>
              <CardDescription>Configure query performance settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Query Cache</Label>
                  <p className="text-sm text-gray-400">Cache frequently executed queries</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Vacuum</Label>
                  <p className="text-sm text-gray-400">Automatically clean up and optimize storage</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Query Timeout (seconds)</Label>
                <Input
                  type="number"
                  defaultValue="30"
                  min="1"
                  max="3600"
                  className="bg-[#0B0F17] border-gray-800 w-full md:w-1/3"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Recovery */}
        <TabsContent value="backup" className="space-y-4">
          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle>Backup Configuration</CardTitle>
              <CardDescription>Configure automated backup settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automated Backups</Label>
                  <p className="text-sm text-gray-400">Schedule regular database backups</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Backup Frequency</Label>
                <Select defaultValue="daily">
                  <SelectTrigger className="bg-[#0B0F17] border-gray-800 w-full md:w-1/3">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151923] border-gray-800">
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Retention Period (days)</Label>
                <Input
                  type="number"
                  defaultValue="7"
                  min="1"
                  max="365"
                  className="bg-[#0B0F17] border-gray-800 w-full md:w-1/3"
                />
              </div>

              <div className="pt-4">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Create Manual Backup
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle>Recent Backups</CardTitle>
              <CardDescription>View and restore from recent backups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-800">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-[#0B0F17]">
                      <tr className="border-b border-gray-800">
                        <th className="h-10 px-4 text-left font-medium text-gray-400">Backup ID</th>
                        <th className="h-10 px-4 text-left font-medium text-gray-400">Date</th>
                        <th className="h-10 px-4 text-left font-medium text-gray-400">Size</th>
                        <th className="h-10 px-4 text-left font-medium text-gray-400">Type</th>
                        <th className="h-10 px-4 text-left font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-800">
                        <td className="p-4 align-middle">bak_12345</td>
                        <td className="p-4 align-middle">2023-12-15 04:00 UTC</td>
                        <td className="p-4 align-middle">2.3 GB</td>
                        <td className="p-4 align-middle">
                          <Badge className="bg-green-600">Automated</Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <Button variant="outline" size="sm" className="border-gray-800">
                            Restore
                          </Button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-800">
                        <td className="p-4 align-middle">bak_12344</td>
                        <td className="p-4 align-middle">2023-12-14 04:00 UTC</td>
                        <td className="p-4 align-middle">2.2 GB</td>
                        <td className="p-4 align-middle">
                          <Badge className="bg-green-600">Automated</Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <Button variant="outline" size="sm" className="border-gray-800">
                            Restore
                          </Button>
                        </td>
                      </tr>
                      <tr>
                        <td className="p-4 align-middle">bak_12340</td>
                        <td className="p-4 align-middle">2023-12-13 15:30 UTC</td>
                        <td className="p-4 align-middle">2.2 GB</td>
                        <td className="p-4 align-middle">
                          <Badge className="bg-blue-600">Manual</Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <Button variant="outline" size="sm" className="border-gray-800">
                            Restore
                          </Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle>Access Control</CardTitle>
              <CardDescription>Configure who can access your database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>IP Allowlist</Label>
                  <p className="text-sm text-gray-400">Restrict access to specific IP addresses</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Allowed IP Addresses</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-[#0B0F17] text-gray-300 flex items-center gap-1 px-3 py-1">
                    192.168.1.1
                    <button className="ml-1 text-gray-400 hover:text-white">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                  <Badge className="bg-[#0B0F17] text-gray-300 flex items-center gap-1 px-3 py-1">
                    10.0.0.1/24
                    <button className="ml-1 text-gray-400 hover:text-white">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Badge>
                  <div className="flex">
                    <Input placeholder="Add IP address" className="bg-[#0B0F17] border-gray-800 h-8 text-sm" />
                    <Button variant="outline" size="sm" className="ml-2 h-8 border-gray-800">
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label>Password Policy</Label>
                  <p className="text-sm text-gray-400">Enforce strong database passwords</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audit Logging</Label>
                  <p className="text-sm text-gray-400">Log all database access and changes</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle>Encryption</CardTitle>
              <CardDescription>Configure database encryption settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data-at-Rest Encryption</Label>
                  <p className="text-sm text-gray-400">Encrypt stored database files</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data-in-Transit Encryption</Label>
                  <p className="text-sm text-gray-400">Encrypt all network traffic</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="space-y-2">
                <Label>Encryption Key Rotation</Label>
                <Select defaultValue="90days">
                  <SelectTrigger className="bg-[#0B0F17] border-gray-800 w-full md:w-1/3">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151923] border-gray-800">
                    <SelectItem value="30days">Every 30 days</SelectItem>
                    <SelectItem value="90days">Every 90 days</SelectItem>
                    <SelectItem value="180days">Every 180 days</SelectItem>
                    <SelectItem value="manual">Manual rotation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tokens */}
        <TabsContent value="api" className="space-y-4">
          <Card className="bg-[#151923] border-gray-800">
            <CardHeader>
              <CardTitle>API Tokens</CardTitle>
              <CardDescription>Manage API tokens for programmatic access to your database</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {newToken && (
                <div className="bg-purple-900/30 border border-purple-500 rounded-md p-4 mb-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-purple-400 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="space-y-2">
                      <p className="font-medium text-purple-300">New API token created: {newToken.name}</p>
                      <p className="text-sm text-purple-300">
                        Make sure to copy your token now. You won't be able to see it again!
                      </p>
                      <div className="flex mt-2">
                        <code className="bg-[#0B0F17] p-2 rounded text-purple-300 font-mono text-sm flex-1 overflow-x-auto">
                          {newToken.token}
                        </code>
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-purple-500 text-purple-300 hover:text-purple-100 hover:bg-purple-800"
                          onClick={() => copyToClipboard(newToken.token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 border-purple-500 text-purple-300 hover:bg-purple-800"
                        onClick={() => setNewToken(null)}
                      >
                        I've copied my token
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Your API Tokens</h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Key className="h-4 w-4 mr-2" />
                      Generate New Token
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#151923] border-gray-800">
                    <DialogHeader>
                      <DialogTitle>Create API Token</DialogTitle>
                      <DialogDescription>
                        Create a new API token to access your database programmatically.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="token-name">Token Name</Label>
                        <Input
                          id="token-name"
                          placeholder="e.g. Production API"
                          className="bg-[#0B0F17] border-gray-800"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Token Permissions</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Switch id="read" defaultChecked />
                            <Label htmlFor="read">Read</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="write" defaultChecked />
                            <Label htmlFor="write">Write</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="delete" />
                            <Label htmlFor="delete">Delete</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                          const tokenNameInput = document.getElementById("token-name") as HTMLInputElement
                          generateNewToken(tokenNameInput.value || "Unnamed Token")
                        }}
                        disabled={isGeneratingToken}
                      >
                        {isGeneratingToken ? (
                          <>
                            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                            Generating...
                          </>
                        ) : (
                          "Generate Token"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="rounded-md border border-gray-800">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="bg-[#0B0F17]">
                      <tr className="border-b border-gray-800">
                        <th className="h-10 px-4 text-left font-medium text-gray-400">Name</th>
                        <th className="h-10 px-4 text-left font-medium text-gray-400">Created</th>
                        <th className="h-10 px-4 text-left font-medium text-gray-400">Last Used</th>
                        <th className="h-10 px-4 text-right font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiTokens.map((token) => (
                        <tr key={token.id} className="border-b border-gray-800">
                          <td className="p-4 align-middle font-medium">{token.name}</td>
                          <td className="p-4 align-middle text-gray-400">{token.created}</td>
                          <td className="p-4 align-middle text-gray-400">{token.lastUsed || "Never"}</td>
                          <td className="p-4 align-middle text-right">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-gray-400 hover:text-white"
                                    onClick={() => deleteToken(token.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete token</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-[#0B0F17] rounded-md p-4 border border-gray-800">
                <h4 className="font-medium flex items-center">
                  <Lock className="h-4 w-4 mr-2 text-purple-500" />
                  API Token Security
                </h4>
                <p className="text-sm text-gray-400 mt-2">
                  API tokens provide full access to your database. Keep them secure and rotate them regularly. Tokens
                  are transmitted securely and stored using one-way encryption.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

