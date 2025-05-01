import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { ConnectionAttributesDialog } from "../shared/ConnectionAttributesDialog";
import { DatabaseEntry, ConnectionConfigType } from "../../../types/database-types";

interface PgPoolConnectionProps {
  selectedDatabase: DatabaseEntry;
  connectionConfig?: ConnectionConfigType;
  isLoading: boolean;
  copyToClipboard: (text: string) => void;
}

export function PgPoolConnection({
  selectedDatabase,
  connectionConfig,
  isLoading,
  copyToClipboard,
}: PgPoolConnectionProps) {
  const connectionString = `postgresql://${
    selectedDatabase.db_user || "postgres"
  }:${selectedDatabase.db_password || "password"}@${
    connectionConfig?.hostname ||
    `${selectedDatabase.db_name}-pgpool.shadowdb.com`
  }:${
    isLoading
      ? selectedDatabase.pgpool?.port || 9999
      : connectionConfig?.pgpool?.port || 9999
  }/${selectedDatabase.db_name}`;

  const connectionAttributes = {
    host: connectionConfig?.hostname || `${selectedDatabase.db_name}-pgpool.shadowdb.com`,
    port: `${isLoading ? selectedDatabase.pgpool?.port || 9999 : connectionConfig?.pgpool?.port || 9999}`,
    dbname: selectedDatabase.db_name,
    user: selectedDatabase.db_user || "postgres",
    password: selectedDatabase.db_password || "password",
    sslmode: "require",
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="pgpool_connection" className="text-gray-200">
        PgPool Connection (Load Balanced)
      </Label>
      <div className="flex">
        <Input
          id="pgpool_connection"
          value={connectionString}
          readOnly
          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
        />
        <Button
          variant="outline"
          size="icon"
          className="ml-2 border-gray-800 text-gray-800 hover:text-black"
          onClick={() => copyToClipboard(connectionString)}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <ConnectionAttributesDialog
          connectionType="PgPool Connection"
          connectionAttributes={connectionAttributes}
          copyToClipboard={copyToClipboard}
        />
      </div>
    </div>
  );
}
