import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { normalizeSupabaseUrl, getSupabaseConfigStatus } from "@/lib/supabase/client";

/**
 * Next.js Middleware for Supabase SSR session refreshing and cookie propagation.
 * - Refreshes Auth tokens seamlessly without creating refresh loops.
 * - Passes through all /api routes and static assets without interference.
 * - Preserves authentication cookies across client and server.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Pass through static assets, public files, and API endpoints
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth/callback") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Check Supabase configuration
  const configStatus = getSupabaseConfigStatus();
  if (!configStatus.isConfigured) {
    return NextResponse.next();
  }

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!rawUrl || !rawKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = normalizeSupabaseUrl(rawUrl);
  const key = rawKey.trim();

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });

    // Refresh the user session if needed
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check custom Bot Bro session cookie as well
    const hasNovaToken = Boolean(request.cookies.get("nova_session_token")?.value);

    // If authenticated user attempts to access /login or /register, redirect to /
    if ((user || hasNovaToken) && (pathname === "/login" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch (err) {
    // If Supabase encounters network or parsing error, don't crash the request
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images / static formats
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
