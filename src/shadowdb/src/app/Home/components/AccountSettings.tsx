"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
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
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch user data"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpdate = async (imageData: string) => {
    try {
      const response = await fetch('/api/users/profile/personalInfo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      })
      
      if (response.ok) {
        fetchUserData()
        toast({
          title: "Success",
          description: "Profile image updated successfully"
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile image"
      })
    }
  }

  return (
    <div className="container mx-auto animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            userData={userData}
            loading={loading}
          />
        </div>

        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
          </Tabs>
        </div>
      </div>
    </div>
  )
}

