"use client"

import { useState } from "react"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Sidebar } from "./AccountSettings/Sidebar"
import { ProfileTab } from "./AccountSettings/tabs/ProfileTab"
import { SecurityTab } from "./AccountSettings/tabs/SecurityTab"
import { NotificationsTab } from "./AccountSettings/tabs/NotificationsTab"
import { BillingTab } from "./AccountSettings/tabs/BillingTab"
import { ApiKeysTab } from "./AccountSettings/tabs/ApiKeysTab"

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <div className="container mx-auto animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsContent value="profile">
              <ProfileTab />
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

