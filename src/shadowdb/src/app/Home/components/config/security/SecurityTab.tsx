import React from "react";
import { AccessControlCard } from "./components/AccessControlCard";
import { EncryptionCard } from "./components/EncryptionCard";
import type { DatabaseEntry } from "@/app/Home/types/database-types";

interface SecurityTabProps {
  selectedDatabase: DatabaseEntry;
}

export function SecurityTab({ selectedDatabase }: SecurityTabProps) {
  return (
    <div className="space-y-3 sm:space-y-4 w-full overflow-hidden">
      {/* Access Control Card */}
      <div className="w-full">
        <AccessControlCard selectedDatabase={selectedDatabase} />
      </div>
    
      {/* <EncryptionCard /> */}
    </div>
  );
}
