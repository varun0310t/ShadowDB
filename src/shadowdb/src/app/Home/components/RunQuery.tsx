"use client";

import { useEffect } from "react";
import { useState, useRef } from "react";
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
    db_name: string;
    tenancy_type: string;
    access_level: string;
  }>;
}) {  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("data");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Add ref for Monaco Editor
  const editorRef = useRef<any>(null);

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
  }, [query, selectedDatabase]); // Add any other dependencies your handlers use  // Handle window resize with proper Monaco Editor layout fix
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current) {
        // Make editor as small as possible first
        editorRef.current.layout({ width: 0, height: 0 });

        // Wait for next frame to ensure last layout finished
        window.requestAnimationFrame(() => {
          // Get the parent dimensions and re-layout the editor
          const editorContainer = editorRef.current.getContainerDomNode();
          const parent = editorContainer?.parentElement;
          
          if (parent) {
            const rect = parent.getBoundingClientRect();
            editorRef.current.layout({ width: rect.width, height: rect.height });
          }
        });
      }
    };

    // Initial resize after component mount
    setTimeout(handleResize, 100);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <div
      className="flex flex-col h-full w-full bg-[#0B0F17] text-white min-w-0 overflow-hidden force-resize"
      style={{ maxWidth: "100%", width: "100%" }}
    >
      {/* Navigation - Hidden on mobile since it's within the main app */}
      <header className="hidden md:flex px-4 lg:px-6 h-14 items-center border-b border-gray-800 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <Database className="h-6 w-6 text-purple-500" />
          <span className="font-semibold">ShadowDB</span>
        </Link>
      </header>{" "}
      <main className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden w-full max-w-full">
        {/* Toolbar - Responsive */}
        <div className="border-b border-gray-800 p-3 md:p-4 flex-shrink-0 min-w-0 w-full max-w-full">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 sm:items-center max-w-full min-w-0">
            {/* Database Selection */}
            <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
              {" "}
              <Select
                value={selectedDatabase}
                onValueChange={setSelectedDatabase}
              >
                <SelectTrigger className="w-full sm:max-w-[200px] bg-[#151923] border-gray-800 h-10 min-w-0">
                  <SelectValue placeholder="Select Database" />
                </SelectTrigger>
                <SelectContent className="bg-[#151923] border-gray-800 text-gray-400 min-w-0">
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
            </div>{" "}
            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap min-w-0 flex-shrink">
              <div className="hidden sm:block h-6 w-px bg-gray-800" />

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:bg-purple-600 hover:text-white h-10"
                onClick={handleCopyQuery}
              >
                <FileCode className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Copy</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:bg-purple-600 hover:text-white h-10"
                onClick={handleFormatQuery}
                title="Format SQL"
              >
                <AlignLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Format</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:bg-purple-600 hover:text-white h-10"
                  >
                    <Download className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Export</span>
                    <ChevronDown className="h-4 w-4 sm:ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-purple-600 text-white">
                  <DropdownMenuItem onClick={exportToCSV}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToJSON}>
                    JSON
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToSQL}>SQL</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden sm:block ml-auto">
                <HoverMessage message="Need help with PSQL queries? Check out our documentation.">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:bg-purple-600 hover:text-white h-10"
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </HoverMessage>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Query Editor & Results */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden w-full max-w-full">
          {/* Query Editor Section */}
          <div className="flex flex-col lg:h-1/2 min-h-[300px] border-b border-gray-800 relative overflow-hidden min-w-0 max-w-full">
            {" "}
            <div
              className="flex-1 min-h-0 min-w-0 overflow-hidden w-full max-w-full"
              style={{ minWidth: 0 }}
            >
              <Editor
                defaultLanguage="sql"
                defaultValue="-- Enter your PSQL query here"
                value={query}
                theme="vs-dark"
                width="100%"
                height="100%"
                options={{
             
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: "on",
                  wordWrap: "on",
                  automaticLayout: true,
                  scrollbar: {
                    horizontal: "auto",
                    vertical: "auto",
                  },
                  overviewRulerBorder: false,
                  hideCursorInOverviewRuler: true,
                  renderLineHighlight: "none",
                }}                onChange={(value) => setQuery(value || "")}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                className=" position-absolute"
              />
            </div>
            {/* Run Query Button - Responsive positioning */}
            <div className="absolute bottom-4 right-4">
              <Button
                className="bg-purple-600 hover:bg-purple-700 shadow-lg"
                onClick={handleRunQuery}
                disabled={mutation.isPending || !selectedDatabase}
              >
                {mutation.isPending ? (
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">Run Query</span>
                <span className="sm:hidden">Run</span>
              </Button>
            </div>
          </div>{" "}
          {/* Results Area */}
          <div className="flex-1 min-h-0 min-w-0 lg:h-1/2 overflow-hidden w-full">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="h-full flex flex-col overflow-hidden min-w-0 w-full"
            >
              <TabsList className="border-b border-gray-800 bg-transparent p-2 md:p-4 justify-start flex-shrink-0">
                <TabsTrigger
                  value="data"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs md:text-sm px-3 md:px-4"
                >
                  Data Output
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs md:text-sm px-3 md:px-4"
                >
                  Messages
                </TabsTrigger>
             
              </TabsList>{" "}
              <TabsContent
                className="flex-1 min-w-0 p-3 md:p-4 min-h-0 overflow-auto w-full"
                value="data"
              >
                {results.length > 0 ? (
                  <div className="overflow-auto h-full min-w-0 w-full">
                    <table className="table-fixed w-full text-xs md:text-sm text-left text-gray-300">
                      <thead className="text-xs uppercase bg-[#151923] text-gray-400 sticky top-0">
                        <tr>
                          {Object.keys(results[0]).map((key) => (
                            <th
                              key={key}
                              className="px-2 md:px-4 py-2 md:py-3 break-words"
                            >
                              <div className="truncate">{key}</div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-gray-800 hover:bg-gray-800/30"
                          >
                            {Object.values(row).map((value: string, j) => (
                              <td
                                key={j}
                                className="px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm"
                              >
                                <div
                                  className="truncate min-w-0 max-w-full"
                                  title={
                                    typeof value === "object" && value !== null
                                      ? JSON.stringify(value)
                                      : String(value)
                                  }
                                >
                                  {typeof value === "object" && value !== null
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[200px]">
                    <div className="text-center">
                      <Database className="h-12 w-12 md:h-16 md:w-16 text-gray-600 mx-auto mb-4" />
                      <div className="text-sm md:text-base text-gray-400">
                        {mutation.isPending
                          ? "Running query..."
                          : "No results to display"}
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 mt-2">
                        {!mutation.isPending &&
                          "Execute a query to see results here"}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>{" "}
              <TabsContent
                value="messages"
                className="flex-1 min-w-0 p-3 md:p-4 overflow-auto min-h-0 w-full"
              >
                {error || mutation.error ? (
                  <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                    <div className="text-sm md:text-base text-red-400 font-medium mb-2">
                      Query Error
                    </div>
                    <div className="text-xs md:text-sm text-red-300 font-mono break-words">
                      {error ||
                        (mutation.error as Error)?.message ||
                        "An error occurred"}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[200px]">
                    <div className="text-center">
                      <div className="text-sm md:text-base text-gray-400">
                        No messages
                      </div>
                      <div className="text-xs md:text-sm text-gray-500 mt-2">
                        Error messages and query information will appear here
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
          
            </Tabs>
          </div>
        </div>{" "}
      </main>
    </div>
  );
}
