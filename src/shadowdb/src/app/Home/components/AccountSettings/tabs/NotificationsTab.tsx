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
    security_alerts: z.boolean().default(true),
    product_updates: z.boolean().default(true),
    marketing: z.boolean().default(false),
    usage_reports: z.boolean().default(true),
    new_login: z.boolean().default(true),
    billing_alerts: z.boolean().default(false),
  }),
  mobile: z.object({
    security_alerts: z.boolean().default(true),
    product_updates: z.boolean().default(true),
    usage_reports: z.boolean().default(false),
    new_login: z.boolean().default(true),
  })
});

type NotificationPreferences = z.infer<typeof notification_preferences>;

// Define default values once
const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
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
};

export function NotificationsTab() {
  const {toast} = useToast();
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFS
  );

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
      // Merge with defaults to ensure all properties exist
      setNotificationPrefs({
        email: {
          ...DEFAULT_NOTIFICATION_PREFS.email,
          ...preferences.email
        },
        mobile: {
          ...DEFAULT_NOTIFICATION_PREFS.mobile,
          ...preferences.mobile
        }
      });
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
    <div className="w-full max-w-none">
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader className="p-4 md:p-6">
          <CardTitle className="text-lg md:text-xl text-gray-200">Notification Preferences</CardTitle>
          <CardDescription className="text-sm md:text-base">Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="space-y-6 md:space-y-8">
            {/* Mobile: Stack sections, Desktop: Side by side */}
            <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-8">
              {/* Email Notifications Section */}
              <div className="space-y-4">
                <h3 className="text-base md:text-lg font-medium text-gray-200">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <Label htmlFor="email-security" className="text-sm md:text-base text-gray-300 font-medium">
                        Security Alerts
                      </Label>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Get notified about security issues
                      </p>
                    </div>
                    <Switch
                      id="email-security"
                      checked={notificationPrefs?.email?.security_alerts}
                      onCheckedChange={() => handleEmailToggle('security_alerts')}
                      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-600 flex-shrink-0"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <Label htmlFor="email-updates" className="text-sm md:text-base text-gray-300 font-medium">
                        Product Updates
                      </Label>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        News about new features and updates
                      </p>
                    </div>
                    <Switch
                      id="email-updates"
                      checked={notificationPrefs?.email?.product_updates}
                      onCheckedChange={() => handleEmailToggle('product_updates')}
                      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-600 flex-shrink-0"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <Label htmlFor="email-marketing" className="text-sm md:text-base text-gray-300 font-medium">
                        Marketing
                      </Label>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Promotional emails and newsletters
                      </p>
                    </div>
                    <Switch
                      id="email-marketing"
                      checked={notificationPrefs?.email?.marketing}
                      onCheckedChange={() => handleEmailToggle('marketing')}
                      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-600 flex-shrink-0"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <Label htmlFor="email-usage" className="text-sm md:text-base text-gray-300 font-medium">
                        Usage Reports
                      </Label>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Weekly usage statistics
                      </p>
                    </div>
                    <Switch
                      id="email-usage"
                      checked={notificationPrefs?.email?.usage_reports}
                      onCheckedChange={() => handleEmailToggle('usage_reports')}
                      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-600 flex-shrink-0"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <Label htmlFor="email-new-login" className="text-sm md:text-base text-gray-300 font-medium">
                        New Login Notifications
                      </Label>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Alert when someone logs into your account
                      </p>
                    </div>
                    <Switch
                      id="email-new-login"
                      checked={notificationPrefs?.email?.new_login}
                      onCheckedChange={() => handleEmailToggle('new_login')}
                      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-600 flex-shrink-0"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <Label htmlFor="email-billing" className="text-sm md:text-base text-gray-300 font-medium">
                        Billing Alerts
                      </Label>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Payment and billing notifications
                      </p>
                    </div>
                    <Switch
                      id="email-billing"
                      checked={notificationPrefs.email?.billing_alerts}
                      onCheckedChange={() => handleEmailToggle('billing_alerts')}
                      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-600 flex-shrink-0"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile Notifications Section */}
              <div className="space-y-4">
                <h3 className="text-base md:text-lg font-medium text-gray-200">Mobile Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <Label htmlFor="mobile-security" className="text-sm md:text-base text-gray-300 font-medium">
                        Security Alerts
                      </Label>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Push notifications for security issues
                      </p>
                    </div>
                    <Switch
                      id="mobile-security"
                      checked={notificationPrefs?.mobile?.security_alerts}
                      onCheckedChange={() => handleMobileToggle('security_alerts')}
                      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-600 flex-shrink-0"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <Label htmlFor="mobile-updates" className="text-sm md:text-base text-gray-300 font-medium">
                        Product Updates
                      </Label>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        New features and updates
                      </p>
                    </div>
                    <Switch
                      id="mobile-updates"
                      checked={notificationPrefs?.mobile?.product_updates}
                      onCheckedChange={() => handleMobileToggle('product_updates')}
                      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-600 flex-shrink-0"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <Label htmlFor="mobile-usage" className="text-sm md:text-base text-gray-300 font-medium">
                        Usage Reports
                      </Label>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Weekly usage statistics
                      </p>
                    </div>
                    <Switch
                      id="mobile-usage"
                      checked={notificationPrefs?.mobile?.usage_reports}
                      onCheckedChange={() => handleMobileToggle('usage_reports')}
                      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-600 flex-shrink-0"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <Label htmlFor="mobile-new-login" className="text-sm md:text-base text-gray-300 font-medium">
                        New Login Notifications
                      </Label>
                      <p className="text-xs md:text-sm text-gray-500 mt-1">
                        Push alert for new logins
                      </p>
                    </div>
                    <Switch
                      id="mobile-new-login"
                      checked={notificationPrefs.mobile?.new_login}
                      onCheckedChange={() => handleMobileToggle('new_login')}
                      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-600 flex-shrink-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Save/Cancel Buttons */}
            {hasChanges && (
              <div className="pt-4 md:pt-6 border-t border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <p className="text-sm text-gray-400">You have unsaved changes</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800 w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
