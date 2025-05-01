"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Copy, Save, Loader2 } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "@/hooks/use-toast"

// New component for connection attributes dialog
interface ConnectionAttributesDialogProps {
  connectionType: string
  connectionAttributes: {
    host: string
    port: string
    dbname: string
    user: string
    password: string
    sslmode: string
  }
  copyToClipboard: (text: string) => void
}

function ConnectionAttributesDialog({
  connectionType,
  connectionAttributes,
  copyToClipboard,
}: ConnectionAttributesDialogProps) {
  const { host, port, dbname, user, password, sslmode } = connectionAttributes

  // Create full connection string for easy copy
  const fullConnectionString = Object.entries(connectionAttributes)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ")

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="border-gray-800 text-gray-200 text-xs h-8">
        View Attributes
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#151923] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">{connectionType} Connection Attributes</DialogTitle>
          <DialogDescription className="text-gray-400">
            Copy individual attributes or the full connection string
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label className="text-gray-200">Host</Label>
            <div className="flex">
              <Input value={host} readOnly className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300" />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 border-gray-800 text-gray-800"
                onClick={() => copyToClipboard(`host=${host}`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">Port</Label>
            <div className="flex">
              <Input value={port} readOnly className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300" />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 border-gray-800 text-gray-800"
                onClick={() => copyToClipboard(`port=${port}`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">Database</Label>
            <div className="flex">
              <Input value={dbname} readOnly className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300" />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 border-gray-800 text-gray-800"
                onClick={() => copyToClipboard(`dbname=${dbname}`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">User</Label>
            <div className="flex">
              <Input value={user} readOnly className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300" />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 border-gray-800 text-gray-800"
                onClick={() => copyToClipboard(`user=${user}`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">Password</Label>
            <div className="flex">
              <Input
                value={password}
                readOnly
                className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 border-gray-800 text-gray-800"
                onClick={() => copyToClipboard(`password=${password}`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">SSL Mode</Label>
            <div className="flex">
              <Input
                value={sslmode}
                readOnly
                className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 border-gray-800 text-gray-800"
                onClick={() => copyToClipboard(`sslmode=${sslmode}`)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Label className="text-gray-200">Full Connection String</Label>
          <div className="flex">
            <Input
              value={fullConnectionString}
              readOnly
              className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
            />
            <Button
              variant="outline"
              size="icon"
              className="ml-2 border-gray-800 text-gray-800"
              onClick={() => copyToClipboard(fullConnectionString)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Main component
interface DatabaseEntry {
  id: number
  tenancy_type: "shared" | "isolated"
  db_name: string
  access_level: "admin" | "user"
  region?: string
  created_at?: string
  status?: "active" | "inactive" | "maintenance"
  db_user?: string
  db_password?: string
  haproxy?: {
    write_port?: number
    read_port?: number
  }
  pgpool?: {
    port?: number
    enable_connection_pooling?: boolean
    enable_query_cache?: boolean
  }
}

interface GeneralTabProps {
  selectedDatabase: DatabaseEntry
  copyToClipboard: (text: string) => void
  refetchDatabases: () => Promise<any> // Add this prop to enable database refetching
}

export function GeneralTab({ selectedDatabase, copyToClipboard, refetchDatabases }: GeneralTabProps) {
  const [dbName, setDbName] = useState(selectedDatabase.db_name)
  const [originalDbName, setOriginalDbName] = useState(selectedDatabase.db_name)
  // Get the shared QueryClient from context rather than creating a new instance
  const queryClient = useQueryClient()

  const updateDbNameMutation = useMutation({
    mutationFn: () =>
      UpdateDatabaseName({
        tenancy_type: selectedDatabase.tenancy_type,
        Original_DB_Name: originalDbName,
        New_DB_Name: dbName,
        database_id: selectedDatabase.id,
      }),
    onSuccess: async (data) => {
      if (data.RenameResult.success) {
        toast({
          title: "Database updated",
          description: "Database name has been successfully updated.",
          variant: "default",
        })
        // Update the original name to match the new name
        setOriginalDbName(dbName)

        // Invalidate queries and refetch databases
        queryClient.invalidateQueries({ queryKey: ["databases"] })

        // Explicitly refetch database list to update UI
        await refetchDatabases()
      } else {
        toast({
          title: "Update failed",
          description: data.RenameResult.message || "Failed to update database name",
          variant: "destructive",
        })
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to update database name",
        variant: "destructive",
      })
    },
  })

  // Update the dbName and originalDbName when selectedDatabase changes
  useEffect(() => {
    setDbName(selectedDatabase.db_name)
    setOriginalDbName(selectedDatabase.db_name)
  }, [selectedDatabase.db_name])

  const handleSaveDbName = () => {
    if (dbName !== originalDbName) {
      updateDbNameMutation.mutate()
    }
  }

  const nameChanged = dbName !== originalDbName

  return (
    <div className="space-y-4">
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Database Information</CardTitle>
          <CardDescription className="text-gray-400">
            View and update basic information about your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="db_name" className="text-gray-200">
                Database Name
              </Label>
              <div className="flex">
                <Input
                  id="db_name"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  className="bg-[#0B0F17] border-gray-800 text-white"
                />
                {nameChanged && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 border-gray-800 text-gray-800"
                    onClick={handleSaveDbName}
                    disabled={updateDbNameMutation.isPending}
                  >
                    {updateDbNameMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              {nameChanged && <p className="text-xs text-amber-400">Click save button to update the database name</p>}
              {updateDbNameMutation.isError && (
                <p className="text-xs text-red-500">
                  {updateDbNameMutation.error?.message || "Failed to update database name"}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="region" className="text-gray-200">
                Region
              </Label>
              <Select defaultValue={selectedDatabase.region}>
                <SelectTrigger className="bg-[#0B0F17] border-gray-800 text-white">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="bg-[#151923] border-gray-800 text-white">
                  <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                  <SelectItem value="us-west-1">US West (N. California)</SelectItem>
                  <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                  <SelectItem value="ap-southeast-1">Asia Pacific (Singapore)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="created" className="text-gray-200">
                Created At
              </Label>
              <Input
                id="created"
                value={selectedDatabase.created_at}
                disabled
                className="bg-[#0B0F17] border-gray-800 opacity-70 text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-200">
                Status
              </Label>
              <Select defaultValue={selectedDatabase.status}>
                <SelectTrigger className="bg-[#0B0F17] border-gray-800 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#151923] border-gray-800 text-white">
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
          <CardTitle className="text-white">Connection Settings</CardTitle>
          <CardDescription className="text-gray-400">
            Configure how applications connect to your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary PostgreSQL Connection */}
          <div className="space-y-2">
            <Label htmlFor="connection_string" className="text-gray-200">
              Primary Database Connection
            </Label>
            <div className="flex">
              <Input
                id="connection_string"
                value={`postgresql://${selectedDatabase.db_user || "postgres"}:${
                  selectedDatabase.db_password || "password"
                }@${selectedDatabase.db_name}.shadowdb.com:5432/${selectedDatabase.db_name}`}
                readOnly
                className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 border-gray-800 text-gray-800"
                onClick={() =>
                  copyToClipboard(
                    `postgresql://${selectedDatabase.db_user || "postgres"}:${
                      selectedDatabase.db_password || "password"
                    }@${selectedDatabase.db_name}.shadowdb.com:5432/${selectedDatabase.db_name}`,
                  )
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2 border-gray-800 text-gray-800 text-xs h-8">
                  View Attributes
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#151923] border-gray-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Primary Database Connection Attributes</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Copy individual attributes or the full connection string
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-gray-200">Host</Label>
                      <div className="flex">
                        <Input
                          value={`${selectedDatabase.db_name}.shadowdb.com`}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() =>
                            copyToClipboard(`host=${selectedDatabase.db_name}.shadowdb.com`)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Port</Label>
                      <div className="flex">
                        <Input
                          value="5432"
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard("port=5432")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Database</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.db_name}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`dbname=${selectedDatabase.db_name}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">User</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.db_user || "postgres"}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`user=${selectedDatabase.db_user || "postgres"}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Password</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.db_password || "password"}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`password=${selectedDatabase.db_password || "password"}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">SSL Mode</Label>
                      <div className="flex">
                        <Input
                          value="require"
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard("sslmode=require")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label className="text-gray-200">Full Connection String</Label>
                    <div className="flex">
                      <Input
                        value={`host=${selectedDatabase.db_name}.shadowdb.com port=5432 dbname=${selectedDatabase.db_name} user=${selectedDatabase.db_user || "postgres"} password=${selectedDatabase.db_password || "password"} sslmode=require`}
                        readOnly
                        className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2 border-gray-800 text-gray-800"
                        onClick={() =>
                          copyToClipboard(
                            `host=${selectedDatabase.db_name}.shadowdb.com port=5432 dbname=${selectedDatabase.db_name} user=${selectedDatabase.db_user || "postgres"} password=${selectedDatabase.db_password || "password"} sslmode=require`,
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* HAProxy Write Connection */}
          <div className="space-y-2">
            <Label htmlFor="haproxy_write" className="text-gray-200">
              HAProxy Write Endpoint (Primary)
            </Label>
            <div className="flex">
              <Input
                id="haproxy_write"
                value={`postgresql://${selectedDatabase.db_user || "postgres"}:${
                  selectedDatabase.db_password || "password"
                }@${selectedDatabase.db_name}-write.shadowdb.com:${selectedDatabase.haproxy?.write_port || 5000}/${
                  selectedDatabase.db_name
                }`}
                readOnly
                className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 border-gray-800 text-gray-800"
                onClick={() =>
                  copyToClipboard(
                    `postgresql://${selectedDatabase.db_user || "postgres"}:${
                      selectedDatabase.db_password || "password"
                    }@${selectedDatabase.db_name}-write.shadowdb.com:${selectedDatabase.haproxy?.write_port || 5000}/${
                      selectedDatabase.db_name
                    }`,
                  )
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2 border-gray-800 text-gray-800 text-xs h-8">
                  View Attributes
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#151923] border-gray-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">HAProxy Write Endpoint Connection Attributes</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Copy individual attributes or the full connection string
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-gray-200">Host</Label>
                      <div className="flex">
                        <Input
                          value={`${selectedDatabase.db_name}-write.shadowdb.com`}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() =>
                            copyToClipboard(`host=${selectedDatabase.db_name}-write.shadowdb.com`)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Port</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.haproxy?.write_port || 5000}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`port=${selectedDatabase.haproxy?.write_port || 5000}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Database</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.db_name}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`dbname=${selectedDatabase.db_name}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">User</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.db_user || "postgres"}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`user=${selectedDatabase.db_user || "postgres"}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Password</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.db_password || "password"}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`password=${selectedDatabase.db_password || "password"}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">SSL Mode</Label>
                      <div className="flex">
                        <Input
                          value="require"
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard("sslmode=require")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label className="text-gray-200">Full Connection String</Label>
                    <div className="flex">
                      <Input
                        value={`host=${selectedDatabase.db_name}-write.shadowdb.com port=${selectedDatabase.haproxy?.write_port || 5000} dbname=${selectedDatabase.db_name} user=${selectedDatabase.db_user || "postgres"} password=${selectedDatabase.db_password || "password"} sslmode=require`}
                        readOnly
                        className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2 border-gray-800 text-gray-800"
                        onClick={() =>
                          copyToClipboard(
                            `host=${selectedDatabase.db_name}-write.shadowdb.com port=${selectedDatabase.haproxy?.write_port || 5000} dbname=${selectedDatabase.db_name} user=${selectedDatabase.db_user || "postgres"} password=${selectedDatabase.db_password || "password"} sslmode=require`,
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* HAProxy Read Connection */}
          <div className="space-y-2">
            <Label htmlFor="haproxy_read" className="text-gray-200">
              HAProxy Read Endpoint (Replicas)
            </Label>
            <div className="flex">
              <Input
                id="haproxy_read"
                value={`postgresql://${selectedDatabase.db_user || "postgres"}:${
                  selectedDatabase.db_password || "password"
                }@${selectedDatabase.db_name}-read.shadowdb.com:${selectedDatabase.haproxy?.read_port || 5001}/${
                  selectedDatabase.db_name
                }`}
                readOnly
                className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 border-gray-800 text-gray-800"
                onClick={() =>
                  copyToClipboard(
                    `postgresql://${selectedDatabase.db_user || "postgres"}:${
                      selectedDatabase.db_password || "password"
                    }@${selectedDatabase.db_name}-read.shadowdb.com:${selectedDatabase.haproxy?.read_port || 5001}/${
                      selectedDatabase.db_name
                    }`,
                  )
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2 border-gray-800 text-gray-800 text-xs h-8">
                  View Attributes
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#151923] border-gray-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">HAProxy Read Endpoint Connection Attributes</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Copy individual attributes or the full connection string
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-gray-200">Host</Label>
                      <div className="flex">
                        <Input
                          value={`${selectedDatabase.db_name}-read.shadowdb.com`}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() =>
                            copyToClipboard(`host=${selectedDatabase.db_name}-read.shadowdb.com`)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Port</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.haproxy?.read_port || 5001}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`port=${selectedDatabase.haproxy?.read_port || 5001}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Database</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.db_name}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`dbname=${selectedDatabase.db_name}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">User</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.db_user || "postgres"}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`user=${selectedDatabase.db_user || "postgres"}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Password</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.db_password || "password"}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`password=${selectedDatabase.db_password || "password"}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">SSL Mode</Label>
                      <div className="flex">
                        <Input
                          value="require"
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard("sslmode=require")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label className="text-gray-200">Full Connection String</Label>
                    <div className="flex">
                      <Input
                        value={`host=${selectedDatabase.db_name}-read.shadowdb.com port=${selectedDatabase.haproxy?.read_port || 5001} dbname=${selectedDatabase.db_name} user=${selectedDatabase.db_user || "postgres"} password=${selectedDatabase.db_password || "password"} sslmode=require`}
                        readOnly
                        className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2 border-gray-800 text-gray-800"
                        onClick={() =>
                          copyToClipboard(
                            `host=${selectedDatabase.db_name}-read.shadowdb.com port=${selectedDatabase.haproxy?.read_port || 5001} dbname=${selectedDatabase.db_name} user=${selectedDatabase.db_user || "postgres"} password=${selectedDatabase.db_password || "password"} sslmode=require`,
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* PgPool Connection */}
          <div className="space-y-2">
            <Label htmlFor="pgpool_connection" className="text-gray-200">
              PgPool Connection (Load Balanced)
            </Label>
            <div className="flex">
              <Input
                id="pgpool_connection"
                value={`postgresql://${selectedDatabase.db_user || "postgres"}:${
                  selectedDatabase.db_password || "password"
                }@${selectedDatabase.db_name}-pgpool.shadowdb.com:${selectedDatabase.pgpool?.port || 9999}/${
                  selectedDatabase.db_name
                }`}
                readOnly
                className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 border-gray-800 text-gray-800"
                onClick={() =>
                  copyToClipboard(
                    `postgresql://${selectedDatabase.db_user || "postgres"}:${
                      selectedDatabase.db_password || "password"
                    }@${selectedDatabase.db_name}-pgpool.shadowdb.com:${selectedDatabase.pgpool?.port || 9999}/${
                      selectedDatabase.db_name
                    }`,
                  )
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-2 border-gray-800 text-gray-800 text-xs h-8">
                  View Attributes
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#151923] border-gray-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">PgPool Connection Attributes</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Copy individual attributes or the full connection string
                    </DialogDescription>
                  </DialogHeader>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label className="text-gray-200">Host</Label>
                      <div className="flex">
                        <Input
                          value={`${selectedDatabase.db_name}-pgpool.shadowdb.com`}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() =>
                            copyToClipboard(`host=${selectedDatabase.db_name}-pgpool.shadowdb.com`)
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Port</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.pgpool?.port || 9999}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`port=${selectedDatabase.pgpool?.port || 9999}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Database</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.db_name}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`dbname=${selectedDatabase.db_name}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">User</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.db_user || "postgres"}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`user=${selectedDatabase.db_user || "postgres"}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">Password</Label>
                      <div className="flex">
                        <Input
                          value={selectedDatabase.db_password || "password"}
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard(`password=${selectedDatabase.db_password || "password"}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-200">SSL Mode</Label>
                      <div className="flex">
                        <Input
                          value="require"
                          readOnly
                          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="ml-2 border-gray-800 text-gray-800"
                          onClick={() => copyToClipboard("sslmode=require")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label className="text-gray-200">Full Connection String</Label>
                    <div className="flex">
                      <Input
                        value={`host=${selectedDatabase.db_name}-pgpool.shadowdb.com port=${selectedDatabase.pgpool?.port || 9999} dbname=${selectedDatabase.db_name} user=${selectedDatabase.db_user || "postgres"} password=${selectedDatabase.db_password || "password"} sslmode=require`}
                        readOnly
                        className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="ml-2 border-gray-800 text-gray-800"
                        onClick={() =>
                          copyToClipboard(
                            `host=${selectedDatabase.db_name}-pgpool.shadowdb.com port=${selectedDatabase.pgpool?.port || 9999} dbname=${selectedDatabase.db_name} user=${selectedDatabase.db_user || "postgres"} password=${selectedDatabase.db_password || "password"} sslmode=require`,
                          )
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">SSL Enforcement</Label>
              <p className="text-sm text-gray-400">Require SSL/TLS for all connections</p>
            </div>
            <Switch defaultChecked  className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Connection Pooling</Label>
              <p className="text-sm text-gray-400">Optimize connection management via PgPool</p>
            </div>
            <Switch defaultChecked={selectedDatabase.pgpool?.enable_connection_pooling || false}className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Query Caching</Label>
              <p className="text-sm text-gray-400">Cache read queries to improve performance</p>
            </div>
            <Switch defaultChecked={selectedDatabase.pgpool?.enable_query_cache || false} className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Mock function for UpdateDatabaseName
function UpdateDatabaseName(data: {
  tenancy_type: string
  Original_DB_Name: string
  New_DB_Name: string
  database_id: number
}) {
  // This would be replaced with an actual API call
  return Promise.resolve({
    RenameResult: {
      success: true,
      message: "Database renamed successfully",
    },
  })
}
