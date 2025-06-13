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
  ];  return (
    <Card className="bg-[#151923] border-gray-800 w-full">
      <CardContent className="p-4 md:p-6">
        {/* Profile Section */}
        <div className="flex flex-row md:flex-col items-center md:items-center py-4 md:py-6 space-x-4 md:space-x-0">
          {loading ? (
            <Skeleton className="h-16 w-16 md:h-20 md:w-20 rounded-full flex-shrink-0" />
          ) : (
            <div className="relative flex-shrink-0">
              <img
                src={userData?.image || "/default-avatar.png"}
                alt="Profile"
                className="h-16 w-16 md:h-20 md:w-20 rounded-full object-cover border-2 border-purple-500"
              />
            </div>
          )}
          <div className="flex-1 md:flex-none min-w-0 md:text-center md:mt-4">
            <h3 className="text-lg md:text-xl font-semibold text-white truncate">
              {userData?.name || "Loading..."}
            </h3>
            <p className="text-gray-400 text-sm truncate">
              {userData?.email || "Loading..."}
            </p>
            <Badge className="mt-2 bg-purple-600 text-xs">Pro Plan</Badge>
          </div>
        </div>        {/* Navigation - Horizontal tabs for all screen sizes */}
        <nav className="mt-4 md:mt-6">
          <div className="flex flex-col space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {navigationItems.map((item) => (
              <AccountNavItem
                key={item.id}
                icon={item.icon}
                title={item.title}
                active={activeTab === item.id}
                onClick={() => setActiveTab(item.id)}
              />
            ))}
          </div>
        </nav>

        {/* Sign Out Button */}
        <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-gray-800">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 min-h-[44px]"
            onClick={() => signOut()}
          >
            <LogOut size={18} className="mr-2" />
            <span className="text-sm md:text-base">Sign Out</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
