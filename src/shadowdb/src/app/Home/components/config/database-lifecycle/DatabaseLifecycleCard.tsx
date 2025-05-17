import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Activity,
  Info,
  Server,
  Share2,
  Play,
  Pause,
  Trash2,
  Loader2,
  PlusCircle,
  ServerIcon,
  ActivityIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import axios from "axios";
import { DatabaseEntry } from "../../../types/database-types";
import { get } from "http";

interface DatabaseLifecycleCardProps {
  selectedDatabase: DatabaseEntry;
  refetchDatabases?: () => Promise<void>;
}

export function DatabaseLifecycleCard({
  selectedDatabase,
  refetchDatabases,
}: DatabaseLifecycleCardProps) {
  // State for tracking loading states
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Get the shared QueryClient from context
  const queryClient = useQueryClient();

  // Debug log to check the selectedDatabase status
  console.log("DatabaseLifecycleCard - selectedDatabase:", selectedDatabase);

  // Format the created_at date string if it exists
  const formattedCreatedAt = selectedDatabase.created_at
    ? format(new Date(selectedDatabase.created_at), "PPp")
    : "N/A";

  // Get proper status badge color
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-600">Running</Badge>;
      case "maintenance":
        return <Badge className="bg-yellow-600">Maintenance</Badge>;
      case "stopped":
        return <Badge className="bg-red-600">Stopped</Badge>;
      default:
        return <Badge className="bg-gray-600">Unknown</Badge>;
    }
  };
  // Database lifecycle mutations
  const startDatabaseMutation = useMutation({
    mutationFn: async () => {
      console.log("Start database mutation triggered");
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing("start");
      console.log(
        "Starting database with ID:",
        selectedDatabase.id,
        "patroni_scope:",
        selectedDatabase.patroni_scope
      );
      const response = await axios.post("/api/database/lifecycle/start", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "Database started",
        description: "Database instance is starting up",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error starting database",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(null);
    },
  });
  const stopDatabaseMutation = useMutation({
    mutationFn: async () => {
      console.log("Stop database mutation triggered");
      if (!selectedDatabase.patroni_scope) {
        console.error("Database scope not found");
        throw new Error("Database scope not found");
      }
      setIsProcessing("stop");
      console.log(
        "Stopping database with ID:",
        selectedDatabase.id,
        "patroni_scope:",
        selectedDatabase.patroni_scope
      );

      try {
        console.log("Sending stop request to API");
        const response = await axios.post("/api/database/lifecycle/stop", {
          database_id: selectedDatabase.id,
          patroni_scope: selectedDatabase.patroni_scope,
        });
        console.log("Stop database response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error in stopDatabaseMutation:", error);
        throw error;
      }
    },
    onSuccess: async () => {
      toast({
        title: "Database stopped",
        description: "Database instance is shutting down",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error stopping database",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(null);
    },
  });
  const deleteDatabaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing("delete");
      const response = await axios.delete(
        `/api/database/lifecycle/delete?database_id=${selectedDatabase.id}&patroni_scope=${selectedDatabase.patroni_scope}`
      );
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "Database deleted",
        description: "The database has been permanently deleted",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting database",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(null);
    },
  });
  // PgPool service mutations
  const startPgPoolMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing("start-pgpool");
      const response = await axios.post("/api/pgpool/lifecycle/start", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "PgPool started",
        description: "PgPool service is starting up",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error starting PgPool",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(null);
    },
  });
  const stopPgPoolMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing("stop-pgpool");
      const response = await axios.post("/api/pgpool/lifecycle/stop", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "PgPool stopped",
        description: "PgPool service is shutting down",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error stopping PgPool",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(null);
    },
  });

  // HAProxy service mutations
  const startHAProxyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing("start-haproxy");
      const response = await axios.post("/api/haproxy/lifecycle/start", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "HAProxy started",
        description: "HAProxy service is starting up",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error starting HAProxy",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(null);
    },
  });

  const stopHAProxyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing("stop-haproxy");
      const response = await axios.post("/api/haproxy/lifecycle/stop", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "HAProxy stopped",
        description: "HAProxy service is shutting down",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error stopping HAProxy",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(null);
    },
  });

  // Helper function to render action buttons with loading states
  const renderActionButton = (
    action: string,
    icon: React.ReactNode,
    label: string,
    onClick: () => void,
    variant: "default" | "outline" | "destructive" = "default",
    disabled: boolean = false
  ) => {
    const isLoading = isProcessing === action;

    return (
      <Button
        variant={variant}
        size="sm"
        className={`${
          variant === "destructive"
            ? "bg-red-600 hover:bg-red-700"
            : variant === "outline"
            ? "border-gray-700 hover:bg-gray-800"
            : "bg-purple-600 hover:bg-purple-700"
        }`}
        onClick={onClick}
        disabled={isLoading || disabled}
      >
        {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : icon}
        <span className="ml-1">{label}</span>
      </Button>
    );
  };
  // First, add these delete mutations after the existing stop mutations:

  // Add after stopPgPoolMutation
  const deletePgPoolMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing("delete-pgpool");
      const response = await axios.delete(
        `/api/pgpool/lifecycle/delete?database_id=${selectedDatabase.id}&patroni_scope=${selectedDatabase.patroni_scope}`
      );
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "PgPool deleted",
        description: "PgPool service has been removed",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting PgPool",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(null);
    },
  });

  // Add after stopHAProxyMutation
  const deleteHAProxyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing("delete-haproxy");
      const response = await axios.delete(
        `/api/haproxy/lifecycle/delete?database_id=${selectedDatabase.id}&patroni_scope=${selectedDatabase.patroni_scope}`
      );
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "HAProxy deleted",
        description: "HAProxy service has been removed",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting HAProxy",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(null);
    },
  });
  // Add these mutations to the DatabaseLifecycleCard component
  const createHAProxyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing("create-haproxy");
      const response = await axios.post("/api/haproxy/lifecycle/create", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "HAProxy created",
        description: "HAProxy instance created successfully",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({ queryKey: ["databases"] });
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating HAProxy",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(null);
    },
  });

  const createPgPoolMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing("create-pgpool");
      const response = await axios.post("/api/pgpool/lifecycle/create", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "PgPool created",
        description: "PgPool instance created successfully",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({ queryKey: ["databases"] });
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating PgPool",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing(null);
    },
  });
  return (
    <Card className="bg-[#151923] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Activity className="h-5 w-5 mr-2 text-purple-500" />
          Lifecycle Management
        </CardTitle>
        <CardDescription className="text-gray-400">
          Control database instance and service status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Database Instance Information */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-white">
              Database Instance
            </h3>
            <div className="flex space-x-2">
              {selectedDatabase.status === "stopped" &&
                renderActionButton(
                  "start",
                  <Play className="h-4 w-4" />,
                  "Start",
                  () => startDatabaseMutation.mutate()
                )}
              {selectedDatabase.status === "running" &&
                renderActionButton(
                  "stop",
                  <Pause className="h-4 w-4" />,
                  "Stop",
                  () => {
                    console.log(
                      "Stopping database with ID:",
                      selectedDatabase.id
                    );
                    stopDatabaseMutation.mutate();
                  },
                  "outline"
                )}
              {selectedDatabase.status === "stopped" &&
                renderActionButton(
                  "delete",
                  <Trash2 className="h-4 w-4" />,
                  "Delete",
                  () => {
                    if (
                      confirm(
                        "Are you sure you want to delete this database? This action cannot be undone."
                      )
                    ) {
                      deleteDatabaseMutation.mutate();
                    }
                  },
                  "destructive"
                )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex space-x-3 items-center">
              <Server className="text-purple-500 h-5 w-5" />
              <div>
                <p className="text-sm font-medium text-gray-300">Status</p>
                <div className="mt-1">
                  {getStatusBadge(selectedDatabase.status)}
                </div>
              </div>
            </div>
            <div className="flex space-x-3 items-center">
              <Clock className="text-purple-500 h-5 w-5" />
              <div>
                <p className="text-sm font-medium text-gray-300">Created</p>
                <p className="text-sm text-gray-400">{formattedCreatedAt}</p>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* HAProxy Information - Only show if available */}
        {selectedDatabase.haproxy && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-white">
                HAProxy Service
              </h3>
              <div className="flex items-center space-x-2">
                {getStatusBadge(selectedDatabase.haproxy?.status)}
                {selectedDatabase.haproxy?.status === "running" && (
                  <div className="flex space-x-2">
                    {/* HAProxy can be started/stopped independently when the DB is active */}
                    {renderActionButton(
                      "stop-haproxy",
                      <Pause className="h-4 w-4" />,
                      "Stop HAProxy",
                      () => stopHAProxyMutation.mutate(),
                      "outline"
                    )}
                  </div>
                )}
                {selectedDatabase.haproxy?.status === "stopped" && (
                  <div className="flex space-x-2">
                    {renderActionButton(
                      "start-haproxy",
                      <Play className="h-4 w-4" />,
                      "Start HAProxy",
                      () => startHAProxyMutation.mutate()
                    )}

                    {renderActionButton(
                      "delete-haproxy",
                      <Trash2 className="h-4 w-4" />,
                      "Delete",
                      () => {
                        if (
                          confirm(
                            "Are you sure you want to delete the HAProxy service? This action cannot be undone."
                          )
                        ) {
                          deleteHAProxyMutation.mutate();
                        }
                      },
                      "destructive"
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex space-x-3 items-center">
                <Share2 className="text-purple-500 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Write Port
                  </p>
                  <p className="text-sm text-gray-400">
                    {selectedDatabase.haproxy?.write_port || "N/A"}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3 items-center">
                <Share2 className="text-purple-500 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-gray-300">Read Port</p>
                  <p className="text-sm text-gray-400">
                    {selectedDatabase.haproxy?.read_port || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        {!selectedDatabase.haproxy_enabled && (
          <div className="mt-2">
            <h3 className="text-lg font-medium flex items-center gap-2 text-gray-200">
              <ServerIcon className="h-5 w-5 text-blue-500" /> HAProxy
              <Badge variant="destructive">Not Enabled</Badge>
            </h3>
            <div className="mt-2">
              <Button
                size="sm"
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => createHAProxyMutation.mutate()}
                disabled={isProcessing === "create-haproxy"}
              >
                {isProcessing === "create-haproxy" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create HAProxy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        {/* PgPool Information - Only show if available */}
        {/* PgPool Section */}
        {!selectedDatabase.pgpool && selectedDatabase.haproxy !== null && (
          <div className="mt-6">
            <h3 className="text-lg font-medium flex items-center gap-2 text-gray-300">
              <ActivityIcon className="h-5 w-5 text-purple-500" /> PgPool
              <Badge variant="destructive">Not Enabled</Badge>
            </h3>
            <div className="mt-2">
              <Button
                size="sm"
                variant="default"
                className="bg-purple-600 hover:bg-purple-700"
                onClick={() => createPgPoolMutation.mutate()}
                disabled={
                  isProcessing === "create-pgpool" || !selectedDatabase.haproxy
                }
              >
                {isProcessing === "create-pgpool" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create PgPool
                  </>
                )}
              </Button>
              {!selectedDatabase.haproxy && (
                <p className="text-sm text-gray-400 mt-1">
                  HAProxy must be created first before creating PgPool
                </p>
              )}
            </div>
          </div>
        )}
        {selectedDatabase.pgpool && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium text-white">PgPool Service</h3>
              <div className="flex items-center space-x-2">
                {getStatusBadge(selectedDatabase.pgpool?.status)}
                {selectedDatabase.pgpool?.status === "running" && (
                  <div className="flex space-x-2">
                    {renderActionButton(
                      "stop-pgpool",
                      <Pause className="h-4 w-4" />,
                      "Stop PgPool",
                      () => stopPgPoolMutation.mutate(),
                      "outline"
                    )}
                  </div>
                )}
                {selectedDatabase.pgpool?.status === "stopped" && (
                  <div className="flex space-x-2">
                    {renderActionButton(
                      "start-pgpool",
                      <Play className="h-4 w-4" />,
                      "Start PgPool",
                      () => startPgPoolMutation.mutate()
                    )}
                    {renderActionButton(
                      "delete-pgpool",
                      <Trash2 className="h-4 w-4" />,
                      "Delete",
                      () => {
                        if (
                          confirm(
                            "Are you sure you want to delete the PgPool service? This action cannot be undone."
                          )
                        ) {
                          deletePgPoolMutation.mutate();
                        }
                      },
                      "destructive"
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex space-x-3 items-center">
                <Info className="text-purple-500 h-5 w-5" />
                <div>
                  <p className="text-sm font-medium text-gray-300">Port</p>
                  <p className="text-sm text-gray-400">
                    {selectedDatabase.pgpool?.port || "N/A"}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {" "}
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      selectedDatabase.pgpool?.enable_connection_pooling
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-400">
                    Connection Pooling{" "}
                    {selectedDatabase.pgpool?.enable_connection_pooling
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      selectedDatabase.pgpool?.enable_query_cache
                        ? "bg-green-500"
                        : "bg-gray-500"
                    }`}
                  ></div>
                  <span className="text-sm text-gray-400">
                    Query Cache{" "}
                    {selectedDatabase.pgpool?.enable_query_cache
                      ? "Enabled"
                      : "Disabled"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
