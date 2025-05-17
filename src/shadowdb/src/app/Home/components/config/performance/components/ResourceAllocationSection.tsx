import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useResourceData } from "../hooks/useResourceData";
import { useStorageData } from "../hooks/useStorageData";
import { DatabaseEntry } from "../../../../types/database-types";

interface ResourceAllocationSectionProps {
  database: DatabaseEntry;
  refetchDatabases?: () => Promise<DatabaseEntry[]>;
}

export function ResourceAllocationSection({
  database,
  refetchDatabases,
}: ResourceAllocationSectionProps) {
  const databaseId = database?.id;
  
  // Custom hooks for data and mutations
  const { resourceData, resourceLoading, updateResourcesMutation } = useResourceData(databaseId);
  const { storageData, storageLoading, updateStorageMutation } = useStorageData(databaseId);

  // State for resource values
  const [cpuValue, setCpuValue] = useState<number>(1);
  const [memoryValue, setMemoryValue] = useState<number>(1);
  const [storageValue, setStorageValue] = useState<number>(100);

  // Original values for comparison
  const [originalValues, setOriginalValues] = useState({
    cpu: 1,
    memory: 1,
    storage: 100,
  });

  // Set initial values when data is loaded
  useEffect(() => {
    if (resourceData?.resources) {
      const cpuAllocation = parseFloat(
        resourceData.resources.allocated_resources.cpu
      );
      const memoryAllocation = parseFloat(
        resourceData.resources.allocated_resources.memory
      );

      setCpuValue(cpuAllocation);
      setMemoryValue(memoryAllocation);

      setOriginalValues((prev) => ({
        ...prev,
        cpu: cpuAllocation,
        memory: memoryAllocation,
      }));
    }
  }, [resourceData]);

  useEffect(() => {
    if (storageData?.storageData) {
      console.log("Storage data:", storageData.storageData.storage);
      // Convert MB to GB for display
      const storageSizeGB = Math.round(
        storageData.storageData.storage.allocated_storage
      );

      setStorageValue(storageSizeGB);
      setOriginalValues((prev) => ({
        ...prev,
        storage: storageSizeGB,
      }));
    }
  }, [storageData]);

  // Save resource changes
  const handleSaveChanges = async () => {
    if (!databaseId) return;

    // Check what has changed
    const cpuChanged = cpuValue !== originalValues.cpu;
    const memoryChanged = memoryValue !== originalValues.memory;
    const storageChanged = storageValue !== originalValues.storage;

    // Update resources if changed
    if (cpuChanged || memoryChanged) {
      updateResourcesMutation.mutate({
        cpu_limit: cpuValue,
        memory_limit: memoryValue,
      });
    }

    // Update storage if changed
    if (storageChanged) {
      updateStorageMutation.mutate({
        maxSizeMB: storageValue,
      });
    }

    // Update original values to match current values
    setOriginalValues({
      cpu: cpuValue,
      memory: memoryValue,
      storage: storageValue,
    });

    // Refetch databases list if provided
    if (refetchDatabases) {
      await refetchDatabases();
    }
  };

  // Check if anything changed
  const hasChanges =
    cpuValue !== originalValues.cpu ||
    memoryValue !== originalValues.memory ||
    storageValue !== originalValues.storage;

  // Calculate if any mutations are in progress
  const isSaving =
    updateResourcesMutation.isPending || updateStorageMutation.isPending;
  const isLoading = resourceLoading || storageLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <Card className="bg-[#151923] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Resource Allocation</CardTitle>
        <CardDescription className="text-gray-400">
          Configure compute and memory resources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-gray-200">CPU Allocation</Label>
            <span className="text-sm font-medium text-gray-200">
              {cpuValue} vCPUs
            </span>
          </div>
          <Slider
            value={[cpuValue]}
            min={0.5}
            max={8}
            step={0.5}
            className="w-full"
            onValueChange={(value) => setCpuValue(value[0])}
          />
          <p className="text-xs text-gray-400">
            Adjust the number of virtual CPUs allocated to your database
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-gray-200">Memory</Label>
            <span className="text-sm font-medium text-gray-200">
              {memoryValue} MB
            </span>
          </div>
          <Slider
            value={[memoryValue]}
            min={1}
            max={4000}
            step={1}
            className="w-full"
            onValueChange={(value) => setMemoryValue(value[0])}
          />
          <p className="text-xs text-gray-400">
            Adjust the amount of RAM allocated to your database
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-gray-200">Storage</Label>
            <span className="text-sm font-medium text-gray-200">
              {storageValue} MB
            </span>
          </div>
          <Slider
            value={[storageValue]}
            min={1}
            max={10000}
            step={1}
            className="w-full"
            onValueChange={(value) => setStorageValue(value[0])}
          />
          <p className="text-xs text-gray-400">
            Adjust the storage capacity for your database
          </p>
        </div>
      </CardContent>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label className="text-gray-200">Storage Usage</Label>
            <span className="text-sm font-medium text-gray-200">
              {storageData?.storageData?.storage?.current_storage || 0} /{" "}
              {storageValue} MB (
              {Math.round(
                ((storageData?.storageData?.storage?.current_storage || 0) /
                  storageValue) *
                  100
              ) || 0}
              %)
            </span>
          </div>

          {/* Storage Usage Bar */}
          <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                (storageData?.storageData?.storage?.current_storage || 0) /
                  storageValue >
                0.8
                  ? "bg-red-500"
                  : (storageData?.storageData?.storage?.current_storage ||
                      0) /
                      storageValue >
                    0.6
                  ? "bg-yellow-500"
                  : "bg-green-500"
              }`}
              style={{
                width: `${Math.min(
                  ((storageData?.storageData?.storage?.current_storage || 0) /
                    storageValue) *
                    100,
                  100
                )}%`,
              }}
            />
          </div>

          <p className="text-xs text-gray-400">
            Current storage usage. When usage approaches the limit, consider
            increasing capacity or cleaning up old data.
          </p>
        </div>
      </CardContent>

      {hasChanges && (
        <CardFooter>
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleSaveChanges}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
