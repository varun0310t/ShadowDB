import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { ConnectionAttributesDialog } from "../shared/ConnectionAttributesDialog";
import { DatabaseEntry, ConnectionConfigType } from "../../../types/database-types";

interface NativePostgresConnectionsProps {
  selectedDatabase: DatabaseEntry;
  connectionConfig: ConnectionConfigType;
  copyToClipboard: (text: string) => void;
}

export function NativePostgresConnections({
  selectedDatabase,
  connectionConfig,
  copyToClipboard,
}: NativePostgresConnectionsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-white text-lg font-medium">
        Native PostgreSQL Connections
      </h3>

      {connectionConfig.all_db_pools?.map((pool: {id:number}, index: number) => (
        <PostgresConnectionItem
          key={`pgpool-${pool.id}`}
          pool={pool}
          index={index}
          selectedDatabase={selectedDatabase}
          connectionConfig={connectionConfig}
          copyToClipboard={copyToClipboard}
        />
      ))}
    </div>
  );
}

interface PostgresConnectionItemProps {
  pool: any;
  index: number;
  selectedDatabase: DatabaseEntry;
  connectionConfig: ConnectionConfigType;
  copyToClipboard: (text: string) => void;
}

function PostgresConnectionItem({
  pool,
  index,
  selectedDatabase,
  connectionConfig,
  copyToClipboard,
}: PostgresConnectionItemProps) {
  const connectionString = `postgresql://${
    connectionConfig?.role_user || "postgres"
  }:${selectedDatabase.db_password || "password"}@${
    connectionConfig.hostname ||
    `${pool.db_name}-pgpool.shadowdb.com`
  }:${pool.port || 9999}/${
    pool.db_name
  }`;

  const connectionAttributes = {
    host: connectionConfig.hostname || `${pool.db_name}-pgpool.shadowdb.com`,
    port: `${pool.port || 9999}`,
    dbname: pool.db_name,
    user: connectionConfig?.role_user|| "postgres",
    password: selectedDatabase.db_password || "password",
    sslmode: "require",
  };
  
  return (
    <div className="space-y-2">
      <Label
        htmlFor={`pgpool_connection_${index}`}
        className="text-gray-200"
      >
        {pool.db_name} PostgreSQL {index === 0 ? "(Primary)" : `(${index + 1})`}
      </Label>
      <div className="flex">
        <Input
          id={`pgpool_connection_${index}`}
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
          connectionType={`${pool.db_name} PostgreSQL Connection`}
          connectionAttributes={connectionAttributes}
          copyToClipboard={copyToClipboard}
        />
      </div>
    </div>
  );
}
