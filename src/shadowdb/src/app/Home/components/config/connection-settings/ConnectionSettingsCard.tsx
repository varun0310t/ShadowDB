import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { DatabaseEntry, ConnectionConfigType } from "../../../types/database-types";
import  {HAProxyWriteConnection } from "./HAProxyWriteConnection";
import { HAProxyReadConnection } from "./HAProxyReadConnection";
import { PgPoolConnection } from "./PgPoolConnection";
import { NativePostgresConnections } from "./NativePostgresConnections";

interface ConnectionSettingsCardProps {
  selectedDatabase: DatabaseEntry;
  connectionConfig?: ConnectionConfigType;
  isLoading: boolean;
  copyToClipboard: (text: string) => void;
}

export function ConnectionSettingsCard({
  selectedDatabase,
  connectionConfig,
  isLoading,
  copyToClipboard,
}: ConnectionSettingsCardProps) {
  // Add state for PgPool settings
  const [sslEnforced, setSslEnforced] = useState(true);
  const [connectionPooling, setConnectionPooling] = useState(
    selectedDatabase.pgpool?.enable_connection_pooling || false
  );
  const [queryCaching, setQueryCaching] = useState(
    selectedDatabase.pgpool?.enable_query_cache || false
  );

  // Get the shared QueryClient from context
  const queryClient = useQueryClient();

  // Update UI state when connection config loads
  useEffect(() => {
    if (connectionConfig) {
      // Update PgPool settings from the fetched data
      setConnectionPooling(connectionConfig.pgpool.enable_connection_pooling);
      setQueryCaching(connectionConfig.pgpool.enable_query_cache);
    }
  }, [connectionConfig]);

  // Update connection pooling setting
  const updateConnectionPoolingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await axios.post("/api/users/pool/settings/update", {
        database_id: selectedDatabase.id,
        setting: "connection_pooling",
        value: enabled,
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Connection pooling setting has been updated",
        variant: "default",
      });
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "Failed to update connection pooling setting",
        variant: "destructive",
      });
    },
  });

  // Update query caching setting
  const updateQueryCachingMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await axios.post("/api/users/pool/settings/update", {
        database_id: selectedDatabase.id,
        setting: "query_cache",
        value: enabled,
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Query caching setting has been updated",
        variant: "default",
      });
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "Failed to update query caching setting",
        variant: "destructive",
      });
    },
  });

  // Update SSL enforcement setting
  const updateSslEnforcementMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const response = await axios.post("/api/users/pool/settings/update", {
        database_id: selectedDatabase.id,
        setting: "ssl_enforcement",
        value: enabled,
      });
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "SSL enforcement setting has been updated",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.error ||
          "Failed to update SSL enforcement setting",
        variant: "destructive",
      });
    },
  });

  // Handle switch changes
  const handleSslEnforcementChange = (checked: boolean) => {
    setSslEnforced(checked);
    updateSslEnforcementMutation.mutate(checked);
  };

  const handleConnectionPoolingChange = (checked: boolean) => {
    setConnectionPooling(checked);
    updateConnectionPoolingMutation.mutate(checked);
  };

  const handleQueryCachingChange = (checked: boolean) => {
    setQueryCaching(checked);
    updateQueryCachingMutation.mutate(checked);
  };

  return (
    <Card className="bg-[#151923] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Connection Settings</CardTitle>
        <CardDescription className="text-gray-400">
          Configure how applications connect to your database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* HAProxy Write Connection */}
        <HAProxyWriteConnection 
          selectedDatabase={selectedDatabase}
          connectionConfig={connectionConfig}
          copyToClipboard={copyToClipboard}
        />

        {/* HAProxy Read Connection */}
        <HAProxyReadConnection 
          selectedDatabase={selectedDatabase}
          connectionConfig={connectionConfig}
          copyToClipboard={copyToClipboard}
        />

        {/* PgPool Connection */}
        <PgPoolConnection
          selectedDatabase={selectedDatabase}
          connectionConfig={connectionConfig}
          isLoading={isLoading}
          copyToClipboard={copyToClipboard}
        />

        {/* Native Postgres Connections (if available) */}
        {connectionConfig && connectionConfig.all_db_pools && (
          <NativePostgresConnections
            selectedDatabase={selectedDatabase}
            connectionConfig={connectionConfig}
            copyToClipboard={copyToClipboard}
          />
        )}

        {/* Connection Settings Toggles */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-gray-200">SSL Enforcement</Label>
            <p className="text-sm text-gray-400">
              Require SSL/TLS for all connections
            </p>
          </div>
          <Switch
            checked={sslEnforced}
            onCheckedChange={handleSslEnforcementChange}
            className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-black"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-gray-200">Connection Pooling</Label>
            <p className="text-sm text-gray-400">
              Optimize connection management via PgPool
            </p>
          </div>
          <Switch
            checked={
              isLoading
                ? selectedDatabase.pgpool?.enable_connection_pooling || false
                : connectionPooling
            }
            onCheckedChange={handleConnectionPoolingChange}
            className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-black"
            disabled={isLoading || updateConnectionPoolingMutation.isPending}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-gray-200">Query Caching</Label>
            <p className="text-sm text-gray-400">
              Cache read queries to improve performance
            </p>
          </div>
          <Switch
            checked={
              isLoading
                ? selectedDatabase.pgpool?.enable_query_cache || false
                : queryCaching
            }
            onCheckedChange={handleQueryCachingChange}
            className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-black"
            disabled={isLoading || updateQueryCachingMutation.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
