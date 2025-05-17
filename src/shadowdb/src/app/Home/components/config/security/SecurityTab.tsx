import React from "react";
import { AccessControlCard } from "./components/AccessControlCard";
import { EncryptionCard } from "./components/EncryptionCard";
import type { DatabaseEntry } from "@/app/Home/types/database-types";

interface SecurityTabProps {
  selectedDatabase: DatabaseEntry;
}

export function SecurityTab({ selectedDatabase }: SecurityTabProps) {
  return (
    <div className="space-y-4">
      {/* Access Control Card */}
      <AccessControlCard selectedDatabase={selectedDatabase} />

    
      {/* <EncryptionCard /> */}
    </div>
  );
}
