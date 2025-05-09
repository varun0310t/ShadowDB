"use client"
import { useState, useEffect } from "react"
import { Edit2, Upload } from "lucide-react"
import { useForm } from "react-hook-form"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


type ProfileFormData = {
  name: string
  display_name?: string
  bio?: string
  company?: string
  website?: string
  location?: string
  theme?: 'light' | 'dark' | 'system'
  language?: string
  timezone?: string
  image?: string
  imageFile?: File | null
}

interface ProfileTabProps {
  userData: ProfileFormData | null
  onUpdate: () => Promise<void>
}

export function ProfileTab({ userData, onUpdate }: ProfileTabProps) {
  const [editing, setEditing] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>("")
  const { toast } = useToast()
  const { register, handleSubmit, reset, setValue } = useForm<ProfileFormData>()

useEffect(() => {
  if (userData) {
    reset({
      ...userData,
      imageFile: undefined // Clear any file data when resetting
    })
    setImagePreview(userData.image || "")
  }
}, [userData, reset])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
   if (file) {
    // Create a temporary local preview
    const objectUrl = URL.createObjectURL(file)
    setImagePreview(objectUrl)
    
    // Store the file in form data
    setValue('imageFile', file)
  }
  }

 const onSubmit = async (data: ProfileFormData) => {
  try {
    // Create a FormData object to send the file properly
    const formData = new FormData()
    
    // Add all text fields
    formData.append('name', data.name)
    if (data.display_name) formData.append('display_name', data.display_name)
    if (data.bio) formData.append('bio', data.bio)
    if (data.company) formData.append('company', data.company)
    if (data.website) formData.append('website', data.website)
    if (data.location) formData.append('location', data.location)
    
    // Add the image file if it exists
    if (data.imageFile) {
      formData.append('imageFile', data.imageFile)
    }
    
    // Send request with FormData
    const response = await fetch('/api/users/profile/personalInfo', {
      method: 'PATCH',
      // Don't set Content-Type header, it will be set automatically with boundary
      body: formData,
    })
    
    if (response.ok) {
      const result = await response.json()
      
      // If backend returns an image URL, update it
      if (result.imageUrl) {
        setImagePreview(result.imageUrl)
      }
      
      toast({
        title: "Success",
        description: "Profile updated successfully"
      })
      setEditing(false)
      onUpdate()
    } else {
      throw new Error((await response.json()).error)
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    toast({
      variant: "destructive",
      title: "Error",
      description: errorMessage || "Failed to update profile"
    })
  }
}

  return (
    <div className="space-y-6">
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-gray-200">Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "Cancel" : <Edit2 size={20} className="" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {editing && (
              <div className="flex items-center space-x-4">
                <div className="relative h-20 w-20">
                  <img
                    src={imagePreview || "/default-avatar.png"}
                    alt="Profile Preview"
                    className="h-full w-full rounded-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="rounded-full bg-purple-600 p-2 hover:bg-purple-700">
                        <Upload size={16} />
                      </div>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </Label>
                  </div>
                </div>
                <p className="text-sm text-gray-400">Click the upload button to change your profile picture</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-200">Full Name</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className="bg-[#0B0F17] border-gray-800 text-white"
                  disabled={!editing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_name" className="text-gray-200">Display Name</Label>
                <Input
                  id="display_name"
                  {...register('display_name')}
                  className="bg-[#0B0F17] border-gray-800 text-white"
                  disabled={!editing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-gray-200">Company</Label>
                <Input
                  id="company"
                  {...register('company')}
                  className="bg-[#0B0F17] border-gray-800 text-white"
                  disabled={!editing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website" className="text-gray-200">Website</Label>
                <Input
                  id="website"
                  {...register('website')}
                  className="bg-[#0B0F17] border-gray-800 text-white"
                  disabled={!editing}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="bio" className="text-gray-200">Bio</Label>
                <textarea
                  id="bio"
                  {...register('bio')}
                  className="w-full min-h-[100px] bg-[#0B0F17] border-gray-800 text-white rounded-md p-2"
                  disabled={!editing}
                />
              </div>
            </div>

            {editing && (
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setEditing(false)
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

  {/*     <Card className="bg-[#151923] border-gray-800">
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
            <Switch defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
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
      </Card> */}
    </div>
  )
}
