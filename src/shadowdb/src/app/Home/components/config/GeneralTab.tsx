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
  });  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Database Information Card */}
      <div className="w-full overflow-hidden">
        <DatabaseInfoCard
          selectedDatabase={selectedDatabase}
          refetchDatabases={refetchDatabases}
        />
      </div>
      
      {/* Database Lifecycle Card */}
      <div className="w-full overflow-hidden">
        <DatabaseLifecycleCard
          selectedDatabase={selectedDatabase}
          refetchDatabases={refetchDatabases}
        />
      </div>

      {/* Connection Settings Card */}
      <div className="w-full overflow-hidden">
        <ConnectionSettingsCard
          selectedDatabase={selectedDatabase}
          connectionConfig={connectionConfig}
          isLoading={isLoading}
          copyToClipboard={copyToClipboard}
        />
      </div>
    </div>
  );
}
