import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { DatabaseEntry } from "../../../../types/database-types";

export function useDatabaseMutations(
  selectedDatabase: DatabaseEntry,
  refetchDatabases?: () => Promise<void>,
  setIsProcessing?: (state: string | null) => void
) {
  const queryClient = useQueryClient();

  const startDatabaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing?.("start");
      const response = await axios.post("/api/database/lifecycle/start", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "Database started",
        description: "Database instance is starting up",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error starting database",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing?.(null);
    },
  });

  const stopDatabaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing?.("stop");
      const response = await axios.post("/api/database/lifecycle/stop", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "Database stopped",
        description: "Database instance is shutting down",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error stopping database",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing?.(null);
    },
  });

  const deleteDatabaseMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing?.("delete");
      const response = await axios.delete(
        `/api/database/lifecycle/delete?database_id=${selectedDatabase.id}&patroni_scope=${selectedDatabase.patroni_scope}`
      );
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "Database deleted",
        description: "The database has been permanently deleted",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting database",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing?.(null);
    },
  });

  return {
    startDatabaseMutation,
    stopDatabaseMutation,
    deleteDatabaseMutation,
  };
}
