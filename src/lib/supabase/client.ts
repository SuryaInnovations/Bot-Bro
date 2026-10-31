import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  missingUrl: boolean;
  missingKey: boolean;
  isPlaceholder: boolean;
  errorMessage?: string;
}

export function normalizeSupabaseUrl(rawUrl?: string): string {
  if (!rawUrl) return "";
  let url = rawUrl.trim();
  // Strip trailing /rest/v1 or /rest/v1/ or trailing slashes
  url = url.replace(/\/rest\/v1\/?$/, "");
  url = url.replace(/\/+$/, "");
  return url;
}

/**
 * Diagnostic helper that precisely identifies which Supabase configuration elements are missing.
 */
export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const url = normalizeSupabaseUrl(rawUrl);
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const missingUrl = !url || url.trim() === "";
  const missingKey = !key || key.trim() === "";
  const isPlaceholder =
    url === "https://your-project.supabase.co" || key === "your_supabase_anon_key";

  if (missingUrl && missingKey) {
    return {
      isConfigured: false,
      missingUrl: true,
      missingKey: true,
      isPlaceholder: false,
      errorMessage:
        "Supabase credentials missing: Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.",
    };
  }

  if (missingUrl) {
    return {
      isConfigured: false,
      missingUrl: true,
      missingKey: false,
      isPlaceholder: false,
      errorMessage:
        "Missing Supabase URL: NEXT_PUBLIC_SUPABASE_URL is not configured in .env.local.",
    };
  }

  if (missingKey) {
    return {
      isConfigured: false,
      missingUrl: false,
      missingKey: true,
      isPlaceholder: false,
      errorMessage:
        "Missing Supabase Key: NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured in .env.local.",
    };
  }

  if (isPlaceholder) {
    return {
      isConfigured: false,
      missingUrl: false,
      missingKey: false,
      isPlaceholder: true,
      errorMessage:
        "Placeholder Supabase credentials: Replace placeholder URL/Key in .env.local with your real project keys from Supabase Dashboard.",
    };
  }

  if (!url.startsWith("https://")) {
    return {
      isConfigured: false,
      missingUrl: false,
      missingKey: false,
      isPlaceholder: false,
      errorMessage:
        "Invalid Supabase URL: NEXT_PUBLIC_SUPABASE_URL must be a secure HTTPS endpoint (e.g., https://xyz.supabase.co).",
    };
  }

  return {
    isConfigured: true,
    missingUrl: false,
    missingKey: false,
    isPlaceholder: false,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().isConfigured;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  const status = getSupabaseConfigStatus();
  if (!status.isConfigured) return null;

  if (!browserClient) {
    try {
      const cleanUrl = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
      const cleanKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim();
      browserClient = createBrowserClient(cleanUrl, cleanKey, {
        isSingleton: true,
      });
    } catch (err: any) {
      console.error("[Supabase Browser Client Init Error]:", err);
      return null;
    }
  }
  return browserClient;
}
