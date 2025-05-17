import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { DatabaseEntry } from "../../../../types/database-types";

export function usePgPoolMutations(
  selectedDatabase: DatabaseEntry,
  refetchDatabases?: () => Promise<void>,
  setIsProcessing?: (state: string | null) => void
) {
  const queryClient = useQueryClient();

  const startPgPoolMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing?.("start-pgpool");
      const response = await axios.post("/api/pgpool/lifecycle/start", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "PgPool started",
        description: "PgPool service is starting up",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error starting PgPool",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing?.(null);
    },
  });

  const stopPgPoolMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing?.("stop-pgpool");
      const response = await axios.post("/api/pgpool/lifecycle/stop", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "PgPool stopped",
        description: "PgPool service is shutting down",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error stopping PgPool",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing?.(null);
    },
  });

  const deletePgPoolMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing?.("delete-pgpool");
      const response = await axios.delete(
        `/api/pgpool/lifecycle/delete?database_id=${selectedDatabase.id}&patroni_scope=${selectedDatabase.patroni_scope}`
      );
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "PgPool deleted",
        description: "PgPool service has been removed",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
      queryClient.invalidateQueries({ queryKey: ["databases"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting PgPool",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing?.(null);
    },
  });

  const createPgPoolMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing?.("create-pgpool");
      const response = await axios.post("/api/pgpool/lifecycle/create", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "PgPool created",
        description: "PgPool instance created successfully",
      });
      if (refetchDatabases) {
        await refetchDatabases();
      }
      queryClient.invalidateQueries({ queryKey: ["databases"] });
      queryClient.invalidateQueries({
        queryKey: ["connectionConfig", selectedDatabase.id],
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating PgPool",
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
    startPgPoolMutation,
    stopPgPoolMutation,
    deletePgPoolMutation,
    createPgPoolMutation,
  };
}
