"use client";

import React, { useState, useEffect} from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { FeaturePreview } from "@/components/ComingSoonToopTipWrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";

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
  const queryClient = useQueryClient();
  const databaseId = selectedDatabase?.id;

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

  // Fetch resource information
  const { data: resourceData, isLoading: resourceLoading } = useQuery({
    queryKey: ["databaseResources", databaseId],
    queryFn: async () => {
      const response = await axios.get(
        `/api/storage/checkdatabaseinfo/?databaseId=${databaseId}`
      );
      console.log(response.data);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // Fetch storage information
  const { data: storageData, isLoading: storageLoading } = useQuery({
    queryKey: ["databaseStorage", databaseId],
    queryFn: async () => {
      console.log("Fetching storage data for database ID:", databaseId);
      const response = await axios.get(
        `/api/storage/checkdatabaseinfo/?databaseId=${databaseId}`
      );
      return response.data;
    },
    enabled: !!databaseId,
  });

  // Update resources mutation
  const updateResourcesMutation = useMutation({
    mutationFn: async (data: { cpu_limit?: number; memory_limit?: number }) => {
      return axios.post("/api/resource/update", {
        database_id: databaseId,
        ...data,
      });
    },
    onSuccess: () => {
      // Update cache
      queryClient.invalidateQueries({
        queryKey: ["databaseResources", databaseId],
      });

      // Update original values for CPU and memory
      setOriginalValues((prev) => ({
        ...prev,
        cpu: cpuValue,
        memory: memoryValue,
      }));

      toast({
        title: "Resources updated",
        description: "Database resources have been updated successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to update resources:", error);
      toast({
        title: "Error",
        description: "Failed to update database resources",
        variant: "destructive",
      });
    },
  });

  // Update storage mutation
  const updateStorageMutation = useMutation({
    mutationFn: async (data: { maxSizeMB: number }) => {
      return axios.post("/api/storage/updateSize", {
        databaseId,
        ...data,
      });
    },
    onSuccess: () => {
      // Update cache
      queryClient.invalidateQueries({
        queryKey: ["databaseStorage", databaseId],
      });

      // Update original values for storage
      setOriginalValues((prev) => ({
        ...prev,
        storage: storageValue,
      }));

      toast({
        title: "Storage updated",
        description: "Database storage limit has been updated successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to update storage:", error);
      toast({
        title: "Error",
        description: "Failed to update storage limit",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {}, []);
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
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          =
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

      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Query Optimization</CardTitle>
          <CardDescription className="text-gray-400">
            Configure query performance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Query Cache</Label>
              <p className="text-sm text-gray-400">
                Cache frequently executed queries
              </p>
            </div>
            <FeaturePreview message="caching is by default enabled and can't be disabled curently">
              <Switch
                disabled={true}
                checked={true}
                className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
              />
            </FeaturePreview>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Auto Vacuum</Label>
              <p className="text-sm text-gray-400">
                Automatically clean up and optimize storage
              </p>
            </div>
            <FeaturePreview>
              <Switch
                disabled={true}
                checked={false}
                className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
              />
            </FeaturePreview>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">Query Timeout (seconds)</Label>
            <FeaturePreview>
              <Input
                type="number"
                defaultValue="30"
                min="1"
                max="3600"
                disabled={true}
                className="bg-[#0B0F17] border-gray-800 w-full md:w-1/3 text-white"
              />
            </FeaturePreview>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
