import { useState } from "react"
import { Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ProfileTab() {
  const [editing, setEditing] = useState(false)

  return (
    <div className="space-y-6">
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
            <Button variant="outline" size="sm" className="border-gray-700">Change</Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Language</Label>
              <p className="text-gray-200">Current: English (US)</p>
            </div>
            <Button variant="outline" size="sm" className="border-gray-700">Change</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
