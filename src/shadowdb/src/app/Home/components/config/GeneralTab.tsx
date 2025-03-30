import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Copy } from "lucide-react";
import { DatabaseEntry } from "../types/DatabaseTypes";

interface GeneralTabProps {
  selectedDatabase: DatabaseEntry;
  copyToClipboard: (text: string) => void;
}

export function GeneralTab({ selectedDatabase, copyToClipboard }: GeneralTabProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Database Information</CardTitle>
          <CardDescription className="text-gray-400">
            View and update basic information about your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="db_name" className="text-gray-200">Database Name</Label>
              <Input
                id="db_name"
                defaultValue={selectedDatabase.db_name}
                className="bg-[#0B0F17] border-gray-800 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region" className="text-gray-200">Region</Label>
              <Select defaultValue={selectedDatabase.region}>
                <SelectTrigger className="bg-[#0B0F17] border-gray-800 text-white">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent className="bg-[#151923] border-gray-800 text-white">
                  <SelectItem value="us-east-1">
                    US East (N. Virginia)
                  </SelectItem>
                  <SelectItem value="us-west-1">
                    US West (N. California)
                  </SelectItem>
                  <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                  <SelectItem value="ap-southeast-1">
                    Asia Pacific (Singapore)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="created" className="text-gray-200">Created At</Label>
              <Input
                id="created"
                value={selectedDatabase.created_at}
                disabled
                className="bg-[#0B0F17] border-gray-800 opacity-70 text-gray-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-gray-200">Status</Label>
              <Select defaultValue={selectedDatabase.status}>
                <SelectTrigger className="bg-[#0B0F17] border-gray-800 text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-[#151923] border-gray-800 text-white">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Connection Settings</CardTitle>
          <CardDescription className="text-gray-400">
            Configure how applications connect to your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="connection_string" className="text-gray-200">Connection String</Label>
            <div className="flex">
              <Input
                id="connection_string"
                value={`postgresql://user:password@${selectedDatabase.db_name}.shadowdb.com:5432/main`}
                readOnly
                className="bg-[#0B0F17] border-gray-800 font-mono text-sm text-gray-300"
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2 border-gray-800 text-gray-200"
                onClick={() =>
                  copyToClipboard(
                    `postgresql://user:password@${selectedDatabase.db_name}.shadowdb.com:5432/main`
                  )
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">SSL Enforcement</Label>
              <p className="text-sm text-gray-400">
                Require SSL/TLS for all connections
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Connection Pooling</Label>
              <p className="text-sm text-gray-400">
                Optimize connection management
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
