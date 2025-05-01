import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ConnectionAttributes {
  host: string;
  port: string;
  dbname: string;
  user: string;
  password: string;
  sslmode: string;
}

interface ConnectionAttributesDialogProps {
  connectionType: string;
  connectionAttributes: ConnectionAttributes;
  copyToClipboard: (text: string) => void;
}

export function ConnectionAttributesDialog({
  connectionType,
  connectionAttributes,
  copyToClipboard,
}: ConnectionAttributesDialogProps) {
  const { host, port, dbname, user, password, sslmode } = connectionAttributes;

  // Create full connection string for easy copy
  const fullConnectionString = Object.entries(connectionAttributes)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-2 border-gray-800 text-gray-800 text-xs h-8"
        >
          View Attributes
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#151923] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            {connectionType} Connection Attributes
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Copy individual attributes or the full connection string
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <AttributeField
            label="Host"
            value={host}
            attributeName="host"
            copyToClipboard={copyToClipboard}
          />
          
          <AttributeField
            label="Port"
            value={port}
            attributeName="port"
            copyToClipboard={copyToClipboard}
          />
          
          <AttributeField
            label="Database"
            value={dbname}
            attributeName="dbname"
            copyToClipboard={copyToClipboard}
          />
          
          <AttributeField
            label="User"
            value={user}
            attributeName="user"
            copyToClipboard={copyToClipboard}
          />
          
          <AttributeField
            label="Password"
            value={password}
            attributeName="password"
            copyToClipboard={copyToClipboard}
          />
          
          <AttributeField
            label="SSL Mode"
            value={sslmode}
            attributeName="sslmode"
            copyToClipboard={copyToClipboard}
          />
        </div>

        <div className="mt-6 space-y-2">
          <Label className="text-gray-200">Full Connection String</Label>
          <div className="flex">
            <Input
              value={fullConnectionString}
              readOnly
              className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
            />
            <Button
              variant="outline"
              size="icon"
              className="ml-2 border-gray-800 text-gray-800"
              onClick={() => copyToClipboard(fullConnectionString)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AttributeFieldProps {
  label: string;
  value: string;
  attributeName: string;
  copyToClipboard: (text: string) => void;
}

function AttributeField({ label, value, attributeName, copyToClipboard }: AttributeFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-gray-200">{label}</Label>
      <div className="flex">
        <Input
          value={value}
          readOnly
          className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
        />
        <Button
          variant="outline"
          size="icon"
          className="ml-2 border-gray-800 text-gray-800"
          onClick={() => copyToClipboard(`${attributeName}=${value}`)}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
