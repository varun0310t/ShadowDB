import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function PerformanceTab() {
  return (
    <div className="space-y-4">
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Resource Allocation</CardTitle>
          <CardDescription className="text-gray-400">
            Configure compute and memory resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-gray-200">CPU Allocation</Label>
              <span className="text-sm font-medium text-gray-200">2 vCPUs</span>
            </div>
            <Slider
              defaultValue={[2]}
              max={8}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-gray-400">
              Adjust the number of virtual CPUs allocated to your database
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-gray-200">Memory</Label>
              <span className="text-sm font-medium text-gray-200">4 GB</span>
            </div>
            <Slider
              defaultValue={[4]}
              max={32}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-gray-400">
              Adjust the amount of RAM allocated to your database
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-gray-200">Storage</Label>
              <span className="text-sm font-medium text-gray-200">100 GB</span>
            </div>
            <Slider
              defaultValue={[100]}
              max={1000}
              step={10}
              className="w-full"
            />
            <p className="text-xs text-gray-400">
              Adjust the storage capacity for your database
            </p>
          </div>
        </CardContent>
      </Card>

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
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Auto Vacuum</Label>
              <p className="text-sm text-gray-400">
                Automatically clean up and optimize storage
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">Query Timeout (seconds)</Label>
            <Input
              type="number"
              defaultValue="30"
              min="1"
              max="3600"
              className="bg-[#0B0F17] border-gray-800 w-full md:w-1/3 text-white"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
