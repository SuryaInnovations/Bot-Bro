import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeSupabaseUrl, getSupabaseConfigStatus } from "./client";

/**
 * Creates a server-side Supabase client using @supabase/ssr that automatically
 * reads and writes session & PKCE cookies via Next.js next/headers cookies().
 */
export function createServerSupabaseClient(): SupabaseClient | null {
  const status = getSupabaseConfigStatus();
  if (!status.isConfigured) return null;

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !rawKey) return null;

  const url = normalizeSupabaseUrl(rawUrl);
  const key = rawKey.trim();

  try {
    const cookieStore = cookies();
    return createServerClient(url, key, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // Ignored if middleware is refreshing user sessions.
          }
        },
      },
    });
  } catch (err: any) {
    console.error("[Supabase Server Client Init Error]:", err);
    return null;
  }
}

/**
 * Alias for createServerSupabaseClient for consistency.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  return createServerSupabaseClient();
}
