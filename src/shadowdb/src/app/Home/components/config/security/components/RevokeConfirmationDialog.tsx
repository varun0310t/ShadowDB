import React from "react";
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
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

interface RevokeConfirmationDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  userEmail: string;
  error?: string;
  isRevoking: boolean;
  onConfirm: () => void;
}

export function RevokeConfirmationDialog({
  isOpen,
  setIsOpen,
  userEmail,
  error,
  isRevoking,
  onConfirm
}: RevokeConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogContent className="bg-[#0B0F17] text-white border-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke Access</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            Are you sure you want to revoke access for <span className="text-white font-medium">{userEmail}</span>? 
            This user will no longer be able to access this database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="mt-2 p-3 bg-red-900/30 border border-red-900 rounded-md">
            <div className="flex items-center text-red-400">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Error: {error}</span>
            </div>
          </div>
        )}
        <AlertDialogFooter className="mt-4">
          <AlertDialogCancel 
            className="bg-transparent border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            disabled={isRevoking}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isRevoking}
          >
            {isRevoking ? (
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
  );
}
