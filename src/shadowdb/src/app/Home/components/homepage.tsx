import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Activity, Clock, Database, BarChart2, GitCommit, ExternalLink, PlusCircle, Play, Settings, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DatabaseEntry } from '../types/database-types';
import { Badge } from "@/components/ui/badge"
import {

  TrendingUp,
  Shield,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ReactElement, useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
type SystemChange = {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'feature' | 'fix' | 'update' | 'security' | 'maintenance';
  link?: string;
};

function HomeContent({ setActivePage }: { setActivePage: (page: string) => void }) {
  // Use your existing API to get databases
  const { data: databasesData, isLoading: loadingDatabases } = useQuery<DatabaseEntry[]>({
    queryKey: ["userDatabases"],
    queryFn: async () => {
      const response = await axios.get("/api/users/pool/GetDatabases")
      return response.data.databases;
    },
  })

  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const response = await axios.get("/api/users/profile/personalInfo")
      return response.data
    },
  })

  // Add this state for platform changes
  const [latestChanges, setLatestChanges] = useState<SystemChange[]>([])
  const [loadingChanges, setLoadingChanges] = useState(true)

  // Load system changes
  useEffect(() => {
    // Simulate loading system changes - in production, this would be an API call
    const loadSystemChanges = async () => {
      setLoadingChanges(true)

      try {
        // This would be your API call in production
        // const response = await axios.get('/api/system/changes');
        // const data = response.data;

        // For now, use mocked data
        const mockedChanges: SystemChange[] = [
          {
            id: "1",
            title: "Query Performance Improvements",
            description: "Optimized query execution engine with 30% faster response times",
            date: "2025-06-05T12:00:00Z",
            type: "update",
          },
          {
            id: "2",
            title: "New Database Backup Feature",
            description: "Added scheduled backups with retention policies",
            date: "2025-06-04T15:30:00Z",
            type: "feature",
            link: "/docs/backups",
          },
          {
            id: "3",
            title: "Security Patch: Authentication Hardening",
            description: "Enhanced JWT token security with improved refresh mechanisms",
            date: "2025-06-02T09:45:00Z",
            type: "security",
          },
          {
            id: "4",
            title: "Connection Pool Optimizations",
            description: "Improved connection handling for high-concurrency workloads",
            date: "2025-05-30T11:20:00Z",
            type: "update",
          },
          {
            id: "5",
            title: "Bug Fix: Query Editor Autocomplete",
            description: "Fixed issue with SQL autocomplete suggestions for table names",
            date: "2025-05-28T14:15:00Z",
            type: "fix",
          },
        ]

        setLatestChanges(mockedChanges)
      } catch (error) {
        console.error("Failed to load system changes", error)
        setLatestChanges([])
      } finally {
        setLoadingChanges(false)
      }
    }

    loadSystemChanges()
  }, [])

  return (
    <div className="flex flex-col h-full w-full space-y-6 animate-fadeIn overflow-y-auto pb-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Welcome to ShadowDB
          </h1>
          <p className="text-gray-400 mt-2">Manage your databases with enterprise-grade performance and security</p>
        </div>
      </div>

      {/* User Profile Section */}
      <Card className="bg-[#151923] border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            {loadingUser ? (
              <Skeleton className="h-16 w-16 rounded-full" />
            ) : (
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 p-0.5">
                  <img
                    src={userData?.image || "/placeholder.svg?height=64&width=64"}
                    alt="Profile"
                    className="h-full w-full rounded-full object-cover bg-[#151923]"
                  />
                </div>
                <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-green-500 border-2 border-[#151923]"></div>
              </div>
            )}

            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-white">
                {loadingUser ? <Skeleton className="h-8 w-40" /> : `Welcome back, ${userData?.name || "User"}`}
              </h2>
              <div className="text-gray-400 mt-1">
                {loadingUser ? (
                  <Skeleton className="h-4 w-64" />
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-400">{userData?.email}</span>
                    <span>•</span>
                    <Badge className="bg-purple-600">{userData?.provider || "Account"}</Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Stats Cards */}
      {databasesData && databasesData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Total Databases"
            value={loadingDatabases ? "-" : databasesData?.length || 0}
            icon={<Database className="h-5 w-5 text-purple-500" />}
            trend="+12%"
            trendUp={true}
          />
          <StatCard
            title="Isolated Databases"
            value={loadingDatabases ? "-" : databasesData?.filter((db) => db.tenancy_type === "isolated").length || 0}
            icon={<Shield className="h-5 w-5 text-purple-500" />}
            trend="+8%"
            trendUp={true}
          />
          <StatCard
            title="Shared Databases"
            value={loadingDatabases ? "-" : databasesData?.filter((db) => db.tenancy_type === "shared").length || 0}
            icon={<Zap className="h-5 w-5 text-purple-500" />}
            trend="+15%"
            trendUp={true}
          />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Your Databases Card */}
        <Card className="bg-[#151923] border-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center text-white">
              <Database className="w-5 h-5 mr-2 text-purple-500" />
              Your Databases
            </CardTitle>
            <CardDescription>Manage and monitor your database instances</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingDatabases ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {databasesData && databasesData.length > 0 ? (
                  databasesData.slice(0, 5).map((db) => (
                    <div
                      key={db.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-[#0B0F17] border border-gray-800 hover:border-purple-500 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-medium text-white">{db.db_name}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Badge
                          className={
                            db.tenancy_type === "isolated"
                              ? "bg-purple-600 hover:bg-purple-700"
                              : "bg-gray-600 hover:bg-gray-700"
                          }
                        >
                          {db.tenancy_type}
                        </Badge>
                        <Badge className="bg-gray-700 hover:bg-gray-600">{db.access_level}</Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  
                  <div className="flex flex-col items-center justify-center text-gray-400 py-8">
                    <Database className="h-12 w-12 text-gray-600 mb-4" />
                  
                    <p className="text-lg font-medium mb-2">No databases found</p>
                    <p className="text-sm text-gray-500 mb-4">Get started by creating your first database</p>
                    <Button
                      onClick={() => setActivePage("create")}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Create Database
                    </Button>
                  </div>
                )}

                {databasesData && databasesData.length > 5 && (
                  <div className="pt-3 border-t border-gray-800">
                    <Button
                      variant="ghost"
                      className="w-full text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                    >
                      View all databases ({databasesData.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest Platform Changes */}
        <Card className="bg-[#151923] border-gray-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center text-white">
                <GitCommit className="w-5 h-5 mr-2 text-purple-500" />
                Latest Platform Updates
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                View all changes
              </Button>
            </div>
            <CardDescription>Recent improvements and new features</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingChanges ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-l-2 border-gray-700 pl-4 py-2">
                    <Skeleton className="h-5 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {latestChanges.slice(0, 3).map((change) => (
                  <div key={change.id} className={`border-l-2 ${getBorderColor(change.type)} pl-4 py-2`}>
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium text-white flex items-center">
                        {getChangeIcon(change.type)}
                        <span className="ml-2">{change.title}</span>
                      </h4>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{formatDate(change.date)}</span>
                    </div>
                    <p className="text-gray-300 mt-1 text-sm">{change.description}</p>
                    {change.link && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-purple-400 hover:text-purple-300 mt-2 p-0 h-auto"
                      >
                        Learn more
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <QuickActions databases={databasesData} setActivePage={setActivePage} />
    </div>
  )
}

// Helper components
function StatCard({
  title,
  value,
  icon,
  trend,
  trendUp,
}: {
  title: string
  value: string | number
  icon: ReactElement
  trend?: string
  trendUp?: boolean
}) {
  return (
    <Card className="bg-[#151923] border-gray-800">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                <TrendingUp
                  className={`h-4 w-4 mr-1 ${trendUp ? "text-green-500" : "text-red-500"} ${
                    !trendUp ? "rotate-180" : ""
                  }`}
                />
                <span className={`text-sm ${trendUp ? "text-green-500" : "text-red-500"}`}>{trend}</span>
                <span className="text-gray-400 text-sm ml-1">from last month</span>
              </div>
            )}
          </div>
          <div className="bg-purple-600/20 p-3 rounded-lg">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActions({
  databases,
  setActivePage,
}: {
  databases: DatabaseEntry[] | undefined
  setActivePage: (page: string) => void
}) {
  return (
    <Card className="bg-[#151923] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Quick Actions</CardTitle>
        <CardDescription>Common tasks and shortcuts</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            onClick={() => setActivePage("create")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-20 flex flex-col items-center justify-center space-y-2"
          >
            <PlusCircle className="h-6 w-6" />
            <span className="text-sm">Create Database</span>
          </Button>

          <Button
            onClick={() => setActivePage("query")}
            className="bg-[#0B0F17] border border-gray-800 hover:border-purple-500 hover:bg-purple-900/20 h-20 flex flex-col items-center justify-center space-y-2"
            variant="outline"
          >
            <Play className="h-6 w-6 text-purple-400" />
            <span className="text-sm text-purple-400">Run Query</span>
          </Button>

          <Button
            onClick={() => setActivePage("Configuration")}
            className="bg-[#0B0F17] border border-gray-800 hover:border-purple-500 hover:bg-purple-900/20 h-20 flex flex-col items-center justify-center space-y-2"
            variant="outline"
          >
            <Settings className="h-6 w-6 text-purple-400" />
            <span className="text-sm text-purple-400">Configuration</span>
          </Button>

          <Button
            onClick={() => setActivePage("account")}
            className="bg-[#0B0F17] border border-gray-800 hover:border-purple-500 hover:bg-purple-900/20 h-20 flex flex-col items-center justify-center space-y-2"
            variant="outline"
          >
            <User className="h-6 w-6 text-purple-400" />
            <span className="text-sm text-purple-400">Account</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions for the Latest Changes section
function getBorderColor(type: string): string {
  switch (type) {
    case "feature":
      return "border-green-500"
    case "fix":
      return "border-yellow-500"
    case "update":
      return "border-purple-500"
    case "security":
      return "border-red-500"
    case "maintenance":
      return "border-blue-500"
    default:
      return "border-gray-500"
  }
}

function getChangeIcon(type: string) {
  switch (type) {
    case "feature":
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-900/50 text-green-400 text-xs font-bold">
          +
        </span>
      )
    case "fix":
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-900/50 text-yellow-400 text-xs">
          ✓
        </span>
      )
    case "update":
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-900/50 text-purple-400 text-xs">
          ↑
        </span>
      )
    case "security":
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-900/50 text-red-400 text-xs">
          🔒
        </span>
      )
    case "maintenance":
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-900/50 text-blue-400 text-xs">
          ⚙️
        </span>
      )
    default:
      return null
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return "Today"
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays} days ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

export default HomeContent