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

export const getBackups = async (options: {
  limit: number;
  offset: number;
  databaseName: string | undefined;
}) => {
  const response = await axios.get(
    "/api/users/pool/configuration/ManualBackup",
    {
      params: options,
    }
  );
  return response.data as BackupResponse;
};

export const createBackup = async (data: { databaseName: string ,databaseID:number}) => {
  const response = await axios.post(
    "/api/users/pool/configuration/ManualBackup",
    data
  );
  return response.data;
};

export const downloadBackup = async (backupId: number) => {
  try {
    // First, get the backup details including the storage path
    const response = await axios.get(
      `/api/users/pool/configuration/ManualBackup`,
      {
        params: { id: backupId },
      }
    );
    const backupDetails = response.data.backup;
    console.log("Backup details:", backupDetails);
    if (!backupDetails.downloadUrl || !backupDetails.fileName) {
      throw new Error("Backup storage information not available");
    }

    // Then fetch the file from storage
    const fileResponse = await axios.get(backupDetails.downloadUrl, {
      responseType: "blob", // Important: get as blob
    });

    // Create a download link and trigger download
    const url = window.URL.createObjectURL(new Blob([fileResponse.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", backupDetails.fileName); // Set the filename
    document.body.appendChild(link);
    link.click();

    // Clean up
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading backup:", error);
    throw error;
  }
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
  const response = await axios.put(
    "/api/users/pool/configuration/backupConfig",
    config
  );
  return response.data;
};
