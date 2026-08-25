import { z } from "zod";

const PREFERRED_DATABASE_NAME = "weblio";

const databaseEnvSchema = z.object({
  MONGODB_URI: z
    .string()
    .min(1, "MONGODB_URI is required")
    .refine(
      (value) =>
        value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
      "MONGODB_URI must start with mongodb:// or mongodb+srv://"
    ),
});

const seedEnvSchema = databaseEnvSchema.extend({
  ADMIN_NAME: z.string().trim().min(1, "ADMIN_NAME is required"),
  ADMIN_EMAIL: z
    .string()
    .trim()
    .min(1, "ADMIN_EMAIL is required")
    .email("ADMIN_EMAIL must be a valid email address")
    .transform((value) => value.toLowerCase()),
  ADMIN_PASSWORD: z
    .string()
    .min(8, "ADMIN_PASSWORD must be at least 8 characters long"),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type SeedEnv = z.infer<typeof seedEnvSchema>;

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
}

function parseEnv<T>(
  schema: z.ZodSchema<T>,
  context: string,
  source: Record<string, string | undefined> = process.env
): T {
  const result = schema.safeParse(source);

  if (!result.success) {
    throw new Error(`${context}: ${formatZodError(result.error)}`);
  }

  return result.data;
}

export function getDatabaseEnv(): DatabaseEnv {
  return parseEnv(databaseEnvSchema, "Database environment validation failed");
}

export function getSeedEnv(): SeedEnv {
  return parseEnv(seedEnvSchema, "Seed environment validation failed");
}

export function assertDatabaseNameInUri(uri: string): string {
  let parsed: URL;

  try {
    parsed = new URL(uri);
  } catch {
    throw new Error(
      "MONGODB_URI is invalid. Include a database name in the connection string (preferred: weblio)."
    );
  }

  const databaseName = parsed.pathname.replace(/^\/+/, "").split("/")[0]?.trim();

  if (!databaseName) {
    throw new Error(
      `MONGODB_URI must include a database name in the path (preferred: ${PREFERRED_DATABASE_NAME}).`
    );
  }

  return databaseName;
}
