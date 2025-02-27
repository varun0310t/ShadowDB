"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Database,
  Save,
  Play,
  FileCode,
  Settings2,
  Filter,
  Clock,
  Download,
  Maximize2,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { Editor } from "@monaco-editor/react";
import { useMutation } from "@tanstack/react-query";
import { executeQuery } from "@/client/lib/services/QueryService";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RunQueryContent({
  selectedDatabase,
  setSelectedDatabase,
  databases,
}: {
  selectedDatabase: string;
  setSelectedDatabase: (db: string) => void;
  databases: Array<{
    id: number;
    tenancy_type: "shared" | "isolated";
    db_name: string;
    access_level: "admin" | "user";
  }>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("data");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const mutation = useMutation({
    mutationFn: (queryData: { db_name: string; query: string }) => 
      executeQuery(queryData),
    onSuccess: (data) => {
      setResults(data.results || []);
      setActiveTab("data");
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
      setActiveTab("messages");
    }
  });

  const handleRunQuery = async () => {
    if (!selectedDatabase) {
      setError("Please select a database first");
      return;
    }

    if (!query.trim()) {
      setError("Query cannot be empty");
      return;
    }
    
    // Execute the mutation with the query data
    mutation.mutate({ 
      db_name: selectedDatabase, 
      query: query 
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-white">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <Database className="h-6 w-6 text-purple-500" />
          <span className="font-semibold">ShadowDB</span>
        </Link>
      </header>

      <main className="flex flex-col h-[calc(100vh-3.5rem)]">
        {/* Toolbar */}
        <div className="border-b border-gray-800 p-2 flex items-center space-x-2">
          <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
            <SelectTrigger className="w-[200px] bg-[#151923] border-gray-800">
              <SelectValue placeholder="Select Database" />
            </SelectTrigger>
            <SelectContent className="bg-[#151923] border-gray-800">
              {databases.length === 0 ? (
                <SelectItem value="no-db" disabled>
                  No databases available
                </SelectItem>
              ) : (
                databases.map((db) => (
                  <SelectItem key={db.id} value={db.db_name}>
                    {db.db_name} ({db.tenancy_type})
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-gray-800" />

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <FileCode className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <Settings2 className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-800" />

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <Clock className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-800" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#151923] border-gray-800">
              <DropdownMenuItem>CSV</DropdownMenuItem>
              <DropdownMenuItem>JSON</DropdownMenuItem>
              <DropdownMenuItem>SQL</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="ml-auto flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Query Editor */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="h-1/2 border-b border-gray-800">
            <Editor
              defaultLanguage="sql"
              defaultValue="-- Enter your SQL query here"
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: "on",
              }}
              onChange={(value) => setQuery(value || "")}
              className="h-full"
            />
            <div className="absolute bottom-[50%] right-4 transform translate-y-[-50%]">
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleRunQuery}
                disabled={mutation.isPending || !selectedDatabase}
              >
                {mutation.isPending ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                Run Query
              </Button>
            </div>
          </div>

          {/* Results Area */}
          <div className="h-1/2 flex-1 min-h-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col"
            >
              <TabsList className="border-b border-gray-800 bg-transparent">
                <TabsTrigger
                  value="data"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  Data Output
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  Messages
                </TabsTrigger>
                <TabsTrigger
                  value="explain"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
                >
                  Explain
                </TabsTrigger>
              </TabsList>
              <TabsContent value="data" className="flex-1 p-4 overflow-auto">
                {results.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                      <thead className="text-xs uppercase bg-[#151923] text-gray-400">
                        <tr>
                          {Object.keys(results[0]).map((key) => (
                            <th key={key} className="px-4 py-2">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((row, i) => (
                          <tr key={i} className="border-b border-gray-800">
                            {Object.values(row).map((value: any, j) => (
                              <td key={j} className="px-4 py-2">
                                {typeof value === "object" && value !== null
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">
                    {mutation.isPending ? "Running query..." : "No results to display"}
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="messages"
                className="flex-1 p-4 overflow-auto"
              >
                {error || mutation.error ? (
                  <div className="text-sm text-red-400">
                    {error || (mutation.error as Error)?.message || "An error occurred"}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">No messages</div>
                )}
              </TabsContent>

              <TabsContent
                value="explain"
                className="flex-1 p-4 overflow-auto"
              >
                <div className="text-sm text-gray-400">
                  No execution plan available
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
