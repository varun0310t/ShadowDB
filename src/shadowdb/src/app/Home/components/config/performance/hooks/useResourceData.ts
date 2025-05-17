import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

export function useResourceData(databaseId: number | undefined) {
  const queryClient = useQueryClient();

  // Fetch resource information
  const { data: resourceData, isLoading: resourceLoading } = useQuery({
    queryKey: ["databaseResources", databaseId],
    queryFn: async () => {
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

  return {
    resourceData,
    resourceLoading,
    updateResourcesMutation,
  };
}
