type SupabaseErrorShape = {
  code?: unknown;
  message?: unknown;
};

export class SchemaUnavailableError extends Error {
  readonly code = "SCHEMA_UNAVAILABLE";

  constructor(message = "This feature is not available until the latest database migrations are applied.") {
    super(message);
    this.name = "SchemaUnavailableError";
  }
}

export function isMissingSupabaseSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as SupabaseErrorShape;
  if (candidate.code === "PGRST204" || candidate.code === "PGRST205") return true;

  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
  return message.includes("schema cache") || message.includes("does not exist") || message.includes("could not find the table");
}

export function getSupabaseErrorStatus(error: unknown, fallback = 400) {
  if (error && typeof error === "object" && "name" in error && (error as { name?: unknown }).name === "AuthenticationRequiredError") return 401;
  return error instanceof SchemaUnavailableError || isMissingSupabaseSchemaError(error) ? 503 : fallback;
}

export function schemaUnavailableMessage(feature: string) {
  return `${feature} is temporarily unavailable because the database schema is not up to date. Apply all files in supabase/migrations in filename order, then retry.`;
}
