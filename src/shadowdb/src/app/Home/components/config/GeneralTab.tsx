"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import axios from "axios";

// Import component sections
import { DatabaseInfoCard } from "./database-info/DatabaseInfoCard";
import { ConnectionSettingsCard } from "./connection-settings/ConnectionSettingsCard";

// Types
import { DatabaseEntry } from "../../types/database-types";

interface GeneralTabProps {
  selectedDatabase: DatabaseEntry;
  copyToClipboard: (text: string) => void;
  refetchDatabases: () => Promise<any>;
}

export function GeneralTab({
  selectedDatabase,
  copyToClipboard,
  refetchDatabases,
}: GeneralTabProps) {
  // Get the shared QueryClient from context
  const queryClient = useQueryClient();

  // Fetch connection configuration from the API
  const { data: connectionConfig, isLoading } = useQuery({
    queryKey: ["connectionConfig", selectedDatabase.id],
    queryFn: async () => {
      const response = await axios.get(
        `/api/users/pool/Connection?database_id=${selectedDatabase.id}`
      );
      return response.data;
    },
    enabled: !!selectedDatabase.id, // Only run this query if we have a database ID
  });

  return (
    <div className="space-y-4">
      {/* Database Information Card */}
      <DatabaseInfoCard
        selectedDatabase={selectedDatabase}
        refetchDatabases={refetchDatabases}
      />

      {/* Connection Settings Card */}
      <ConnectionSettingsCard
        selectedDatabase={selectedDatabase}
        connectionConfig={connectionConfig}
        isLoading={isLoading}
        copyToClipboard={copyToClipboard}
      />
    </div>
  );
}

// Mock function for UpdateDatabaseName
function UpdateDatabaseName(data: {
  tenancy_type: string;
  Original_DB_Name: string;
  New_DB_Name: string;
  database_id: number;
}) {
  // This would be replaced with an actual API call
  return Promise.resolve({
    RenameResult: {
      success: true,
      message: "Database renamed successfully",
    },
  });
}
