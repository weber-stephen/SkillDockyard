import { describe, expect, it } from "vitest";
import { getSupabaseErrorStatus, isMissingSupabaseSchemaError, SchemaUnavailableError } from "@/lib/supabase/errors";

describe("Supabase schema errors", () => {
  it("recognizes PostgREST missing table and column errors", () => {
    expect(isMissingSupabaseSchemaError({ code: "PGRST205", message: "Could not find the table" })).toBe(true);
    expect(isMissingSupabaseSchemaError({ code: "PGRST204", message: "Column was not found" })).toBe(true);
    expect(isMissingSupabaseSchemaError({ code: "23505", message: "duplicate key" })).toBe(false);
  });

  it("maps schema failures to a service-unavailable response", () => {
    expect(getSupabaseErrorStatus({ code: "PGRST205" })).toBe(503);
    expect(getSupabaseErrorStatus(new SchemaUnavailableError())).toBe(503);
    expect(getSupabaseErrorStatus(new Error("bad request"))).toBe(400);
  });

  it("maps expected unauthenticated API access to unauthorized", () => {
    expect(getSupabaseErrorStatus({ name: "AuthenticationRequiredError" }, 500)).toBe(401);
  });
});
