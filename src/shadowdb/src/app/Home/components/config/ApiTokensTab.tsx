import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Key, Copy, Trash2, AlertCircle, Lock } from "lucide-react";
import { TokenType } from "../types/DatabaseTypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ApiTokensTabProps {
  apiTokens: TokenType[];
  newToken: TokenType | null;
  setNewToken: (token: TokenType | null) => void;
  tokenExpiryDays: number;
  setTokenExpiryDays: (days: number) => void;
  isLoadingTokens: boolean;
  generateTokenMutation: any;
  deleteTokenMutation: any;
  copyToClipboard: (text: string) => void;
  generateNewToken: () => void;
  deleteToken: (id: number) => void;
}

export function ApiTokensTab({
  apiTokens,
  newToken,
  setNewToken,
  tokenExpiryDays,
  setTokenExpiryDays,
  isLoadingTokens,
  generateTokenMutation,
  deleteTokenMutation,
  copyToClipboard,
  generateNewToken,
  deleteToken,
}: ApiTokensTabProps) {
  return (
    <div className="space-y-4">
      <Card className="bg-[#151923] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">API Tokens</CardTitle>
          <CardDescription className="text-gray-400">
            Manage API tokens for programmatic access to your database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {newToken && (
            <div className="bg-purple-900/30 border border-purple-500 rounded-md p-4 mb-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-purple-400 mt-0.5 mr-3 flex-shrink-0" />
                <div className="space-y-2">
                  <p className="font-medium text-purple-300">
                    New API token created
                  </p>
                  <p className="text-sm text-purple-300">
                    Make sure to copy your token now. You won't be able to
                    see it again!
                  </p>
                  <div className="flex mt-2">
                    <code className="bg-[#0B0F17] p-2 rounded text-purple-300 font-mono text-sm flex-1 overflow-x-auto">
                      {newToken.token}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="ml-2 border-purple-500 text-purple-300 hover:text-purple-100 hover:bg-purple-800"
                      onClick={() => copyToClipboard(newToken.token)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-purple-300">
                      Expires:{" "}
                      {new Date(newToken.expires_at).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 border-purple-500 text-purple-300 hover:bg-purple-800"
                    onClick={() => setNewToken(null)}
                  >
                    I've copied my token
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Your API Tokens</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Key className="h-4 w-4 mr-2" />
                  Generate New Token
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#151923] border-gray-800">
                <DialogHeader>
                  <DialogTitle className="text-white">Create API Token</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Create a new API token to access your database
                    programmatically.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="token-expiry" className="text-gray-200">
                      Token Expiration (days)
                    </Label>
                    <Input
                      id="token-expiry"
                      type="number"
                      min={1}
                      max={365}
                      value={tokenExpiryDays}
                      onChange={(e) =>
                        setTokenExpiryDays(
                          parseInt(e.target.value) || 30
                        )
                      }
                      className="bg-[#0B0F17] border-gray-800 text-white"
                    />
                    <p className="text-xs text-gray-400">
                      Token will expire after this many days
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={generateNewToken}
                    disabled={generateTokenMutation.isPending}
                  >
                    {generateTokenMutation.isPending ? (
                      <>
                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                        Generating...
                      </>
                    ) : (
                      "Generate Token"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border border-gray-800">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="bg-[#0B0F17]">
                  <tr className="border-b border-gray-800">
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Token ID
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Created
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Expires
                    </th>
                    <th className="h-10 px-4 text-left font-medium text-gray-400">
                      Last Used
                    </th>
                    <th className="h-10 px-4 text-right font-medium text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-300">
                  {isLoadingTokens ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-300">
                        <div className="flex justify-center items-center space-x-2">
                          <div className="h-4 w-4 rounded-full border-2 border-purple-600 border-t-transparent animate-spin"></div>
                          <span>Loading tokens...</span>
                        </div>
                      </td>
                    </tr>
                  ) : apiTokens.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-4 text-center text-gray-400"
                      >
                        No tokens found. Generate a new token to get
                        started.
                      </td>
                    </tr>
                  ) : (
                    apiTokens.map((token) => (
                      <tr
                        key={token.id}
                        className="border-b border-gray-800"
                      >
                        <td className="p-4 align-middle font-medium text-gray-300">
                          {`...${token.token.slice(-8)}`}
                        </td>
                        <td className="p-4 align-middle text-gray-400">
                          {new Date(token.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 align-middle text-gray-400">
                          {new Date(token.expires_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 align-middle text-gray-400">
                          {token.last_used_at
                            ? new Date(
                                token.last_used_at
                              ).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="p-4 align-middle text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-white"
                                  onClick={() => deleteToken(token.id)}
                                  disabled={deleteTokenMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="text-white bg-gray-800 border-gray-700">
                                <p>Delete token</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#0B0F17] rounded-md p-4 border border-gray-800">
            <h4 className="font-medium flex items-center text-white">
              <Lock className="h-4 w-4 mr-2 text-purple-500" />
              API Token Security
            </h4>
            <p className="text-sm text-gray-400 mt-2">
              API tokens provide full access to your database. Keep them
              secure and rotate them regularly. Tokens are transmitted
              securely and stored using one-way encryption.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
