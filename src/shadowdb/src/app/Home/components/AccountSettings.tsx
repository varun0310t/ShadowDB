"use client"

import React, { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Sidebar } from "./AccountSettings/Sidebar"
import { ProfileTab } from "./AccountSettings/tabs/ProfileTab"
import { SecurityTab } from "./AccountSettings/tabs/SecurityTab"
import { NotificationsTab } from "./AccountSettings/tabs/NotificationsTab"
import { BillingTab } from "./AccountSettings/tabs/BillingTab"
import { ApiKeysTab } from "./AccountSettings/tabs/ApiKeysTab"

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState("profile")
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/profile/personalInfo')
      const data = await response.json()
      if (response.ok) {
        setUserData(data)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch user data"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-full  text-white">
      {/* Mobile: Stack layout, Desktop: Side-by-side */}
      <div className="max-w-7xl h-full mx-auto">
        
        {/* Mobile Header with Navigation */}
        <div className="h-full md:hidden">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userData={userData}
            loading={loading}
          />
        </div>

        <div className="md:flex md:gap-6 md:p-6">
          {/* Desktop Sidebar */}
          <div className="hidden md:block md:w-80 md:flex-shrink-0">
            <div className="sticky top-6">
              <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                userData={userData}
                loading={loading}
              />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1  min-w-0 p-4 md:p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="space-y-6">
                <TabsContent value="profile" className="mt-0 space-y-0">
                  <ProfileTab userData={userData} onUpdate={fetchUserData} />
                </TabsContent>
                <TabsContent value="security" className="mt-0 space-y-0">
                  <SecurityTab />
                </TabsContent>
                <TabsContent value="notifications" className="mt-0 space-y-0">
                  <NotificationsTab />
                </TabsContent>
                <TabsContent value="billing" className="mt-0 space-y-0">
                  <BillingTab />
                </TabsContent>
                <TabsContent value="api" className="mt-0 space-y-0">
                  <ApiKeysTab />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}

