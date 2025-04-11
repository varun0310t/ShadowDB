import axios from "axios";

export interface Backup {
  id: number;
  status: string;
  databaseName: string;
  fileName: string;
  fileSize: string;
  backupType: string;
  createdAt: string;
  completedAt: string | null;
}

export interface PaginationState {
  total: number;
  limit: number;
  offset: number;
}

export interface BackupResponse {
  success: boolean;
  backups: Backup[];
  pagination: PaginationState;
}

export const getBackups = async (options: { limit: number; offset: number ,databaseName:string|undefined}) => {
  const response = await axios.get("/api/users/pool/configuration/ManualBackup", {
    params: options,
  });
  return response.data as BackupResponse;
};

export const createBackup = async (data: { databaseName: string }) => {
  const response = await axios.post("/api/users/pool/configuration/ManualBackup", data);
  return response.data;
};

export const downloadBackup = (backupId: number) => {
  window.open(`/api/users/pool/configuration/ManualBackup/download/${backupId}`, "_blank");
};

export const restoreFromBackup = async (backupId: number) => {
  const response = await axios.post("/api/users/pool/configuration/restore", {
    backupId,
  });
  return response.data;
};

export const updateBackupConfiguration = async (config: {
  isEnabled: boolean;
  frequency: string;
  retentionDays: number;
}) => {
  const response = await axios.put("/api/users/pool/configuration/backupConfig", config);
  return response.data;
};