"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Database, Shield, Cloud } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { CreateDatabse } from "@/client/lib/services/DatabasesService";
import { toast, ToastContainer } from "react-toastify";
// Import the Switch component at the top of your file
import { Switch } from "@/components/ui/switch";
import { FeaturePreview } from "@/components/ComingSoonToopTipWrapper";
import "react-toastify/dist/ReactToastify.css";
import { registry } from "../../../lib/Prom-client";

// Define the schema using zod
const schema = z.object({
  dbName: z
    .string()
    .min(1, "Database name is required")
    .regex(/^[a-zA-Z0-9_]+$/, "Invalid database name"),
  dbType: z.enum(["shared", "isolated"]).default("isolated"),
  haproxy_enabled: z.boolean().default(false),
  pgpool_enabled: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

function CreateDatabaseContent() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbType, setDbType] = useState("isolated");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createDatabase = useMutation({
    mutationFn: ({
      dbName,
      dbType,
      haproxy_enabled,
      pgpool_enabled,
    }: {
      dbName: string;
      dbType: string;
      haproxy_enabled: boolean;
      pgpool_enabled: boolean;
    }) =>
      CreateDatabse({
        db_name: dbName,
        tenancy_type: dbType,
        haproxy_enabled,
        pgpool_enabled,
      }),
    onSuccess: () => {
      setIsSubmitting(false);
      setError(null);
      reset(); // Reset form
      toast.success("Database created successfully!");
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "An error occurred";
      setIsSubmitting(false);
      toast.error(
        errorMessage || "An error occurred while creating the database."
      );
      setError(
        errorMessage || "An error occurred while creating the database."
      );
    },
  });

  const onSubmit = (data: FormData) => {
    setIsSubmitting(true);
    createDatabase.mutate(data);
  };  
  
  return (
    <div className="flex flex-col flex-grow justify-center items-center w-full overflow-y-auto py-4">
      <ToastContainer />
      <Card className="w-full max-w-md bg-[#151923] border-gray-800 my-auto">
        <CardContent className="pt-6">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-purple-600/20 flex items-center justify-center">
                <Database className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">
              Create a New Database
            </h2>
            <p className="text-gray-400 mt-2">
              Configure your ShadowDB instance
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dbName" className="text-gray-300">
                Database Name
              </Label>
              <Input
                id="dbName"
                {...register("dbName")}
                placeholder="Enter a unique database name"
                className="bg-[#0B0F17] border-gray-800 focus:ring-purple-500 focus:border-purple-500 text-zinc-200"
                required
              />
              {errors.dbName && (
                <p className="text-sm text-red-500">{errors.dbName.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Name must be unique and contain only letters, numbers, and
                underscores
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-gray-300">Database Type</Label>
              <RadioGroup
                value={dbType}
                onValueChange={(value: "isolated" | "shared") => {
                  setDbType(value);
                  setValue("dbType", value);
                }}
                className="space-y-3"
              >
                <div className="flex items-start space-x-3">
                  <div className="flex items-center h-5 mt-1">
                    <FeaturePreview message="shared database is currently turned off">
                      <RadioGroupItem
                        value="shared"
                        id="shared"
                        className="border-gray-600 text-purple-600"
                        disabled={true}
                      />
                    </FeaturePreview>
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="shared"
                      className="flex items-center font-medium text-white cursor-pointer"
                    >
                      <Cloud className="h-4 w-4 mr-2 text-purple-500" />
                      Shared
                    </label>
                    <p className="text-sm text-gray-400 mt-1">
                      Multi-tenant environment with cost-effective pricing.
                      Ideal for development and small applications.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="flex items-center h-5 mt-1">
                    <RadioGroupItem
                      value="isolated"
                      id="isolated"
                      className="border-gray-600 text-purple-600"
                    />
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="isolated"
                      className="flex items-center font-medium text-white cursor-pointer"
                    >
                      <Shield className="h-4 w-4 mr-2 text-purple-500" />
                      Isolated
                    </label>
                    <p className="text-sm text-gray-400 mt-1">
                      Dedicated resources with enhanced security and
                      performance. Recommended for production workloads.
                    </p>
                  </div>
                </div>
              </RadioGroup>
              {/* Only show advanced options for isolated database type */}
              {dbType === "isolated" && (
                <div className="space-y-4 border border-gray-800 rounded-md p-4 bg-[#0F131C]">
                  <h3 className="text-gray-200 font-medium">
                    Advanced Configuration
                  </h3>
                  {/* HAProxy Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="haproxy_enabled"
                        className="text-gray-300 cursor-pointer"
                      >
                        Enable HAProxy
                      </Label>
                      <p className="text-xs text-gray-500 mt-1">
                        Load balancing and high availability for your database
                      </p>
                    </div>
                    <Switch
                      id="haproxy_enabled"
                      {...register("haproxy_enabled")}
                      checked={watch("haproxy_enabled")}
                      onCheckedChange={(checked) => {
                        setValue("haproxy_enabled", checked);
                        if (!checked) {
                          setValue("pgpool_enabled", false);
                        }
                      }}
                      className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800"
                    />
                  </div>
                  {/* PGPool Toggle - Only enabled if HAProxy is enabled */}
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="pgpool_enabled"
                        className={`text-gray-300 ${
                          !watch("haproxy_enabled") ? "opacity-50" : ""
                        }`}
                      >
                        Enable PGPool
                      </Label>
                      <p
                        className={`text-xs text-gray-500 mt-1 ${
                          !watch("haproxy_enabled") ? "opacity-50" : ""
                        }`}
                      >
                        Connection pooling and query caching for better
                        performance
                      </p>
                    </div>
                    <Switch
                      id="pgpool_enabled"
                      {...register("pgpool_enabled")}
                      checked={watch("pgpool_enabled")}
                      disabled={!watch("haproxy_enabled")}
                      onCheckedChange={(checked) =>
                        setValue("pgpool_enabled", checked)
                      }
                      className="data-[state=checked]:bg-purple-800 data-[state=unchecked]:bg-slate-800 data-[disabled]:opacity-50"
                    />
                  </div>
                  {!watch("haproxy_enabled") && watch("pgpool_enabled") && (
                    <p className="text-xs text-amber-500">
                      PGPool requires HAProxy to be enabled
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2 italic">
                    These features are only available for isolated databases
                  </p>
                </div>
              )}
            
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Creating...
                </>
              ) : (
                "Create Database"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default CreateDatabaseContent;
