import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { ConnectionAttributesDialog } from "../shared/ConnectionAttributesDialog";
import { DatabaseEntry, ConnectionConfigType } from "../../../types/database-types";

interface HAProxyWriteConnectionProps {
  selectedDatabase: DatabaseEntry;
  connectionConfig?: ConnectionConfigType;
  copyToClipboard: (text: string) => void;
}

export function HAProxyWriteConnection({
  selectedDatabase,
  connectionConfig,
  copyToClipboard,
}: HAProxyWriteConnectionProps) {
  const connectionString = `postgresql://${
    selectedDatabase.db_user || "postgres"
  }:${selectedDatabase.db_password || "password"}@${
    connectionConfig?.hostname ||
    `${selectedDatabase.db_name}-pgpool.shadowdb.com`
  }:${connectionConfig?.haproxy?.write_port || 5000}/${
    selectedDatabase.db_name
  }`;

  const connectionAttributes = {
    host: `${selectedDatabase.db_name}-write.shadowdb.com`,
    port: `${connectionConfig?.haproxy?.write_port || 5000}`,
    dbname: selectedDatabase.db_name,
    user: selectedDatabase.db_user || "postgres",
    password: selectedDatabase.db_password || "password",
    sslmode: "require",
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="haproxy_write" className="text-gray-200">
        HAProxy Write Endpoint (Primary)
      </Label>
      <div className="flex">
        <Input
          id="haproxy_write"
          value={connectionString}
          readOnly
          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
        />
        <Button
          variant="outline"
          size="icon"
          className="ml-2 border-gray-800 text-gray-800"
          onClick={() => copyToClipboard(connectionString)}
        >
          <Copy className="h-4 w-4" />
        </Button>
        <ConnectionAttributesDialog
          connectionType="HAProxy Write Endpoint"
          connectionAttributes={connectionAttributes}
          copyToClipboard={copyToClipboard}
        />
      </div>
    </div>
  );
}
