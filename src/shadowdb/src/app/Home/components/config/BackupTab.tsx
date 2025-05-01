import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import {
  RefreshCw,
  Download,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  getBackups,
  createBackup,
  downloadBackup,
  restoreFromBackup,
  updateBackupConfiguration,
  Backup,
  PaginationState,
} from "@/client/lib/services/BackupService";
import { DatabaseEntry } from "../types/DatabaseTypes";

interface BackupTabProps {
  selectedDatabase: DatabaseEntry;
}

export function BackupTab({ selectedDatabase }: BackupTabProps) {
  const [isBackupEnabled, setIsBackupEnabled] = useState(true);
  const [frequency, setFrequency] = useState("daily");
  const [retention, setRetention] = useState("7");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    total: 0,
    limit: 10,
    offset: 0,
  });
  const { toast } = useToast();
console.log("selectedDatabase", selectedDatabase);
  // Load backups on component mount and when pagination or database changes
  useEffect(() => {
    if (selectedDatabase?.db_name) {
      fetchBackups();
    }
  }, [pagination.offset, pagination.limit, selectedDatabase?.db_name]);

  const fetchBackups = async () => {
    setIsLoading(true);
    try {
      const data = await getBackups({
        limit: pagination.limit,
        offset: pagination.offset,
        databaseName: selectedDatabase?.db_name,
      });

      if (data.success) {
        setBackups(data.backups);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
        }));
      } else {
        console.error("Failed to fetch backups:", data);
        toast({
          title: "Error",
          description: "Failed to load backups",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching backups:", error);
      toast({
        title: "Error",
        description: "Failed to load backups",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!selectedDatabase?.db_name) {
      toast({
        title: "Error",
        description: "No database selected",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingBackup(true);
    try {
      const data = await createBackup({
        databaseName: selectedDatabase.db_name,
        databaseID: selectedDatabase.id,
      });

      if (data.success) {
        toast({
          title: "Success",
          description: "Backup process started successfully",
        });
        // Refresh the list after a short delay
        setTimeout(fetchBackups, 2000);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create backup",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backupId: number) => {
    try {
      const data = await restoreFromBackup(backupId);

      if (data.success) {
        toast({
          title: "Success",
          description: "Restore process started successfully",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to restore from backup",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast({
        title: "Error",
        description: "Failed to restore from backup",
        variant: "destructive",
      });
    }
  };

  const handleDownloadBackup = (backupId: number) => {
    downloadBackup(backupId);
  };

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      setPagination((prev) => ({
        ...prev,
        offset: prev.offset + prev.limit,
      }));
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      setPagination((prev) => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit),
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "yyyy-MM-dd HH:mm");
  };

  return (
    <div className="space-y-4">
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Backup Configuration</CardTitle>
          <CardDescription className="text-gray-400">
            Configure automated backup settings for {selectedDatabase?.db_name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Automated Backups</Label>
              <p className="text-sm text-gray-400">
                Schedule regular database backups
              </p>
            </div>
            <Switch
              checked={isBackupEnabled}
              onCheckedChange={setIsBackupEnabled}
              className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">Backup Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="bg-[#0B0F17] border-gray-800 w-full md:w-1/3 text-white">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent className="bg-[#151923] border-gray-800 text-white">
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">Retention Period (days)</Label>
            <Input
              type="number"
              value={retention}
              onChange={(e) => setRetention(e.target.value)}
              min="1"
              max="365"
              className="bg-[#0B0F17] border-gray-800 w-full md:w-1/3 text-white"
            />
          </div>

          <div className="pt-4">
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleCreateBackup}
              disabled={isCreatingBackup || !selectedDatabase?.db_name}
            >
              {isCreatingBackup ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Backup...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Create Manual Backup
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#151923] border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Recent Backups</CardTitle>
            <CardDescription className="text-gray-400">
              View and restore from recent backups
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-gray-700"
            onClick={fetchBackups}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-800">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="bg-[#0B0F17]">
                  <tr className="border-b border-gray-800">
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      ID
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Database
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Date
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Size
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Status
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Type
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {backups.length > 0 ? (
                    backups.map((backup) => (
                      <tr
                        key={`backup-${backup.id}`}
                        className="border-b border-gray-800"
                      >
                        <td className="p-4 align-middle">#{backup.id}</td>
                        <td className="p-4 align-middle">
                          {backup.databaseName}
                        </td>
                        <td className="p-4 align-middle">
                          {formatDate(backup.createdAt)}
                        </td>
                        <td className="p-4 align-middle">
                          {backup.fileSize || "N/A"}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge
                            className={
                              backup.status === "completed"
                                ? "bg-green-600"
                                : backup.status === "in_progress"
                                ? "bg-yellow-600"
                                : backup.status === "failed"
                                ? "bg-red-600"
                                : "bg-gray-600"
                            }
                          >
                            {backup.status}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          <Badge
                            className={
                              backup.backupType === "manual"
                                ? "bg-blue-600"
                                : "bg-green-600"
                            }
                          >
                            {backup.backupType === "manual"
                              ? "Manual"
                              : "Automated"}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-gray-800 text-gray-300"
                            disabled={backup.status !== "completed"}
                            onClick={() => handleRestoreBackup(backup.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                          {backup.status === "completed" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-gray-800 text-gray-300"
                              onClick={() => handleDownloadBackup(backup.id)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-4 text-center text-gray-500">
                        {isLoading ? "Loading backups..." : "No backups found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {backups.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-400">
                Showing {pagination.offset + 1} to{" "}
                {Math.min(pagination.offset + backups.length, pagination.total)}{" "}
                of {pagination.total} backups
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.offset === 0}
                  onClick={handlePrevPage}
                  className="border-gray-700"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    pagination.offset + pagination.limit >= pagination.total
                  }
                  onClick={handleNextPage}
                  className="border-gray-700"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
