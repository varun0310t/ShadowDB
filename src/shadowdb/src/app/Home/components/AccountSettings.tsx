"use client"

import { useState, useEffect } from "react"
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
    <div className="flex h-screen flex-col w-full bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="flex flex-col md:flex-row w-full h-full">
        {/* Sidebar - scrollable on mobile, fixed on desktop */}
        <div className="w-full md:w-64 flex-shrink-0 border-b md:border-b-0 md:border-r border-gray-800">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            userData={userData}
            loading={loading}
          />
        </div>

        {/* Main content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="p-4 md:p-6">
              <div className="space-y-6">
                <TabsContent value="profile">
                  <ProfileTab userData={userData} onUpdate={fetchUserData} />
                </TabsContent>
                <TabsContent value="security">
                  <SecurityTab />
                </TabsContent>
                <TabsContent value="notifications">
                  <NotificationsTab />
                </TabsContent>
                <TabsContent value="billing">
                  <BillingTab />
                </TabsContent>
                <TabsContent value="api">
                  <ApiKeysTab />
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

