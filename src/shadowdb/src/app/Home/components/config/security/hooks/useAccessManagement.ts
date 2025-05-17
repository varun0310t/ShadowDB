import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import {
  getDatabaseAccessUsers,
  grantDatabaseAccess,
  updateDatabaseAccess,
  revokeDatabaseAccess,
} from "@/client/lib/services/DatabasesService";
import type { DatabaseEntry } from "@/app/Home/types/database-types";

// Define interface for user access data
export interface AccessUser {
  id: number;
  name: string;
  email: string;
  access_level: "admin" | "user" | "readonly";
  is_owner: boolean;
}

// Define type for access levels
export type AccessLevel = "admin" | "user" | "read";

export function useAccessManagement(selectedDatabase: DatabaseEntry) {
  // State variables for user management
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isUpdatingAccess, setIsUpdatingAccess] = useState<{
    [key: string]: boolean;
  }>({});
  const [isRevokingAccess, setIsRevokingAccess] = useState<{
    [key: string]: boolean;
  }>({});

  // Load users with access on component mount or when database changes
  useEffect(() => {
    if (selectedDatabase?.db_name) {
      loadAccessUsers();
    }
  }, [selectedDatabase]);

  const loadAccessUsers = async (): Promise<void> => {
    if (!selectedDatabase?.db_name) return;

    setLoading(true);
    try {
      const data = await getDatabaseAccessUsers(selectedDatabase.id);
      setAccessUsers(data.users || []);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error Loading Users",
        description: `Failed to load access list: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (
    email: string,
    accessLevel: AccessLevel
  ): Promise<boolean> => {
    if (!selectedDatabase?.db_name || !email) return false;

    try {
      const result = await grantDatabaseAccess({
        dbName: selectedDatabase.db_name,
        email: email,
        accessLevel: accessLevel,
        database_id: selectedDatabase.id,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: `Access granted to ${email} with ${accessLevel} permissions`,
          variant: "default",
        });
        loadAccessUsers();
        return true;
      } else {
        toast({
          title: "Not Granted",
          description:
            result.message || "User already has access or doesn't exist",
          variant: "default",
        });
        return false;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      toast({
        title: "Error",
        description: errorMessage || `Failed to grant access: ${errorMessage}`,
        variant: "destructive",
      });
      return false;
    }
  };

  const handleUpdateAccess = async (
    email: string,
    accessLevel: AccessLevel
  ): Promise<void> => {
    if (!selectedDatabase?.db_name) return;

    setIsUpdatingAccess((prev) => ({ ...prev, [email]: true }));

    try {
      const result = await updateDatabaseAccess({
        dbName: selectedDatabase.db_name,
        email,
        accessLevel,
        database_id: selectedDatabase.id,
      });

      if (result.success) {
        toast({
          title: "Access Updated",
          description: `User ${email} now has ${accessLevel} permissions`,
          variant: "default",
        });
        loadAccessUsers();
      } else {
        toast({
          title: "Update Failed",
          description: result.message || "Failed to update user permissions",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      toast({
        title: "Error Updating Access",
        description: errorMessage || `Failed to update access: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAccess((prev) => ({ ...prev, [email]: false }));
    }
  };

  const handleRevokeAccess = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!selectedDatabase?.id || !email)
      return { success: false, error: "Invalid database or user" };

    setIsRevokingAccess((prev) => ({ ...prev, [email]: true }));

    try {
      const result = await revokeDatabaseAccess(selectedDatabase.id, email);
      if (result.success) {
        toast({
          title: "Access Revoked",
          description: `User ${email} no longer has access to the database`,
        });
        loadAccessUsers();
        return { success: true };
      } else {
        return {
          success: false,
          error: result.message || "Failed to revoke access",
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      toast({
        title: "Error Revoking Access",
        description: errorMessage || `Failed to revoke access: ${errorMessage}`,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    } finally {
      setIsRevokingAccess((prev) => ({ ...prev, [email]: false }));
    }
  };

  return {
    accessUsers,
    loading,
    isUpdatingAccess,
    isRevokingAccess,
    loadAccessUsers,
    handleGrantAccess,
    handleUpdateAccess,
    handleRevokeAccess,
  };
}
