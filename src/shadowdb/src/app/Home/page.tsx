"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  Database,
  Home,
  PlusCircle,
  Play,
  ChevronLeft,
  ChevronRight,
  Settings,
  User,
  Menu,
  X,
} from "lucide-react";
import HomeContent from "./components/homepage";
import RunQueryContent from "./components/RunQuery";
import CreateDatabaseContent from "./components/CreateDatabase";
import { GetDataBases } from "@/client/lib/services/DatabasesService";
import { signOut } from "next-auth/react";
import DatabaseConfiguration from "./components/Configuration";
import AccountSettings from "./components/AccountSettings";
import type { DatabaseEntry } from "./types/database-types";

export default function HomePage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [databases, setDatabases] = useState<DatabaseEntry[]>([]);

  const { data } = useQuery<
    { databases: DatabaseEntry[] },
    Error
  >({
    queryKey: ["GetDatabases"],
    queryFn: GetDataBases,
  });

  useEffect(() => {
    if (data?.databases && data.databases.length > 0) {
      console.log("databases", data.databases);
      setDatabases(data.databases);
    }
  }, [data?.databases]);  // Auto-collapse sidebar on desktop, hide completely on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // On mobile, hide sidebar completely and close mobile menu
        setIsMobileMenuOpen(false);
      } else {
        // On desktop, show sidebar in collapsed or expanded state
        setIsMobileMenuOpen(false);
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle body scroll lock for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  // Close mobile menu when page changes
  const handlePageChange = (page: string) => {
    setActivePage(page);
    setIsMobileMenuOpen(false);
  };
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans overflow-hidden">
      {/* Mobile overlay when sidebar is open */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}      {/* Sidebar - Hidden on mobile by default, overlay when opened */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-gray-800 transition-all duration-300 ease-in-out flex flex-col
          ${
            // Mobile: hidden by default, slide in when menu is open
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }
          ${
            // Desktop: normal sidebar behavior
            isSidebarCollapsed ? "md:w-16" : "md:w-64"
          }
          w-[280px] md:translate-x-0
        `}
      >        <div
          className={`flex items-center justify-between p-3 md:p-4 border-b border-gray-700 ${
            isSidebarCollapsed ? "md:justify-center" : ""
          }`}
        >
          <div className="flex items-center space-x-2 overflow-hidden">
            <Database className="w-7 h-7 md:w-8 md:h-8 text-purple-500 flex-shrink-0" />
            {(!isSidebarCollapsed || isMobileMenuOpen) && (
              <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                ShadowDB
              </span>
            )}
          </div>
          {/* Close button for mobile */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-gray-400 hover:text-white"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 md:py-4">
          <ul className="space-y-2 px-2">            <SidebarItem
              icon={<Home />}
              title="Home"
              active={activePage === "home"}
              onClick={() => handlePageChange("home")}
              collapsed={isSidebarCollapsed}
            />
            <SidebarItem
              icon={<PlusCircle />}
              title="Create Database"
              active={activePage === "create"}
              onClick={() => handlePageChange("create")}
              collapsed={isSidebarCollapsed}
            />
            <SidebarItem
              icon={<Play />}
              title="Run Query"
              active={activePage === "query"}
              onClick={() => handlePageChange("query")}
              collapsed={isSidebarCollapsed}
            />
            <SidebarItem
              icon={<Settings />}
              title="Configuration"
              active={activePage === "Configuration"}
              onClick={() => handlePageChange("Configuration")}
              collapsed={isSidebarCollapsed}
            />
          </ul>
        </nav>

        {/* Account tab at the bottom */}
        <div className="mt-auto border-t border-gray-700 pt-2 pb-4 px-2 flex flex-col">          <SidebarItem
            icon={<User />}
            title="Account"
            active={activePage === "account"}
            onClick={() => handlePageChange("account")}
            collapsed={isSidebarCollapsed}
          />
        </div>        {/* Desktop toggle button - hidden on mobile */}
        <button
          onClick={toggleSidebar}
          className="hidden md:flex p-2 m-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors duration-200 items-center justify-center"
        >
          {isSidebarCollapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </aside>      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? "md:ml-16" : "md:ml-64"}
          ml-0
        `}
      >
        <header className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg p-3 md:p-4 flex justify-between items-center">
          {/* Mobile menu button and title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg md:text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 truncate">
              {getPageTitle(activePage)}
            </h1>
          </div>
          <Button
            variant="outline"
            className="text-slate-800 text-xs md:text-base px-3 py-2"
            onClick={() => {
              signOut();
            }}
          >
            Log Out
          </Button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50 p-4 md:p-6">
          {activePage === "home" && <HomeContent setActivePage={setActivePage} />}
          {activePage === "create" && (
            <div className="flex items-start justify-center h-full min-h-0 pt-0">
              <CreateDatabaseContent />
            </div>
          )}
          {activePage === "query" && (
            <RunQueryContent
              selectedDatabase={selectedDatabase}
              setSelectedDatabase={setSelectedDatabase}
              databases={databases}
            />
          )}
          {activePage === "Configuration" && (
            <DatabaseConfiguration databases={databases} />
          )}
          {activePage === "account" && <AccountSettings />}
        </main>
      </div>
    </div>
  );
}

function SidebarItem({
  icon,
  title,
  active,
  onClick,
  collapsed,
}: {
  icon: React.ReactElement;
  title: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}) {
  return (
    <li className="list-none">      <button
        onClick={onClick}
        className={`flex items-center w-full p-3 rounded-lg transition-all duration-200 min-h-[44px] ${
          active
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            : "text-gray-300 hover:bg-gray-700"
        } ${collapsed ? "md:justify-center justify-start" : "justify-start"}`}
        title={collapsed ? title : ""}
      >
        <span className="flex-shrink-0">{icon}</span>
        <span className={`ml-2 text-sm md:text-base truncate ${collapsed ? "md:hidden" : ""}`}>
          {title}
        </span>
      </button>
    </li>
  );
}

function getPageTitle(page: string) {
  switch (page) {
    case "home":
      return "Dashboard";
    case "create":
      return "Create Database";
    case "query":
      return "Run Query";
    case "Configuration":
      return "Configuration";
    case "account":
      return "Account Settings";
    default:
      return "ShadowDB";
  }
}
