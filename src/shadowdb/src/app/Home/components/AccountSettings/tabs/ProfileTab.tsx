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
    <div className="w-full max-w-none">
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg md:text-xl text-gray-200">Personal Information</CardTitle>
              <CardDescription className="text-sm md:text-base mt-1">Update your personal details</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-gray-700 w-full sm:w-auto"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "Cancel" : (
                <>
                  <Edit2 size={16} className="mr-2 sm:mr-0" />
                  <span className="sm:hidden">Edit Profile</span>
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Profile Image Upload - Only show in edit mode */}
            {editing && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
                <div className="relative h-20 w-20 mx-auto sm:mx-0">
                  <img
                    src={imagePreview || "/default-avatar.png"}
                    alt="Profile Preview"
                    className="h-full w-full rounded-full object-cover border-2 border-purple-500"
                  />
                  <div className="absolute bottom-0 right-0">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="rounded-full bg-purple-600 p-2 hover:bg-purple-700 transition-colors">
                        <Upload size={14} />
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
                <div className="text-center sm:text-left">
                  <p className="text-sm md:text-base text-gray-300 font-medium">Profile Picture</p>
                  <p className="text-xs md:text-sm text-gray-400 mt-1">
                    Click the upload button to change your profile picture
                  </p>
                </div>
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4 md:space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm md:text-base text-gray-200 font-medium">
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className="bg-[#0B0F17] border-gray-800 text-white h-11 md:h-10"
                    disabled={!editing}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_name" className="text-sm md:text-base text-gray-200 font-medium">
                    Display Name
                  </Label>
                  <Input
                    id="display_name"
                    {...register('display_name')}
                    className="bg-[#0B0F17] border-gray-800 text-white h-11 md:h-10"
                    disabled={!editing}
                    placeholder="How others see your name"
                  />
                </div>
              </div>

              {/* Company and Website */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-sm md:text-base text-gray-200 font-medium">
                    Company
                  </Label>
                  <Input
                    id="company"
                    {...register('company')}
                    className="bg-[#0B0F17] border-gray-800 text-white h-11 md:h-10"
                    disabled={!editing}
                    placeholder="Your company or organization"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-sm md:text-base text-gray-200 font-medium">
                    Website
                  </Label>
                  <Input
                    id="website"
                    {...register('website')}
                    className="bg-[#0B0F17] border-gray-800 text-white h-11 md:h-10"
                    disabled={!editing}
                    placeholder="https://your-website.com"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm md:text-base text-gray-200 font-medium">
                  Bio
                </Label>
                <textarea
                  id="bio"
                  {...register('bio')}
                  className="w-full min-h-[100px] md:min-h-[120px] bg-[#0B0F17] border border-gray-800 text-white rounded-md p-3 resize-vertical focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={!editing}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            {editing && (
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-800">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full sm:w-auto order-2 sm:order-1"
                  onClick={() => {
                    setEditing(false)
                    reset()
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto sm:ml-auto order-1 sm:order-2"
                >
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
