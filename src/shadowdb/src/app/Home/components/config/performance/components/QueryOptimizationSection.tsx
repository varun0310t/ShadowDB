import React from "react";
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
import { FeaturePreview } from "@/components/ComingSoonToopTipWrapper";

export function QueryOptimizationSection() {
  return (
    <Card className="bg-[#151923] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">Query Optimization</CardTitle>
        <CardDescription className="text-gray-400">
          Configure query performance settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-gray-200">Query Cache</Label>
            <p className="text-sm text-gray-400">
              Cache frequently executed queries
            </p>
          </div>
          <FeaturePreview message="caching is by default enabled and can't be disabled curently">
            <Switch
              disabled={true}
              checked={true}
              className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
            />
          </FeaturePreview>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-gray-200">Auto Vacuum</Label>
            <p className="text-sm text-gray-400">
              Automatically clean up and optimize storage
            </p>
          </div>
          <FeaturePreview>
            <Switch
              disabled={true}
              checked={false}
              className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
            />
          </FeaturePreview>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-200">Query Timeout (seconds)</Label>
          <FeaturePreview>
            <Input
              type="number"
              defaultValue="30"
              min="1"
              max="3600"
              disabled={true}
              className="bg-[#0B0F17] border-gray-800 w-full md:w-1/3 text-white"
            />
          </FeaturePreview>
        </div>
      </CardContent>
    </Card>
  );
}
