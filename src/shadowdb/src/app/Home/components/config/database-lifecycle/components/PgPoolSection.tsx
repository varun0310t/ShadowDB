
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pause, Play, Info, Trash2, ActivityIcon, PlusCircle } from "lucide-react";
import { DatabaseEntry } from "../../../../types/database-types";
import { usePgPoolMutations } from "../hooks/usePgPoolMutations";

interface PgPoolSectionProps {
  database: DatabaseEntry;
  isProcessing: string | null;
  setIsProcessing: (value: string | null) => void;
  refetchDatabases?: () => Promise<void>;
}

export function PgPoolSection({
  database,
  isProcessing,
  setIsProcessing,
  refetchDatabases,
}: PgPoolSectionProps) {
  const { 
    startPgPoolMutation, 
    stopPgPoolMutation, 
    deletePgPoolMutation,
    createPgPoolMutation 
  } = usePgPoolMutations(database, refetchDatabases, setIsProcessing);

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

  // If PgPool is enabled, show control panel
  if (database.pgpool) {
    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-white">PgPool Service</h3>
          <div className="flex items-center space-x-2">
            {getStatusBadge(database.pgpool?.status)}
            {database.pgpool?.status === "running" && (
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
            {database.pgpool?.status === "stopped" && (
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
                {database.pgpool?.port || "N/A"}
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  database.pgpool?.enable_connection_pooling
                    ? "bg-green-500"
                    : "bg-gray-500"
                }`}
              ></div>
              <span className="text-sm text-gray-400">
                Connection Pooling{" "}
                {database.pgpool?.enable_connection_pooling
                  ? "Enabled"
                  : "Disabled"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  database.pgpool?.enable_query_cache
                    ? "bg-green-500"
                    : "bg-gray-500"
                }`}
              ></div>
              <span className="text-sm text-gray-400">
                Query Cache{" "}
                {database.pgpool?.enable_query_cache
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
  if (!database.pgpool_enabled && database.haproxy) {
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
            disabled={isProcessing === "create-pgpool" || !database.haproxy}
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
          {!database.haproxy && (
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
}
