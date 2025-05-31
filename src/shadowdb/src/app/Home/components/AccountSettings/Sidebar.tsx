import { User, Shield, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { signOut } from "next-auth/react";
import { AccountNavItem } from "./AccountNavItem";
import { Skeleton } from "@/components/ui/skeleton";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userData: { image: string; name: string; email: string } | null;
  loading: boolean;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  userData,
  loading,
}: SidebarProps) {
  const navigationItems = [
    { icon: <User size={18} />, title: "Profile", id: "profile" },
    { icon: <Shield size={18} />, title: "Security", id: "security" },
    { icon: <Bell size={18} />, title: "Notifications", id: "notifications" },

    /*   { icon: <Key size={18} />, title: "API Keys", id: "api" }, */
  ];
  return (
    <Card className="bg-[#151923] border-gray-800 h-full">
      <CardContent className="p-4">
        {/* Profile Section */}
        <div className="flex flex-col items-center py-6">
          {loading ? (
            <Skeleton className="h-24 w-24 rounded-full" />
          ) : (
            <div className="relative">
              <img
                src={userData?.image || "/default-avatar.png"}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover border-2 border-purple-500"
              />
            </div>
          )}
          <h3 className="text-xl font-semibold text-gray-300">
            {userData?.name || "Loading..."}
          </h3>
          <p className="text-gray-400 text-sm">
            {userData?.email || "Loading..."}
          </p>
          <Badge className="mt-2 bg-purple-600">Pro Plan</Badge>
        </div>

        {/* Navigation */}
        <nav className="mt-6 space-y-1">
          {navigationItems.map((item) => (
            <AccountNavItem
              key={item.id}
              icon={item.icon}
              title={item.title}
              active={activeTab === item.id}
              onClick={() => setActiveTab(item.id)}
            />
          ))}
        </nav>

        {/* Sign Out Button */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
            onClick={() => signOut()}
          >
            <LogOut size={18} className="mr-2" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
