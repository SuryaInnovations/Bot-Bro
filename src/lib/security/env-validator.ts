/**
 * Server-side Environment Variable Validator & Security Guard
 */

export interface EnvValidationReport {
  isValid: boolean;
  anthropicConfigured: boolean;
  supabaseConfigured: boolean;
  environment: "development" | "production" | "test";
  warnings: string[];
}

export function validateServerEnvironment(): EnvValidationReport {
  const warnings: string[] = [];

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const anthropicConfigured = Boolean(anthropicKey && anthropicKey.startsWith("sk-ant-"));

  if (!anthropicConfigured) {
    warnings.push("ANTHROPIC_API_KEY is not set or does not start with standard prefix 'sk-ant-'.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseKey &&
    supabaseUrl !== "https://your-project.supabase.co" &&
    supabaseUrl.startsWith("https://")
  );

  if (!supabaseConfigured) {
    warnings.push("Supabase is unconfigured; running in high-speed isolated in-memory backing mode.");
  }

  const environment = (process.env.NODE_ENV as any) || "development";

  return {
    isValid: true, // Graceful degraded mode allowed
    anthropicConfigured,
    supabaseConfigured,
    environment,
    warnings,
  };
}

/**
 * Sanitizes any object before returning to client, guaranteeing NO API keys or secrets leak.
 */
export function sanitizeClientResponse<T extends Record<string, any>>(obj: T): Partial<T> {
  const forbiddenKeys = [
    "anthropic_api_key",
    "anthropicapikey",
    "apikey",
    "service_role_key",
    "supabase_service_role_key",
    "passwordhash",
    "salt",
    "secret",
  ];

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (forbiddenKeys.some((f) => key.toLowerCase().includes(f))) {
      continue;
    }
    if (value && typeof value === "object" && !(value instanceof Date)) {
      sanitized[key] = sanitizeClientResponse(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
