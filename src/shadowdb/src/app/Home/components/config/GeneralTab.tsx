"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Import component sections
import { DatabaseInfoCard } from "./database-info/DatabaseInfoCard";
import { ConnectionSettingsCard } from "./connection-settings/ConnectionSettingsCard";
import { DatabaseLifecycleCard } from "./database-lifecycle/DatabaseLifecycleCard";

// Types
import { DatabaseEntry } from "../../types/database-types";

interface GeneralTabProps {
  selectedDatabase: DatabaseEntry;
  copyToClipboard: (text: string) => void;
  refetchDatabases: () => Promise<void>;
}

export function GeneralTab({
  selectedDatabase,
  copyToClipboard,
  refetchDatabases,
}: GeneralTabProps) {
  // Get the shared QueryClient from context
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
      />      {/* Database Lifecycle Card */}
      <DatabaseLifecycleCard
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
