import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState,useEffect } from "react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { z } from "zod";
const email_notifications_preferrences = z.object({
  security_alerts: z.boolean(),
  product_updates: z.boolean(),
  marketing: z.boolean(),
  usage_reports: z.boolean(),
  new_login: z.boolean(),
});
type EmailNotificationPreferences = z.infer<typeof email_notifications_preferrences >;
export function NotificationsTab() {
  const {toast}=useToast();
  const [emailNotifications, setEmailNotifications] = useState<
    z.infer<typeof email_notifications_preferrences>
  >({
    security_alerts: true,
    product_updates: true,
    marketing: false,
    usage_reports: true,
    new_login: true,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userNotificationPreferences"],
    queryFn: async () => {
      const response = await axios.get("/api/users/profile/Notification");
      console.log(response)
      return response.data;
    },
  });

  useEffect(() => {
    if (preferences) {
      setEmailNotifications(preferences);
      setHasChanges(false);
    }
  }, [preferences]);

    // Handle switch toggle
    const handleToggle = (key: keyof EmailNotificationPreferences) => {
      setEmailNotifications(prev => {
        const updated = { ...prev, [key]: !prev[key] };
        setHasChanges(true);
        return updated;
      });
    };
    const savePreferencesMutation = useMutation({
      mutationFn: async (data: EmailNotificationPreferences) => {
        const response = await axios.patch("/api/users/profile/Notification", {
          emailPreferences: data
        });
        return response.data;
      },
      onSuccess: () => {
        // Update cache
        queryClient.invalidateQueries({ queryKey: ["userNotificationPreferences"] });
        setHasChanges(false);
        
        toast({
          title: "Preferences updated",
          description: "Your notification preferences have been saved.",
        });
      },
      onError: (error) => {
        console.error("Failed to save preferences:", error);
        
        toast({
          title: "Error",
          description: "Failed to save your preferences. Please try again.",
          variant: "destructive",
        });
      }
    });
  // Handle save button click
  const handleSave = () => {
    savePreferencesMutation.mutate(emailNotifications);
  };

    // Show loading state
    if (isLoading) {
      return (
        <Card className="bg-[#151923] border-gray-800">
          <CardContent className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </CardContent>
        </Card>
      );
    }
  
      // Show error state
  if (error) {
    return (
      <Card className="bg-[#151923] border-gray-800">
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <p className="text-red-500">Failed to load notification preferences</p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ["userNotificationPreferences"] })}
              variant="outline"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  return  (
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
              <Switch
                id="email-security"
                checked={emailNotifications.security_alerts}
                onCheckedChange={() => handleToggle('security_alerts')}
                className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-updates">Product Updates</Label>
              <Switch
                id="email-updates"
                checked={emailNotifications.product_updates}
                onCheckedChange={() => handleToggle('product_updates')}
                className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-marketing">Marketing</Label>
              <Switch
                id="email-marketing"
                checked={emailNotifications.marketing}
                onCheckedChange={() => handleToggle('marketing')}
                className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="email-usage">Usage Reports</Label>
              <Switch
                id="email-usage"
                checked={emailNotifications.usage_reports}
                onCheckedChange={() => handleToggle('usage_reports')}
                className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="new-login">
                Get notified of new logins to your account
              </Label>
              <Switch
                id="new-login"
                checked={emailNotifications.new_login}
                onCheckedChange={() => handleToggle('new_login')}
                className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Removed commented out in-app notifications section */}

        {hasChanges && (
          <div className="pt-2">
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleSave}
              disabled={savePreferencesMutation.isPending}
            >
              {savePreferencesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : "Save Preferences"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
