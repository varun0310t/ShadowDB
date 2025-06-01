"use client";

import { useEffect } from "react";
import { useState } from "react";
import { format } from "sql-formatter";
import { AlignLeft } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { HoverMessage } from "@/components/HoverMessageWrapper";
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
import { set } from "date-fns";
type KeyboardShortcut = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  handler: () => void;
  description: string;
};
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
  const [results, setResults] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("data");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

 
  const mutation = useMutation({
    mutationFn: (queryData: { db_name: string; query: string }) =>
      executeQuery(queryData),
    onSuccess: (data) => {
      setResults(data.rows || []);
      setActiveTab("data");
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
      setActiveTab("messages");
    },
  });
  const handleCopyQuery = async () => {
    if (!query.trim()) {
      toast({
        title: "Nothing to copy",
        description: "The query editor is empty",
        variant: "destructive",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(query);
      toast({
        title: "Copied to clipboard",
        description: "Query has been copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy query to clipboard",
        variant: "destructive",
      });
    }
  };
  // Add these functions after your existing state declarations

  const exportToCSV = () => {
    if (!results.length) {
      toast({
        title: "No data to export",
        description: "Run a query first to get some results",
        variant: "destructive",
      });
      return;
    }

    const headers = Object.keys(results[0]).join(",");
    const csvRows = results.map((row) =>
      Object.values(row)
        .map((value) =>
          typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value
        )
        .join(",")
    );

    const csvContent = [headers, ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `query_results_${selectedDatabase}_${new Date().toISOString()}.csv`;
    link.click();
  };

  const exportToJSON = () => {
    if (!results.length) {
      toast({
        title: "No data to export",
        description: "Run a query first to get some results",
        variant: "destructive",
      });
      return;
    }

    const jsonContent = JSON.stringify(results, null, 2);
    const blob = new Blob([jsonContent], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `query_results_${selectedDatabase}_${new Date().toISOString()}.json`;
    link.click();
  };

  const exportToSQL = () => {
    if (!results.length) {
      toast({
        title: "No data to export",
        description: "Run a query first to get some results",
        variant: "destructive",
      });
      return;
    }

    const tableName = "exported_data";
    const columns = Object.keys(results[0]);
    const createTable = `CREATE TABLE ${tableName} (\n  ${columns
      .map((col) => `${col} TEXT`)
      .join(",\n  ")}\n);\n\n`;

    const insertStatements = results
      .map((row) => {
        const values = Object.values(row)
          .map((val) =>
            typeof val === "string" ? `'${val.replace(/'/g, "''")}'` : val
          )
          .join(", ");
        return `INSERT INTO ${tableName} (${columns.join(
          ", "
        )}) VALUES (${values});`;
      })
      .join("\n");

    const sqlContent = createTable + insertStatements;
    const blob = new Blob([sqlContent], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `query_results_${selectedDatabase}_${new Date().toISOString()}.sql`;
    link.click();
  };

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
      query: query,
    });
  };
  // Add to your component after the existing state declarations
  const handleFormatQuery = () => {
    if (!query.trim()) {
      toast({
        title: "Nothing to format",
        description: "The query editor is empty",
        variant: "destructive",
      });
      return;
    }

    try {
      const formattedQuery = format(query, {
        language: "postgresql", // or 'sql' for standard SQL
        linesBetweenQueries: 2,
      });
      console.log("Formatted Query:", formattedQuery);
      setQuery("");
      setQuery(formattedQuery);
      toast({
        title: "Query formatted",
        description: "SQL query has been formatted",
      });
    } catch (err) {
      toast({
        title: "Format failed",
        description: "Could not format the SQL query",
        variant: "destructive",
      });
    }
  };
  const shortcuts: KeyboardShortcut[] = [
  {
    key: "F4",
    ctrlKey: false,
    handler: handleRunQuery,
    description: "Run query",
  },
  {
    key: "s",
    ctrlKey: true,
    handler: handleFormatQuery,
    description: "Format SQL",
  },
  {
    key: "x",
    altKey: true,
    handler: handleCopyQuery,
    description: "Copy query",
  },
];
// Add the event listener
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    shortcuts.forEach(({ key, ctrlKey, altKey, handler }) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === !!ctrlKey &&
        event.altKey === !!altKey
      ) {
        event.preventDefault();
        handler();
      }
    });
  };

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}, [query, selectedDatabase]); // Add any other dependencies your handlers use

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0F17] text-white overflow-hidden">
      {/* Navigation */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b border-gray-800 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <Database className="h-6 w-6 text-purple-500" />
          <span className="font-semibold">ShadowDB</span>
        </Link>
      </header>
      <main className="flex flex-col h-full max-h-full w-full overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-gray-800 p-2 flex items-center space-x-2 w-full overflow-x-auto flex-shrink-0">
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
          {/* 
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:bg-purple-600 hover:text-white"
          >
            <Save className="h-4 w-4" />
          </Button> */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:bg-purple-600 hover:text-white"
            onClick={handleCopyQuery}
          >
            <FileCode className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:bg-purple-600 hover:text-white"
            onClick={handleFormatQuery}
            title="Format SQL"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          {/* <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:bg-purple-600 hover:text-white"
          >
            <Settings2 className="h-4 w-4" />
          </Button> */}
          {/* 
          <div className="h-6 w-px bg-gray-800" />

          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:bg-purple-600 hover:text-white"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:bg-purple-600 hover:text-white"
          >
            <Clock className="h-4 w-4" />
          </Button>

          <div className="h-6 w-px bg-gray-800" /> */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:bg-purple-600 hover:text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className=" bg-purple-600 text-white">
              <DropdownMenuItem onClick={exportToCSV}>CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={exportToJSON}>JSON</DropdownMenuItem>
              <DropdownMenuItem onClick={exportToSQL}>SQL</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="ml-auto flex items-center space-x-2">
            <HoverMessage message="Need help with PSQL queries? Check out our documentation.">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:bg-purple-600 hover:text-white"
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
            </HoverMessage>
            {/* <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:bg-purple-600 hover:text-white"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="h-4 w-4" />
            </Button> */}
          </div>
        </div>{" "}
        {/* Query Editor */}
        <div className="flex-1 min-h-0 flex flex-col h-full">
          <div className="h-1/2 border-b border-gray-800">
            <Editor
              defaultLanguage="sql"
              defaultValue="-- Enter your SQL query here"
              value={query}
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
                            {Object.values(row).map((value: string, j) => (
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
                    {mutation.isPending
                      ? "Running query..."
                      : "No results to display"}
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="messages"
                className="flex-1 p-4 overflow-auto"
              >
                {error || mutation.error ? (
                  <div className="text-sm text-red-400">
                    {error ||
                      (mutation.error as Error)?.message ||
                      "An error occurred"}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400">No messages</div>
                )}
              </TabsContent>

              <TabsContent value="explain" className="flex-1 p-4 overflow-auto">
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
