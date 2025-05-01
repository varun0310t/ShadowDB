import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatabaseEntry } from "../../../types/database-types";

interface DatabaseInfoCardProps {
  selectedDatabase: DatabaseEntry;
  refetchDatabases: () => Promise<any>;
}

export function DatabaseInfoCard({
  selectedDatabase,
  refetchDatabases,
}: DatabaseInfoCardProps) {
  const [dbName, setDbName] = useState(selectedDatabase.db_name);
  const [originalDbName, setOriginalDbName] = useState(
    selectedDatabase.db_name
  );

  // Get the shared QueryClient from context
  const queryClient = useQueryClient();

  // Update the dbName and originalDbName when selectedDatabase changes
  useEffect(() => {
    setDbName(selectedDatabase.db_name);
    setOriginalDbName(selectedDatabase.db_name);
  }, [selectedDatabase.db_name]);

  // Existing DB name update mutation
  const updateDbNameMutation = useMutation({
    mutationFn: () =>
      UpdateDatabaseName({
        tenancy_type: selectedDatabase.tenancy_type,
        Original_DB_Name: originalDbName,
        New_DB_Name: dbName,
        database_id: selectedDatabase.id,
      }),
    onSuccess: async (data) => {
      if (data.RenameResult.success) {
        toast({
          title: "Database updated",
          description: "Database name has been successfully updated.",
          variant: "default",
        });
        // Update the original name to match the new name
        setOriginalDbName(dbName);

        // Invalidate queries and refetch databases
        queryClient.invalidateQueries({ queryKey: ["databases"] });

        // Explicitly refetch database list to update UI
        await refetchDatabases();
      } else {
        toast({
          title: "Update failed",
          description:
            data.RenameResult.message || "Failed to update database name",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Failed to update database name",
        variant: "destructive",
      });
    },
  });

  const handleSaveDbName = () => {
    if (dbName !== originalDbName) {
      updateDbNameMutation.mutate();
    }
  };

  const nameChanged = dbName !== originalDbName;

  return (
    <Card className="bg-[#151923] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Database Information</CardTitle>
        <CardDescription className="text-gray-400">
          View and update basic information about your database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="db_name" className="text-gray-200">
              Database Name
            </Label>
            <div className="flex">
              <Input
                id="db_name"
                value={dbName}
                onChange={(e) => setDbName(e.target.value)}
                className="bg-[#0B0F17] border-gray-800 text-white"
              />
              {nameChanged && (
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 border-gray-800 text-gray-800"
                  onClick={handleSaveDbName}
                  disabled={updateDbNameMutation.isPending}
                >
                  {updateDbNameMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {nameChanged && (
              <p className="text-xs text-amber-400">
                Click save button to update the database name
              </p>
            )}
            {updateDbNameMutation.isError && (
              <p className="text-xs text-red-500">
                {updateDbNameMutation.error?.message ||
                  "Failed to update database name"}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="region" className="text-gray-200">
              Region
            </Label>
            <Select defaultValue={selectedDatabase.region}>
              <SelectTrigger className="bg-[#0B0F17] border-gray-800 text-white">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent className="bg-[#151923] border-gray-800 text-white">
                <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                <SelectItem value="us-west-1">US West (N. California)</SelectItem>
                <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                <SelectItem value="ap-southeast-1">
                  Asia Pacific (Singapore)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="created" className="text-gray-200">
              Created At
            </Label>
            <Input
              id="created"
              value={selectedDatabase.created_at}
              disabled
              className="bg-[#0B0F17] border-gray-800 opacity-70 text-gray-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status" className="text-gray-200">
              Status
            </Label>
            <Select defaultValue={selectedDatabase.status}>
              <SelectTrigger className="bg-[#0B0F17] border-gray-800 text-white">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-[#151923] border-gray-800 text-white">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Mock function for UpdateDatabaseName
function UpdateDatabaseName(data: {
  tenancy_type: string;
  Original_DB_Name: string;
  New_DB_Name: string;
  database_id: number;
}) {
  // This would be replaced with an actual API call
  return Promise.resolve({
    RenameResult: {
      success: true,
      message: "Database renamed successfully",
    },
  });
}
