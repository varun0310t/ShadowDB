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
import { RefreshCw } from "lucide-react";

export function BackupTab() {
  return (
    <div className="space-y-4">
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Backup Configuration</CardTitle>
          <CardDescription className="text-gray-400">
            Configure automated backup settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-gray-200">Automated Backups</Label>
              <p className="text-sm text-gray-400">
                Schedule regular database backups
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">Backup Frequency</Label>
            <Select defaultValue="daily">
              <SelectTrigger className="bg-[#0B0F17] border-gray-800 w-full md:w-1/3 text-white">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent className="bg-[#151923] border-gray-800 text-white">
                <SelectItem value="hourly">Hourly</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-200">Retention Period (days)</Label>
            <Input
              type="number"
              defaultValue="7"
              min="1"
              max="365"
              className="bg-[#0B0F17] border-gray-800 w-full md:w-1/3 text-white"
            />
          </div>

          <div className="pt-4">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <RefreshCw className="h-4 w-4 mr-2" />
              Create Manual Backup
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Backups</CardTitle>
          <CardDescription className="text-gray-400">
            View and restore from recent backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-gray-800">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="bg-[#0B0F17]">
                  <tr className="border-b border-gray-800">
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Backup ID
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Date
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Size
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Type
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  <tr className="border-b border-gray-800">
                    <td className="p-4 align-middle">bak_12345</td>
                    <td className="p-4 align-middle">
                      2023-12-15 04:00 UTC
                    </td>
                    <td className="p-4 align-middle">2.3 GB</td>
                    <td className="p-4 align-middle">
                      <Badge className="bg-green-600">Automated</Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-800 text-gray-300"
                      >
                        Restore
                      </Button>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-800">
                    <td className="p-4 align-middle">bak_12344</td>
                    <td className="p-4 align-middle">
                      2023-12-14 04:00 UTC
                    </td>
                    <td className="p-4 align-middle">2.2 GB</td>
                    <td className="p-4 align-middle">
                      <Badge className="bg-green-600">Automated</Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-800 text-gray-300"
                      >
                        Restore
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 align-middle">bak_12340</td>
                    <td className="p-4 align-middle">
                      2023-12-13 15:30 UTC
                    </td>
                    <td className="p-4 align-middle">2.2 GB</td>
                    <td className="p-4 align-middle">
                      <Badge className="bg-blue-600">Manual</Badge>
                    </td>
                    <td className="p-4 align-middle">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-800 text-gray-300"
                      >
                        Restore
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
