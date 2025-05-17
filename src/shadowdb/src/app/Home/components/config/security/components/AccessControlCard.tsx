import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Lock,
  UserPlus,
  Shield,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { FeaturePreview } from "@/components/ComingSoonToopTipWrapper";
import type { DatabaseEntry } from "@/app/Home/types/database-types";
import { AccessUser, AccessLevel, useAccessManagement } from "../hooks/useAccessManagement";
import { RevokeConfirmationDialog } from "./RevokeConfirmationDialog";
import { IPAllowlistSection } from "./IPAllowlistSection";
import { Badge } from "@/components/ui/badge";

interface AccessControlCardProps {
  selectedDatabase: DatabaseEntry;
}

export function AccessControlCard({ selectedDatabase }: AccessControlCardProps) {
  // Get access management functions from custom hook
  const {
    accessUsers,
    loading,
    isUpdatingAccess,
    isRevokingAccess,
    handleGrantAccess,
    handleUpdateAccess,
    handleRevokeAccess
  } = useAccessManagement(selectedDatabase);

  // Local state
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [newUserEmail, setNewUserEmail] = useState<string>("");
  const [newUserEmailError, setNewUserEmailError] = useState<string>("");
  const [newUserAccessLevel, setNewUserAccessLevel] = useState<AccessLevel>("read");
  const [isGrantingAccess, setIsGrantingAccess] = useState<boolean>(false);
  
  // State for confirm dialog
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [userToRevoke, setUserToRevoke] = useState<string>("");
  const [revokeError, setRevokeError] = useState<string>("");

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

  // Form submit handler
  const onGrantAccessSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!selectedDatabase?.db_name || !newUserEmail) return;
    
    if (!validateEmail(newUserEmail)) {
      return;
    }

    setIsGrantingAccess(true);

    try {
      const success = await handleGrantAccess(newUserEmail, newUserAccessLevel);
      if (success) {
        setNewUserEmail("");
        setIsDialogOpen(false);
      }
    } finally {
      setIsGrantingAccess(false);
    }
  };

  // Open revoke confirmation dialog
  const openRevokeConfirm = (email: string) => {
    setUserToRevoke(email);
    setRevokeError("");
    setConfirmDialogOpen(true);
  };

  // Handle revoking access with confirmation dialog
  const confirmRevokeAccess = async (): Promise<void> => {
    const result = await handleRevokeAccess(userToRevoke);
    if (result.success) {
      setConfirmDialogOpen(false);
    } else {
      setRevokeError(result.error || "Failed to revoke access");
    }
  };

  // Helper function to generate access level badge
  const getAccessLevelBadge = (accessLevel: string, isOwner = false): React.ReactElement => {
    if (isOwner) {
      return <Badge className="bg-purple-900 hover:bg-purple-800">Owner</Badge>;
    }

    switch (accessLevel) {
      case 'admin':
        return <Badge className="bg-red-900 hover:bg-red-800">Admin</Badge>;
      case 'user':
        return <Badge className="bg-blue-900 hover:bg-blue-800">User</Badge>;
      case 'read':
      case 'readonly':
        return <Badge className="bg-green-900 hover:bg-green-800">Read</Badge>;
      default:
        return <Badge>{accessLevel}</Badge>;
    }
  };

  return (
    <>
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
                    Add a user to database {selectedDatabase.db_name}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onGrantAccessSubmit}>
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
                                <SelectItem value="readonly">
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
            </div>          )}

          {/* IP Allowlist Section */}
          <IPAllowlistSection />
        </CardContent>
      </Card>

      {/* Revoke Access Confirmation Dialog */}
      <RevokeConfirmationDialog
        isOpen={confirmDialogOpen}
        setIsOpen={setConfirmDialogOpen}
        userEmail={userToRevoke}
        error={revokeError}
        isRevoking={isRevokingAccess[userToRevoke]}
        onConfirm={confirmRevokeAccess}
      />
    </>
  );
}
