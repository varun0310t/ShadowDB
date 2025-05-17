import React from "react";
import { Switch } from "@/components/ui/switch";
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

export function EncryptionCard() {
  return (
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
          <Switch defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-gray-200">Data-in-Transit Encryption</Label>
            <p className="text-sm text-gray-400">
              Encrypt all network traffic
            </p>
          </div>
          <Switch defaultChecked className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
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
  );
}
