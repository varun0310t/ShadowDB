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
  User, // Add User icon for Account tab
} from "lucide-react";
import HomeContent from "./components/homepage";
import RunQueryContent from "./components/RunQuery";
import CreateDatabaseContent from "./components/CreateDatabase";
import { GetDataBases } from "@/client/lib/services/DatabasesService";
import { signOut } from "next-auth/react";
import DatabaseConfiguration from "./components/Configuration";
// Import Account component (which you'll need to create)
import AccountSettings from "./components/AccountSettings";

export default function HomePage() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [databases, setDatabases] = useState<DatabaseEntry[]>([]);

  interface DatabaseEntry {
    id: number;
    tenancy_type: "shared" | "isolated";
    db_name: string;
    access_level: "admin" | "user";
  }

  const { data } = useQuery<
    { databases: DatabaseEntry[] },
    Error
  >({
    queryKey: ["GetDatabases"],
    queryFn: GetDataBases,
  });

  useEffect(() => {
    if (data?.databases && data.databases.length > 0) {
      setDatabases(data.databases);
    }
  }, [data?.databases]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-black text-white font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-gray-800 transition-all duration-300 ease-in-out flex flex-col ${
          isSidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div
          className={`flex items-center justify-between p-4 border-b border-gray-700 ${
            isSidebarCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="flex items-center space-x-2 overflow-hidden">
            <Database className="w-8 h-8 text-purple-500 flex-shrink-0" />
            {!isSidebarCollapsed && (
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                ShadowDB
              </span>
            )}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-2">
            <SidebarItem
              icon={<Home />}
              title="Home"
              active={activePage === "home"}
              onClick={() => setActivePage("home")}
              collapsed={isSidebarCollapsed}
            />
            <SidebarItem
              icon={<PlusCircle />}
              title="Create Database"
              active={activePage === "create"}
              onClick={() => setActivePage("create")}
              collapsed={isSidebarCollapsed}
            />
            <SidebarItem
              icon={<Play />}
              title="Run Query"
              active={activePage === "query"}
              onClick={() => setActivePage("query")}
              collapsed={isSidebarCollapsed}
            />
            <SidebarItem
              icon={<Settings />}
              title="Configuration"
              active={activePage === "Configuration"}
              onClick={() => setActivePage("Configuration")}
              collapsed={isSidebarCollapsed}
            />
          </ul>
        </nav>

        {/* Account tab at the bottom */}
        <div className="mt-auto border-t border-gray-700 pt-2 pb-4 px-2 flex flex-col">
          <SidebarItem
            icon={<User />}
            title="Account"
            active={activePage === "account"}
            onClick={() => setActivePage("account")}
            collapsed={isSidebarCollapsed}
          />
        </div>

        <button
          onClick={toggleSidebar}
          className="p-2 m-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors duration-200 flex items-center justify-center"
        >
          {isSidebarCollapsed ? (
            <ChevronRight size={20} />
          ) : (
            <ChevronLeft size={20} />
          )}
        </button>
      </aside>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <header className="bg-gray-800 bg-opacity-50 backdrop-filter backdrop-blur-lg p-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            {getPageTitle(activePage)}
          </h1>
          <Button
            variant="outline"
            className="text-slate-800"
            onClick={() => {
              signOut();
            }}
          >
            Log Out
          </Button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 bg-opacity-50 p-6">
          {activePage === "home" && <HomeContent />}
          {activePage === "create" && <CreateDatabaseContent />}
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
    <li className="list-none">
      {" "}
      {/* Add list-none to explicitly remove any list styling */}
      <button
        onClick={onClick}
        className={`flex items-center space-x-2 w-full p-2 rounded-lg transition-all duration-200 ${
          active
            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            : "text-gray-300 hover:bg-gray-700"
        } ${collapsed ? "justify-center" : ""}`}
        title={collapsed ? title : ""}
      >
        <span className="flex-shrink-0">{icon}</span>{" "}
        {/* Wrap icon in span to ensure proper styling */}
        {!collapsed && <span className="ml-2">{title}</span>}{" "}
        {/* Explicit margin instead of space-x */}
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
