import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { FeaturePreview } from "@/components/ComingSoonToopTipWrapper";

export function IPAllowlistSection() {
  return (
    <>
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-0.5">
          <Label className="text-gray-200">IP Allowlist</Label>
          <p className="text-sm text-gray-400">
            Restrict access to specific IP addresses
          </p>
        </div>
        <FeaturePreview>
          <Switch checked={false} disabled={true} className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"/>
        </FeaturePreview>
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
              className="ml-2 h-8 border-gray-800 text-gray-800 hover:text-black"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
