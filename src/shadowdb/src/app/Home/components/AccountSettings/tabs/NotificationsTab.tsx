import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function NotificationsTab() {
  return (
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
              <Switch id="email-security" defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-updates">Product Updates</Label>
              <Switch id="email-updates" defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-marketing">Marketing</Label>
              <Switch id="email-marketing" className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-usage">Usage Reports</Label>
              <Switch id="email-usage" defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">In-App Notifications</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="app-security">Security Alerts</Label>
              <Switch id="app-security" defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="app-updates">Product Updates</Label>
              <Switch id="app-updates" defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="app-usage">Usage Alerts</Label>
              <Switch id="app-usage" defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button className="bg-purple-600 hover:bg-purple-700">Save Preferences</Button>
        </div>
      </CardContent>
    </Card>
  )
}
