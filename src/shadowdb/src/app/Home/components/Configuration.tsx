"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Database,
  Shield,
  Settings,
  Key,
  Save,
  Server,
  HardDrive,
} from "lucide-react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GenerateQueryToken } from "@/client/lib/services/DatabasesService";
import axios from "axios";

// Import tab components
import { GeneralTab } from "./config/GeneralTab";
import { PerformanceTab } from "./config/PerformanceTab";
import { BackupTab } from "./config/BackupTab";
import { SecurityTab } from "./config/SecurityTab";
import { ApiTokensTab } from "./config/ApiTokensTab";

// Import types
import { DatabaseConfigProps, DatabaseEntry, TokenType } from "./types/DatabaseTypes";
import { Label } from "@/components/ui/label";

export default function DatabaseConfiguration({
  databases,
}: DatabaseConfigProps) {
  const [activeTab, setActiveTab] = useState("general");
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>("");
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseEntry | null>(null);
  const [apiTokens, setApiTokens] = useState<TokenType[]>([]);
  const [newToken, setNewToken] = useState<TokenType | null>(null);
  const [tokenExpiryDays, setTokenExpiryDays] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  const queryClient = useQueryClient();

  const {
    data: tokensData,
    isLoading: isLoadingTokens,
  } = useQuery({
    queryKey: ["tokens"],
    queryFn: async () => {
      const response = await axios.get("/api/query/Tokens");
      return response.data.tokens as TokenType[];
    },
    enabled: activeTab === "api",
  });

  const generateTokenMutation = useMutation({
    mutationFn: GenerateQueryToken,
    onSuccess: (data) => {
      setNewToken(data);
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
    },
  });

  const deleteTokenMutation = useMutation({
    mutationFn: async (tokenId: number) => {
      return await axios.delete(`/api/query/Tokens?id=${tokenId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tokens"] });
    },
  });

  useEffect(() => {
    if (tokensData) {
      setApiTokens(tokensData);
    }
  }, [tokensData]);

  useEffect(() => {
    if (selectedDatabaseId && databases.length > 0) {
      const database = databases.find((db) => db.id.toString() === selectedDatabaseId) || null;

      if (database) {
        setSelectedDatabase({
          ...database,
          region: database.region || "us-east-1",
          created_at: database.created_at || new Date().toISOString().split("T")[0],
          status: database.status || "active",
        });
        setIsLoading(false);
      }
    } else {
      setSelectedDatabase(null);
      setIsLoading(databases.length === 0);
    }
  }, [selectedDatabaseId, databases]);

  useEffect(() => {
    if (databases.length > 0 && !selectedDatabaseId) {
      setSelectedDatabaseId(databases[0].id.toString());
    }
  }, [databases, selectedDatabaseId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateNewToken = () => {
    generateTokenMutation.mutate({ expiresInDays: tokenExpiryDays });
  };

  const deleteToken = (tokenId: number) => {
    deleteTokenMutation.mutate(tokenId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 animate-fadeIn">
        <Card className="bg-[#151923] border-gray-800">
          <CardContent className="p-8 flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-full border-2 border-purple-600 border-t-transparent animate-spin mb-4"></div>
            <h2 className="text-xl font-medium mb-2">
              Loading database configuration...
            </h2>
            <p className="text-gray-400">
              Please wait while we fetch your database details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedDatabase) {
    return (
      <div className="container mx-auto p-6 animate-fadeIn">
        <Card className="bg-[#151923] border-gray-800">
          <CardHeader>
            <CardTitle>Select Database</CardTitle>
            <CardDescription>Choose a database to configure</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {databases.length === 0 ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No Databases Available
                </h3>
                <p className="text-gray-400 mb-4">
                  You don't have any databases yet.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Create Database
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Label htmlFor="database-select">
                  Select a database to configure
                </Label>
                <Select
                  value={selectedDatabaseId}
                  onValueChange={setSelectedDatabaseId}
                >
                  <SelectTrigger
                    id="database-select"
                    className="w-full bg-[#0B0F17] border-gray-800"
                  >
                    <SelectValue placeholder="Select Database" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#151923] border-gray-800">
                    {databases.map((db) => (
                      <SelectItem key={db.id} value={db.id.toString()}>
                        {db.db_name} ({db.tenancy_type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-md bg-purple-600/20 flex items-center justify-center">
            <Database className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">{selectedDatabase.db_name}</h1>
              <Select
                value={selectedDatabaseId}
                onValueChange={setSelectedDatabaseId}
              >
                <SelectTrigger className="h-8 px-2 text-sm bg-transparent border-0 hover:bg-gray-800 focus:ring-0">
                  <span className="sr-only">Change database</span>
                </SelectTrigger>
                <SelectContent className="bg-[#151923] border-gray-800">
                  {databases.map((db) => (
                    <SelectItem key={db.id} value={db.id.toString()}>
                      {db.db_name} ({db.tenancy_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <Badge
                className={
                  selectedDatabase.status === "active"
                    ? "bg-green-600"
                    : selectedDatabase.status === "maintenance"
                    ? "bg-yellow-600"
                    : "bg-red-600"
                }
              >
                {(selectedDatabase.status || "unknown")
                  .charAt(0)
                  .toUpperCase() +
                  (selectedDatabase.status || "unknown").slice(1)}
              </Badge>
              <Badge className="bg-purple-600">
                {selectedDatabase.tenancy_type.charAt(0).toUpperCase() +
                  selectedDatabase.tenancy_type.slice(1)}
              </Badge>
            </div>
          </div>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="bg-gray-800 p-1">
          <TabsTrigger
            value="general"
            className="data-[state=active]:bg-purple-600"
          >
            <Settings className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger
            value="performance"
            className="data-[state=active]:bg-purple-600"
          >
            <Server className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger
            value="backup"
            className="data-[state=active]:bg-purple-600"
          >
            <HardDrive className="h-4 w-4 mr-2" />
            Backup & Recovery
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-purple-600"
          >
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="api"
            className="data-[state=active]:bg-purple-600"
          >
            <Key className="h-4 w-4 mr-2" />
            API Tokens
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <GeneralTab 
            selectedDatabase={selectedDatabase} 
            copyToClipboard={copyToClipboard} 
          />
        </TabsContent>

        {/* Performance Settings */}
        <TabsContent value="performance" className="space-y-4">
          <PerformanceTab />
        </TabsContent>

        {/* Backup & Recovery */}
        <TabsContent value="backup" className="space-y-4">
          <BackupTab />
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <SecurityTab />
        </TabsContent>

        {/* API Tokens */}
        <TabsContent value="api" className="space-y-4">
          <ApiTokensTab 
            apiTokens={apiTokens}
            newToken={newToken}
            setNewToken={setNewToken}
            tokenExpiryDays={tokenExpiryDays}
            setTokenExpiryDays={setTokenExpiryDays}
            isLoadingTokens={isLoadingTokens}
            generateTokenMutation={generateTokenMutation}
            deleteTokenMutation={deleteTokenMutation}
            copyToClipboard={copyToClipboard}
            generateNewToken={generateNewToken}
            deleteToken={deleteToken}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
