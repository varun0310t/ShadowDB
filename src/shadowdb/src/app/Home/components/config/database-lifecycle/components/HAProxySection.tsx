
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Pause, Play, Share2, Trash2, ServerIcon, PlusCircle } from "lucide-react";
import { DatabaseEntry } from "../../../../types/database-types";
import { useHAProxyMutations } from "../hooks/useHAProxyMutations";

interface HAProxySectionProps {
  database: DatabaseEntry;
  isProcessing: string | null;
  setIsProcessing: (value: string | null) => void;
  refetchDatabases?: () => Promise<void>;
}

export function HAProxySection({
  database,
  isProcessing,
  setIsProcessing,
  refetchDatabases,
}: HAProxySectionProps) {
  const { 
    startHAProxyMutation, 
    stopHAProxyMutation, 
    deleteHAProxyMutation,
    createHAProxyMutation 
  } = useHAProxyMutations(database, refetchDatabases, setIsProcessing);

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

  // If HAProxy is enabled, show control panel
  if (database.haproxy) {
    return (
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-white">HAProxy Service</h3>
          <div className="flex items-center space-x-2">
            {getStatusBadge(database.haproxy?.status)}
            {database.haproxy?.status === "running" && (
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
            {database.haproxy?.status === "stopped" && (
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
                {database.haproxy?.write_port || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex space-x-3 items-center">
            <Share2 className="text-purple-500 h-5 w-5" />
            <div>
              <p className="text-sm font-medium text-gray-300">Read Port</p>
              <p className="text-sm text-gray-400">
                {database.haproxy?.read_port || "N/A"}
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
}
