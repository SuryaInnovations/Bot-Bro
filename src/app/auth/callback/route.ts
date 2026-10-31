import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { normalizeSupabaseUrl, getSupabaseConfigStatus } from "@/lib/supabase/client";
import { loginWithGoogleOAuth } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

/**
 * Server-side OAuth callback route handler using @supabase/ssr.
 * Reads the authorization code, retrieves the PKCE verifier from cookies,
 * exchanges the code for a Supabase session, sets cookies, synchronizes
 * with Bot Bro session, and redirects to the chatbot.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";
  const urlError = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description") || "";
  const descLower = errorDescription.toLowerCase();

  // 1. Handle user cancelation or error returned from Google / OAuth provider
  if (
    urlError === "access_denied" ||
    descLower.includes("access_denied") ||
    descLower.includes("cancel") ||
    descLower.includes("denied")
  ) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // 2. Handle specific OAuth provider configuration errors
  if (
    descLower.includes("not enabled") ||
    descLower.includes("unsupported") ||
    descLower.includes("disabled") ||
    urlError?.includes("unsupported_provider")
  ) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "Google provider is disabled in Supabase. Enable Google in Supabase Dashboard → Authentication → Providers → Google."
      )}`
    );
  }

  if (
    descLower.includes("client id") ||
    descLower.includes("client secret") ||
    descLower.includes("not configured")
  ) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        "Google OAuth credentials missing: Add Client ID and Secret in Supabase Dashboard → Authentication → Providers → Google."
      )}`
    );
  }

  if (descLower.includes("redirect") || descLower.includes("url not allowed")) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        `Redirect URL not allowed: Ensure ${origin}/auth/callback is added in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.`
      )}`
    );
  }

  if (urlError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        errorDescription ? `Google OAuth error: ${errorDescription}` : `Google OAuth error code: ${urlError}`
      )}`
    );
  }

  // 3. Verify code is present
  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Authorization code missing from OAuth redirect.")}`
    );
  }

  // 4. Verify Supabase configuration
  const configStatus = getSupabaseConfigStatus();
  if (!configStatus.isConfigured) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        configStatus.errorMessage || "Supabase configuration missing in .env.local."
      )}`
    );
  }

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !rawKey) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Supabase credentials missing in .env.local.")}`
    );
  }

  const cleanUrl = normalizeSupabaseUrl(rawUrl);
  const cleanKey = rawKey.trim();

  // Prepare redirect response to target URL (defaults to /)
  const targetUrl = next.startsWith("/") ? `${origin}${next}` : `${origin}/`;
  let response = NextResponse.redirect(targetUrl);

  // 5. Initialize Supabase SSR server client to exchange the PKCE code
  const supabase = createServerClient(cleanUrl, cleanKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.redirect(targetUrl);
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  try {
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("[OAuth Code Exchange Error]:", exchangeError);
      const msg = exchangeError.message.toLowerCase();
      if (msg.includes("pkce") || msg.includes("verifier")) {
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(
            "PKCE code verifier not found in storage. Please restart login in the same browser window."
          )}`
        );
      }
      if (msg.includes("expired") || msg.includes("invalid")) {
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(
            "OAuth code expired or already used. Please sign in with Google again."
          )}`
        );
      }
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(`OAuth code exchange failed: ${exchangeError.message}`)}`
      );
    }

    // 6. Synchronize authenticated user with Bot Bro internal session
    if (data?.session?.user) {
      const user = data.session.user;
      const email = user.email || "";
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "User";
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

      const authRes = await loginWithGoogleOAuth(email, fullName, avatarUrl);
      if (authRes.token) {
        response.cookies.set("nova_session_token", authRes.token, {
          path: "/",
          httpOnly: false,
          maxAge: 7 * 24 * 3600,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }
    }

    return response;
  } catch (err: any) {
    console.error("[OAuth Callback Exception]:", err);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(
        err?.message || "Failed to complete Google authentication. Please try again."
      )}`
    );
  }
}
