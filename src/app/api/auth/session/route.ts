import { NextRequest, NextResponse } from "next/server";
import { validateSession, logoutSession, generateSecureSessionToken } from "@/lib/auth/auth-service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserProfile } from "@/lib/auth/auth-types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("nova_session_token")?.value;
    const token = authHeader?.replace(/^Bearer\s+/i, "") || cookieToken;

    // 1. Check custom signed / active session token
    if (token) {
      const user = validateSession(token);
      if (user) {
        return NextResponse.json({ authenticated: true, user, token });
      }
    }

    // 2. Fallback to Supabase SSR server client session from cookies
    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        const {
          data: { user: sbUser },
          error: sbError,
        } = await supabase.auth.getUser();

        if (sbUser && !sbError) {
          const userProfile: UserProfile = {
            id: sbUser.id,
            email: sbUser.email || "",
            fullName:
              sbUser.user_metadata?.full_name ||
              sbUser.user_metadata?.name ||
              sbUser.email?.split("@")[0] ||
              "User",
            avatarUrl: sbUser.user_metadata?.avatar_url || sbUser.user_metadata?.picture || "",
            role: "user",
            emailVerified: Boolean(sbUser.email_confirmed_at || sbUser.confirmed_at),
            createdAt: sbUser.created_at || new Date().toISOString(),
            updatedAt: sbUser.updated_at || new Date().toISOString(),
          };

          const sessionToken = generateSecureSessionToken(userProfile);
          const response = NextResponse.json({
            authenticated: true,
            user: userProfile,
            token: sessionToken,
          });

          response.cookies.set("nova_session_token", sessionToken, {
            path: "/",
            httpOnly: false,
            maxAge: 7 * 24 * 3600,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });

          return response;
        }
      } catch (sbErr: any) {
        console.warn("[Session Check] Supabase session lookup notice:", sbErr?.message);
      }
    }

    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to validate session" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("nova_session_token")?.value;
    const token = authHeader?.replace(/^Bearer\s+/i, "") || cookieToken;

    if (token) {
      logoutSession(token);
    }

    // Sign out from Supabase server client as well
    const supabase = createServerSupabaseClient();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (sbErr: any) {
        console.warn("[Logout] Supabase signOut notice:", sbErr?.message);
      }
    }

    const response = NextResponse.json({ success: true, message: "Logged out successfully" });
    response.cookies.delete("nova_session_token");
    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to logout" }, { status: 500 });
  }
}
