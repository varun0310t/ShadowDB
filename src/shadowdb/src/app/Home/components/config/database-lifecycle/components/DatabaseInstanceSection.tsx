
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatabaseEntry } from "../../../../types/database-types";
import { Loader2, Pause, Play, Server, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useDatabaseMutations } from "../hooks/useDatabaseMutations";
import { Clock } from "lucide-react";

interface DatabaseInstanceSectionProps {
  database: DatabaseEntry;
  isProcessing: string | null;
  setIsProcessing: (value: string | null) => void;
  refetchDatabases?: () => Promise<void>;
}

export function DatabaseInstanceSection({
  database,
  isProcessing,
  setIsProcessing,
  refetchDatabases,
}: DatabaseInstanceSectionProps) {
  const { startDatabaseMutation, stopDatabaseMutation, deleteDatabaseMutation } =
    useDatabaseMutations(database, refetchDatabases, setIsProcessing);

  // Format date
  const formattedCreatedAt = database.created_at
    ? format(new Date(database.created_at), "PPp")
    : "N/A";

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

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium text-white">Database Instance</h3>
        <div className="flex space-x-2">
          {database.status === "stopped" && 
            renderActionButton(
              "start",
              <Play className="h-4 w-4" />,
              "Start",
              () => startDatabaseMutation.mutate()
            )
          }
          {database.status === "running" && 
            renderActionButton(
              "stop",
              <Pause className="h-4 w-4" />,
              "Stop",
              () => stopDatabaseMutation.mutate(),
              "outline"
            )
          }
          {database.status === "stopped" && 
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
            )
          }
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex space-x-3 items-center">
          <Server className="text-purple-500 h-5 w-5" />
          <div>
            <p className="text-sm font-medium text-gray-300">Status</p>
            <div className="mt-1">{getStatusBadge(database.status)}</div>
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
}
