"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { useResourceData } from "./performance/hooks/useResourceData";
import { useStorageData } from "./performance/hooks/useStorageData";
import { ResourceAllocationSection } from "./performance/components/ResourceAllocationSection";
import { QueryOptimizationSection } from "./performance/components/QueryOptimizationSection";

// Types
import { DatabaseEntry } from "../../types/database-types";

interface PerformanceTabProps {
  selectedDatabase: DatabaseEntry;
  refetchDatabases?: () => Promise<DatabaseEntry[]>;
}

export function PerformanceTab({
  selectedDatabase,
  refetchDatabases,
}: PerformanceTabProps) {
  const databaseId = selectedDatabase?.id;
  
  // Use the custom hooks
  const { resourceLoading } = useResourceData(databaseId);
  const { storageLoading } = useStorageData(databaseId);
  
  // Check if data is still loading
  const isLoading = resourceLoading || storageLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResourceAllocationSection 
        database={selectedDatabase}
        refetchDatabases={refetchDatabases}
      />
      <QueryOptimizationSection />
    </div>
  );
}
