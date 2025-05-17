import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "@/hooks/use-toast";
import { DatabaseEntry } from "../../../../types/database-types";

export function useHAProxyMutations(
  selectedDatabase: DatabaseEntry,
  refetchDatabases?: () => Promise<void>,
  setIsProcessing?: (state: string | null) => void
) {
  const queryClient = useQueryClient();

  const startHAProxyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing?.("start-haproxy");
      const response = await axios.post("/api/haproxy/lifecycle/start", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "HAProxy started",
        description: "HAProxy service is starting up",
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
        title: "Error starting HAProxy",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing?.(null);
    },
  });

  const stopHAProxyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing?.("stop-haproxy");
      const response = await axios.post("/api/haproxy/lifecycle/stop", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "HAProxy stopped",
        description: "HAProxy service is shutting down",
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
        title: "Error stopping HAProxy",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing?.(null);
    },
  });

  const deleteHAProxyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing?.("delete-haproxy");
      const response = await axios.delete(
        `/api/haproxy/lifecycle/delete?database_id=${selectedDatabase.id}&patroni_scope=${selectedDatabase.patroni_scope}`
      );
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "HAProxy deleted",
        description: "HAProxy service has been removed",
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
        title: "Error deleting HAProxy",
        description:
          error?.response?.data?.message || "An unknown error occurred",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsProcessing?.(null);
    },
  });

  const createHAProxyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDatabase.patroni_scope) {
        throw new Error("Database scope not found");
      }
      setIsProcessing?.("create-haproxy");
      const response = await axios.post("/api/haproxy/lifecycle/create", {
        database_id: selectedDatabase.id,
        patroni_scope: selectedDatabase.patroni_scope,
      });
      return response.data;
    },
    onSuccess: async () => {
      toast({
        title: "HAProxy created",
        description: "HAProxy instance created successfully",
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
        title: "Error creating HAProxy",
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
    startHAProxyMutation,
    stopHAProxyMutation,
    deleteHAProxyMutation,
    createHAProxyMutation,
  };
}
