import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

export function useStorageData(databaseId: number | undefined) {
  const queryClient = useQueryClient();

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

  return {
    storageData,
    storageLoading,
    updateStorageMutation,
  };
}
