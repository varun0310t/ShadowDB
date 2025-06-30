import { z } from "zod";

// Zod validation schemas
export const dbNameSchema = z
  .string()
  .min(1, "Database name is required")
  .max(63, "Database name must be less than 64 characters")
  .regex(
    /^[a-z][a-z0-9_]*$/,
    "Database name must start with a lowercase letter and contain only lowercase letters, numbers, and underscores"
  )
  .refine(
    (name) => !name.startsWith("pg_"), 
    "Database names cannot start with 'pg_' (reserved for system databases)"
  )
  .refine(
    (name) => !["template0", "template1", "postgres"].includes(name),
    "Cannot use reserved database names"
  );

export const tenancyTypeSchema = z.enum(["shared", "isolated"], {
  errorMap: () => ({ message: "Tenancy type must be either 'shared' or 'isolated'" })
});

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/,
    "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character"
  )
  .optional();

export const databaseRequestSchema = z.object({
  db_name: dbNameSchema,
  tenancy_type: tenancyTypeSchema,
  password: passwordSchema,
  haproxy_enabled: z.boolean().optional().default(false),
  pgpool_enabled: z.boolean().optional().default(false),
});

// Type inference for TypeScript
export type DatabaseRequestSchema = z.infer<typeof databaseRequestSchema>;
export type DbNameSchema = z.infer<typeof dbNameSchema>;
export type TenancyTypeSchema = z.infer<typeof tenancyTypeSchema>;