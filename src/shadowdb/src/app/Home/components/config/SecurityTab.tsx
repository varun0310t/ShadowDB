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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Trash2,
  Plus,
  Lock,
  UserPlus,
  Shield,
  AlertCircle,
  Check,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  getDatabaseAccessUsers,
  grantDatabaseAccess,
  updateDatabaseAccess,
  revokeDatabaseAccess,
} from "@/client/lib/services/DatabasesService";
import { DatabaseEntry } from "../types/DatabaseTypes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define interface for user access data
interface AccessUser {
  id: number;
  name: string;
  email: string;
  access_level: "admin" | "user" | "read";
  is_owner: boolean;
}

// Define props interface to match GeneralTab pattern
interface SecurityTabProps {
  selectedDatabase: DatabaseEntry;
}

// Define type for access levels
type AccessLevel = "admin" | "user" | "read";

export function SecurityTab({ selectedDatabase }: SecurityTabProps) {
  // State variables for user management
  const [accessUsers, setAccessUsers] = useState<AccessUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserEmailError, setNewUserEmailError] = useState<string>("");
  const [newUserAccessLevel, setNewUserAccessLevel] = useState<AccessLevel>("read");
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isGrantingAccess, setIsGrantingAccess] = useState<boolean>(false);
  const [isUpdatingAccess, setIsUpdatingAccess] = useState<{ [key: string]: boolean }>({});
  const [isRevokingAccess, setIsRevokingAccess] = useState<{ [key: string]: boolean }>({});
  
  // State for confirm dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [userToRevoke, setUserToRevoke] = useState<string>("");
  const [revokeError, setRevokeError] = useState<string>("");

  // Fetch users with access on component mount or when database changes
  useEffect(() => {
    if (selectedDatabase?.db_name) {
      loadAccessUsers();
    }
  }, [selectedDatabase]);

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setNewUserEmailError("Please enter a valid email address");
      return false;
    }
    setNewUserEmailError("");
    return true;
  };

  const loadAccessUsers = async (): Promise<void> => {
    if (!selectedDatabase?.db_name) return;
    
    setLoading(true);
    try {
      const data = await getDatabaseAccessUsers(selectedDatabase.db_name);
      setAccessUsers(data.users || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Error Loading Users",
        description: `Failed to load access list: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedDatabase?.db_name || !newUserEmail) return;
    
    if (!validateEmail(newUserEmail)) {
      return;
    }

    setIsGrantingAccess(true);

    try {
      const result = await grantDatabaseAccess({
        dbName: selectedDatabase.db_name,
        email: newUserEmail,
        accessLevel: newUserAccessLevel,
      });

      if (result.success) {
        toast({
          title: "Success",
          description: `Access granted to ${newUserEmail} with ${newUserAccessLevel} permissions`,
          variant: "default",
        });
        loadAccessUsers();
        setNewUserEmail("");
        setIsDialogOpen(false);
      } else {
        toast({
          title: "Not Granted",
          description: result.message || "User already has access or doesn't exist",
          variant: "default",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse = (error as any)?.response?.data?.error;
      
      toast({
        title: "Error",
        description: errorResponse || `Failed to grant access: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsGrantingAccess(false);
    }
  };

  const handleUpdateAccess = async (email: string, accessLevel: AccessLevel): Promise<void> => {
    if (!selectedDatabase?.db_name) return;

    setIsUpdatingAccess(prev => ({ ...prev, [email]: true }));

    try {
      const result = await updateDatabaseAccess({
        dbName: selectedDatabase.db_name,
        email,
        accessLevel,
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse = (error as any)?.response?.data?.error;
      
      toast({
        title: "Error Updating Access",
        description: errorResponse || `Failed to update access: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdatingAccess(prev => ({ ...prev, [email]: false }));
    }
  };

  const openRevokeConfirm = (email: string) => {
    setUserToRevoke(email);
    setRevokeError("");
    setConfirmDialogOpen(true);
  };

  const handleRevokeAccess = async (): Promise<void> => {
    if (!selectedDatabase?.db_name || !userToRevoke) return;

    setIsRevokingAccess(prev => ({ ...prev, [userToRevoke]: true }));

    try {
      const result = await revokeDatabaseAccess(selectedDatabase.db_name, userToRevoke);
      if (result.success) {
        toast({
          title: "Access Revoked",
          description: `User ${userToRevoke} no longer has access to the database`,
        });
        loadAccessUsers();
        setConfirmDialogOpen(false);
      } else {
        setRevokeError(result.message || "Failed to revoke access");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse = (error as any)?.response?.data?.error;
      
      setRevokeError(errorResponse || `Error: ${errorMessage}`);
      
      toast({
        title: "Error Revoking Access",
        description: errorResponse || `Failed to revoke access: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsRevokingAccess(prev => ({ ...prev, [userToRevoke]: false }));
    }
  };

  const getAccessLevelBadge = (accessLevel: string, isOwner = false): JSX.Element => {
    if (isOwner) {
      return <Badge className="bg-purple-900 hover:bg-purple-800">Owner</Badge>;
    }

    switch (accessLevel) {
      case 'admin':
        return <Badge className="bg-red-900 hover:bg-red-800">Admin</Badge>;
      case 'user':
        return <Badge className="bg-blue-900 hover:bg-blue-800">User</Badge>;
      case 'read':
        return <Badge className="bg-green-900 hover:bg-green-800">Read</Badge>;
      default:
        return <Badge>{accessLevel}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Access Control Card */}
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Access Control</CardTitle>
            <CardDescription className="text-gray-400">
              Manage users who can access your database
            </CardDescription>
          </div>
          {selectedDatabase?.db_name && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-gray-700 text-gray-800 hover:text-black"
                >
                  <UserPlus className="h-4 w-4 mr-2" /> Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0B0F17] text-white border-gray-800">
                <DialogHeader>
                  <DialogTitle>Grant Database Access</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Add a user to database "{selectedDatabase.db_name}"
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleGrantAccess}>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">User Email</Label>
                      <Input
                        id="email"
                        placeholder="user@example.com"
                        value={newUserEmail}
                        onChange={(e) => {
                          setNewUserEmail(e.target.value);
                          if (newUserEmailError) validateEmail(e.target.value);
                        }}
                        className={`bg-[#151923] border-gray-800 text-white ${
                          newUserEmailError ? "border-red-500" : ""
                        }`}
                        required
                        disabled={isGrantingAccess}
                      />
                      {newUserEmailError && (
                        <p className="text-xs text-red-500 mt-1">{newUserEmailError}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="access-level">Access Level</Label>
                      <Select 
                        value={newUserAccessLevel}
                        onValueChange={(value: string) => setNewUserAccessLevel(value as AccessLevel)}
                        disabled={isGrantingAccess}
                      >
                        <SelectTrigger className="bg-[#151923] border-gray-800 text-white">
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#151923] border-gray-800 text-white">
                          <SelectItem value="admin">
                            <div className="flex items-center">
                              <Shield className="h-4 w-4 mr-2 text-red-500" />
                              <span>Admin (Full Control)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="user">
                            <div className="flex items-center">
                              <UserPlus className="h-4 w-4 mr-2 text-blue-500" />
                              <span>User (Read/Write)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="read">
                            <div className="flex items-center">
                              <Lock className="h-4 w-4 mr-2 text-green-500" />
                              <span>Read Only</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400 mt-1">
                        <span className="font-semibold">Note:</span> The user must have an account in this system to be granted access.
                      </p>
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={isGrantingAccess}
                    >
                      {isGrantingAccess ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Granting Access...
                        </>
                      ) : (
                        <>Grant Access</>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedDatabase?.db_name ? (
            <div className="flex items-center justify-center p-6 text-gray-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              Select a database to manage access control
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center p-6 text-gray-400">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading access data...
            </div>
          ) : accessUsers.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 text-gray-500" />
              <p>No users with access found</p>
              <p className="text-sm mt-1">Add users using the "Add User" button above</p>
            </div>
          ) : (
            <div className="rounded-md border border-gray-800">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-[#0B0F17]">
                    <TableHead className="text-gray-300">User</TableHead>
                    <TableHead className="text-gray-300">Email</TableHead>
                    <TableHead className="text-gray-300">Access Level</TableHead>
                    <TableHead className="text-right text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessUsers.map((user) => (
                    <TableRow key={user.id} className="border-gray-800 hover:bg-[#0B0F17]">
                      <TableCell className="text-gray-200">{user.name}</TableCell>
                      <TableCell className="text-gray-200">{user.email}</TableCell>
                      <TableCell>
                        {getAccessLevelBadge(user.access_level, user.is_owner)}
                      </TableCell>
                      <TableCell className="text-right">
                        {!user.is_owner && (
                          <div className="flex justify-end gap-2">
                            <Select 
                              value={user.access_level}
                              onValueChange={(value: string) => handleUpdateAccess(user.email, value as AccessLevel)}
                              disabled={user.is_owner || isUpdatingAccess[user.email]}
                            >
                              <SelectTrigger className="h-8 w-28 bg-[#0B0F17] border-gray-800 text-white">
                                {isUpdatingAccess[user.email] ? (
                                  <div className="flex items-center">
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                    <span>Updating</span>
                                  </div>
                                ) : (
                                  <SelectValue placeholder="Change" />
                                )}
                              </SelectTrigger>
                              <SelectContent className="bg-[#151923] border-gray-800 text-white">
                                <SelectItem value="admin">
                                  <div className="flex items-center">
                                    <Shield className="h-3 w-3 mr-2 text-red-500" />
                                    <span>Admin</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="user">
                                  <div className="flex items-center">
                                    <UserPlus className="h-3 w-3 mr-2 text-blue-500" />
                                    <span>User</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="read">
                                  <div className="flex items-center">
                                    <Lock className="h-3 w-3 mr-2 text-green-500" />
                                    <span>Read</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-500 hover:text-red-300 hover:bg-red-950"
                              onClick={() => openRevokeConfirm(user.email)}
                              disabled={isRevokingAccess[user.email]}
                            >
                              {isRevokingAccess[user.email] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label className="text-gray-200">IP Allowlist</Label>
              <p className="text-sm text-gray-400">
                Restrict access to specific IP addresses
              </p>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">Allowed IP Addresses</Label>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[#0B0F17] text-gray-300 flex items-center gap-1 px-3 py-1">
                192.168.1.1
                <button className="ml-1 text-gray-400 hover:text-white">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
              <Badge className="bg-[#0B0F17] text-gray-300 flex items-center gap-1 px-3 py-1">
                10.0.0.1/24
                <button className="ml-1 text-gray-400 hover:text-white">
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
              <div className="flex">
                <Input
                  placeholder="Add IP address"
                  className="bg-[#0B0F17] border-gray-800 h-8 text-sm text-white"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 h-8 border-gray-800 text-gray-800 hover:text-black"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Password Policy</Label>
              <p className="text-sm text-gray-400">
                Enforce strong database passwords
              </p>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Audit Logging</Label>
              <p className="text-sm text-gray-400">
                Log all database access and changes
              </p>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
          </div>
        </CardContent>
      </Card>

      {/* Revoke Access Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="bg-[#0B0F17] text-white border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Access</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to revoke access for <span className="text-white font-medium">{userToRevoke}</span>? 
              This user will no longer be able to access this database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {revokeError && (
            <div className="mt-2 p-3 bg-red-900/30 border border-red-900 rounded-md">
              <div className="flex items-center text-red-400">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Error: {revokeError}</span>
              </div>
            </div>
          )}
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel 
              className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              disabled={isRevokingAccess[userToRevoke]}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={(e) => {
                e.preventDefault();
                handleRevokeAccess();
              }}
              disabled={isRevokingAccess[userToRevoke]}
            >
              {isRevokingAccess[userToRevoke] ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Revoke Access
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Encryption</CardTitle>
          <CardDescription className="text-gray-400">
            Configure database encryption settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Data-at-Rest Encryption</Label>
              <p className="text-sm text-gray-400">
                Encrypt stored database files
              </p>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Data-in-Transit Encryption</Label>
              <p className="text-sm text-gray-400">
                Encrypt all network traffic
              </p>
            </div>
            <Switch defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">Encryption Key Rotation</Label>
            <Select defaultValue="90days">
              <SelectTrigger className="bg-[#0B0F17] border-gray-800 w-full md:w-1/3 text-white">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent className="bg-[#151923] border-gray-800 text-white">
                <SelectItem value="30days">Every 30 days</SelectItem>
                <SelectItem value="90days">Every 90 days</SelectItem>
                <SelectItem value="180days">Every 180 days</SelectItem>
                <SelectItem value="manual">Manual rotation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
