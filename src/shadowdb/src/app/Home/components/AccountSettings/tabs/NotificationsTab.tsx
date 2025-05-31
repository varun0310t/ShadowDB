import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useState,useEffect } from "react";
import { TabWrapper } from "../TabWrapper";
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

const notification_preferences = z.object({
  email: z.object({
    security_alerts: z.boolean(),
    product_updates: z.boolean(),
    marketing: z.boolean(),
    usage_reports: z.boolean(),
    new_login: z.boolean(),
    billing_alerts: z.boolean(),
  }),
  mobile: z.object({
    security_alerts: z.boolean(),
    product_updates: z.boolean(),
    usage_reports: z.boolean(),
    new_login: z.boolean(),
  })
});

type NotificationPreferences = z.infer<typeof notification_preferences>;

export function NotificationsTab() {
  const {toast} = useToast();
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    email: {
      security_alerts: true,
      product_updates: true,
      marketing: false,
      usage_reports: true,
      new_login: true,
      billing_alerts: false,
    },
    mobile: {
      security_alerts: true,
      product_updates: false,
      usage_reports: false,
      new_login: true,
    }
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
      console.log(response);
      return response.data;
    },
  });

  useEffect(() => {
    if (preferences) {
      setNotificationPrefs(preferences);
      setHasChanges(false);
    }
  }, [preferences]);

  // Handle email switch toggle
  const handleEmailToggle = (key: keyof NotificationPreferences['email']) => {
    setNotificationPrefs(prev => {
      const updated = { 
        ...prev, 
        email: { ...prev.email, [key]: !prev.email[key] }
      };
      setHasChanges(true);
      return updated;
    });
  };

  // Handle mobile switch toggle
  const handleMobileToggle = (key: keyof NotificationPreferences['mobile']) => {
    setNotificationPrefs(prev => {
      const updated = { 
        ...prev, 
        mobile: { ...prev.mobile, [key]: !prev.mobile[key] }
      };
      setHasChanges(true);
      return updated;
    });
  };
  
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: NotificationPreferences) => {
      const response = await axios.patch("/api/users/profile/Notification", {
        preferences: data
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
    savePreferencesMutation.mutate(notificationPrefs);
  };

  // Handle cancel button click
  const handleCancel = () => {
    if (preferences) {
      setNotificationPrefs(preferences);
      setHasChanges(false);
    }
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
  
  return (
    <TabWrapper>
      <Card className="bg-[#151923] border-gray-800 mb-4">
        <CardHeader>
          <CardTitle className="text-gray-200">Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Email Notifications Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-200">Email Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-security" className="text-gray-400">Security Alerts</Label>
                  <Switch
                    id="email-security"
                    checked={notificationPrefs.email.security_alerts}
                    onCheckedChange={() => handleEmailToggle('security_alerts')}
                    className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-updates" className="text-gray-400">Product Updates</Label>
                  <Switch
                    id="email-updates"
                    checked={notificationPrefs.email.product_updates}
                    onCheckedChange={() => handleEmailToggle('product_updates')}
                    className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-marketing" className="text-gray-400">Marketing</Label>
                  <Switch
                    id="email-marketing"
                    checked={notificationPrefs.email.marketing}
                    onCheckedChange={() => handleEmailToggle('marketing')}
                    className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-usage" className="text-gray-400">Usage Reports</Label>
                  <Switch
                    id="email-usage"
                    checked={notificationPrefs.email.usage_reports}
                    onCheckedChange={() => handleEmailToggle('usage_reports')}
                    className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-new-login" className="text-gray-400">
                    New Login Notifications
                  </Label>
                  <Switch
                    id="email-new-login"
                    checked={notificationPrefs.email.new_login}
                    onCheckedChange={() => handleEmailToggle('new_login')}
                    className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-billing" className="text-gray-400">
                    Billing Alerts
                  </Label>
                  <Switch
                    id="email-billing"
                    checked={notificationPrefs.email.billing_alerts}
                    onCheckedChange={() => handleEmailToggle('billing_alerts')}
                    className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Notifications Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-200">Mobile Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile-security" className="text-gray-400">Security Alerts</Label>
                  <Switch
                    id="mobile-security"
                    checked={notificationPrefs.mobile.security_alerts}
                    onCheckedChange={() => handleMobileToggle('security_alerts')}
                    className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile-updates" className="text-gray-400">Product Updates</Label>
                  <Switch
                    id="mobile-updates"
                    checked={notificationPrefs.mobile.product_updates}
                    onCheckedChange={() => handleMobileToggle('product_updates')}
                    className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile-usage" className="text-gray-400">Usage Reports</Label>
                  <Switch
                    id="mobile-usage"
                    checked={notificationPrefs.mobile.usage_reports}
                    onCheckedChange={() => handleMobileToggle('usage_reports')}
                    className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="mobile-new-login" className="text-gray-400">
                    New Login Notifications
                  </Label>
                  <Switch
                    id="mobile-new-login"
                    checked={notificationPrefs.mobile.new_login}
                    onCheckedChange={() => handleMobileToggle('new_login')}
                    className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {hasChanges && (
            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">You have unsaved changes</p>
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
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
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TabWrapper>
  );
}
