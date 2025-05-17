import React, { useState } from "react";
import { Activity } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatabaseEntry } from "../../../types/database-types";
import { useDatabaseMutations } from "./hooks/useDatabaseMutations";
import { useHAProxyMutations } from "./hooks/useHAProxyMutations";
import { usePgPoolMutations } from "./hooks/usePgPoolMutations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Info,
  Loader2,
  Pause,
  Play,
  PlusCircle,
  Server,
  ServerIcon,
  Share2,
  Trash2,
  ActivityIcon,
} from "lucide-react";
import { format } from "date-fns";

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

  // Get all mutations using custom hooks
  const { startDatabaseMutation, stopDatabaseMutation, deleteDatabaseMutation } = 
    useDatabaseMutations(selectedDatabase, refetchDatabases, setIsProcessing);
  
  const { 
    startHAProxyMutation, 
    stopHAProxyMutation, 
    deleteHAProxyMutation,
    createHAProxyMutation 
  } = useHAProxyMutations(selectedDatabase, refetchDatabases, setIsProcessing);
  
  const { 
    startPgPoolMutation, 
    stopPgPoolMutation, 
    deletePgPoolMutation,
    createPgPoolMutation 
  } = usePgPoolMutations(selectedDatabase, refetchDatabases, setIsProcessing);

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

  // Database Section Component
  const DatabaseSection = () => (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-white">Database Instance</h3>
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
              () => stopDatabaseMutation.mutate(),
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
    </div>
  );

  // HAProxy Section Component
  const HAProxySection = () => {
    // If HAProxy is enabled, show control panel
    if (selectedDatabase.haproxy) {
      return (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-white">HAProxy Service</h3>
            <div className="flex items-center space-x-2">
              {getStatusBadge(selectedDatabase.haproxy?.status)}
              {selectedDatabase.haproxy?.status === "running" && (
                <div className="flex space-x-2">
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
                <p className="text-sm font-medium text-gray-300">Write Port</p>
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
      );
    }

    // If HAProxy is not enabled, show create button
    return (
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
    );
  };

  // PgPool Section Component
  const PgPoolSection = () => {
    // If PgPool is enabled, show control panel
    if (selectedDatabase.pgpool) {
      return (
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
      );
    }

    // If PgPool is not enabled but HAProxy is, show create button
    if (!selectedDatabase.pgpool_enabled && selectedDatabase.haproxy) {
      return (
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
              disabled={isProcessing === "create-pgpool" || !selectedDatabase.haproxy}
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
      );
    }

    // If both are not enabled, return null
    return null;
  };

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
        <DatabaseSection />
        <HAProxySection />
        <PgPoolSection />
      </CardContent>
    </Card>
  );
}
