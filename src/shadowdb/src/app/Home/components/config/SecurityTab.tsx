import React from "react";
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
import { Trash2, Plus, Lock } from "lucide-react";

export function SecurityTab() {
  return (
    <div className="space-y-4">
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Access Control</CardTitle>
          <CardDescription className="text-gray-400">
            Configure who can access your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">IP Allowlist</Label>
              <p className="text-sm text-gray-400">
                Restrict access to specific IP addresses
              </p>
            </div>
            <Switch defaultChecked />
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
                  className="ml-2 h-8 border-gray-800 text-gray-300"
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
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Audit Logging</Label>
              <p className="text-sm text-gray-400">
                Log all database access and changes
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

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
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Data-in-Transit Encryption</Label>
              <p className="text-sm text-gray-400">
                Encrypt all network traffic
              </p>
            </div>
            <Switch defaultChecked />
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
