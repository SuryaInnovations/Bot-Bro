"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { NovaOrb } from "@/components/common/NovaOrb";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  getSupabaseConfigStatus,
} from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  // Mode: "login" or "forgot"
  const [mode, setMode] = useState<"login" | "forgot">("login");

  // Form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Password reset flow
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isResetStep2, setIsResetStep2] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [oauthNotice, setOauthNotice] = useState("");

  // Check if user is already authenticated or if redirected with an error
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const urlError = searchParams.get("error");
      if (urlError) {
        setErrorMessage(decodeURIComponent(urlError));
      }
    }

    try {
      const stored = localStorage.getItem("nova_user_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.user?.email) {
          router.replace("/");
          return;
        }
      }
    } catch {}

    // Verify server session
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          localStorage.setItem("nova_user_session", JSON.stringify(data));
          router.replace("/");
        }
      })
      .catch(() => {});
  }, [router]);

  // Handle Email & Password Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setOauthNotice("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      // Store authenticated session locally
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "nova_user_session",
          JSON.stringify({
            token: data.token,
            user: data.user,
            expiresAt: data.session?.expiresAt,
          })
        );
      }

      setSuccessMessage("Authenticated successfully. Launching NOVA AI...");

      setTimeout(() => {
        router.push("/");
      }, 600);
    } catch (err: any) {
      setErrorMessage(err?.message || "Network error. Failed to reach authentication service.");
      setIsLoading(false);
    }
  };

  // Handle Real Google OAuth Login
  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setOauthNotice("");
    setOauthLoading(true);

    try {
      const configStatus = getSupabaseConfigStatus();
      if (!configStatus.isConfigured) {
        setErrorMessage(
          configStatus.errorMessage ||
            "Google sign-in setup is incomplete: Missing Supabase credentials in .env.local."
        );
        setOauthLoading(false);
        return;
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setErrorMessage(
          "Supabase client initialization failed: Please check your NEXT_PUBLIC_SUPABASE_URL."
        );
        setOauthLoading(false);
        return;
      }

      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("not enabled") || msg.includes("unsupported") || msg.includes("disabled")) {
          setErrorMessage(
            "Google provider is disabled in Supabase. Enable Google in Supabase Dashboard → Authentication → Providers → Google."
          );
        } else if (msg.includes("client id") || msg.includes("secret") || msg.includes("not configured")) {
          setErrorMessage(
            "Google OAuth credentials missing: Add Client ID and Secret in Supabase Dashboard → Authentication → Providers → Google."
          );
        } else if (msg.includes("redirect") || msg.includes("url not allowed")) {
          setErrorMessage(
            `Redirect URL not allowed: Add ${redirectTo} in Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.`
          );
        } else if (msg.includes("network") || msg.includes("fetch") || msg.includes("failed to fetch")) {
          setErrorMessage(
            "Unable to connect to authentication server. Please check your internet connection."
          );
        } else {
          setErrorMessage(`Google OAuth error: ${error.message}`);
        }
        setOauthLoading(false);
        return;
      }
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Unable to connect to authentication server. Please try again."
      );
      setOauthLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter the email associated with your account.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || "Failed to request password reset.");
        setIsLoading(false);
        return;
      }

      if (data.token) {
        setResetToken(data.token);
        setIsResetStep2(true);
        setSuccessMessage(
          "Recovery token generated. You can now choose a new password below."
        );
      } else {
        setSuccessMessage(data.message || "Reset instructions have been generated.");
      }
      setIsLoading(false);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to request password reset.");
      setIsLoading(false);
    }
  };

  // Handle Password Reset Confirmation (Step 2)
  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!newPassword || newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset",
          token: resetToken,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || data.message || "Failed to reset password.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(
        "Password updated successfully! You can now sign in with your new password."
      );
      setIsResetStep2(false);
      setMode("login");
      setPassword("");
      setIsLoading(false);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to reset password.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-[#090A0F] text-zinc-100 relative overflow-hidden select-none font-sans">
      {/* Background Lighting Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft top gradient radial glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-gradient-to-b from-indigo-600/25 via-purple-600/15 to-transparent rounded-full blur-[130px]" />
        {/* Subtle cyan-blue bottom-right accent */}
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px]" />
        {/* Subtle terracotta-pink bottom-left accent */}
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[120px]" />
        {/* Modern Dot Matrix Grid Overlay */}
        <div
          className="absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.45) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      {/* Top Simple Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 group">
          <NovaOrb size="sm" />
          <span className="font-bold text-base tracking-tight text-white group-hover:text-zinc-200 transition">
            BOT BRO
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-zinc-300 border border-white/10">
            AI Assistant
          </span>
        </Link>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-zinc-400 hidden sm:inline">Don't have an account?</span>
          <Link
            href="/register"
            className="text-white hover:text-indigo-400 font-medium px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 bg-white/5 transition"
          >
            Sign up
          </Link>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[420px] relative">
          {/* Card Frame with Translucent Glass Surface */}
          <div className="relative rounded-3xl bg-[#12131A]/85 backdrop-blur-2xl border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.65)] p-7 sm:p-9 overflow-hidden">
            {/* Top Subtle Indigo Highlight Line */}
            <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />

            {/* Logo & Headings */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="relative mb-3">
                <div className="absolute -inset-2 bg-indigo-500/20 rounded-full blur-md" />
                <NovaOrb size="md" className="relative" />
              </div>

              {mode === "login" ? (
                <>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Welcome back
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                    Your intelligent AI companion is ready.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold tracking-tight text-white">
                    Reset Password
                  </h1>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                    {isResetStep2
                      ? "Enter your new secure password."
                      : "Enter your account email to receive reset instructions."}
                  </p>
                </>
              )}
            </div>

            {/* Error & Success Notification Banners */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="flex-1 leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span className="flex-1 leading-relaxed">{successMessage}</span>
              </div>
            )}

            {oauthNotice && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span className="flex-1 leading-relaxed">{oauthNotice}</span>
              </div>
            )}

            {/* Mode 1: STANDARD LOGIN */}
            {mode === "login" && (
              <>
                {/* 1. Continue with Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={oauthLoading || isLoading}
                  className="w-full h-11 px-4 rounded-xl bg-white hover:bg-zinc-100 text-zinc-900 font-medium text-xs sm:text-sm shadow-xs transition flex items-center justify-center gap-3 disabled:opacity-60 active:scale-[0.99] group mb-4"
                >
                  {oauthLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-700" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                    or email
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                {/* 2. Email & Password Login Form */}
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        autoComplete="email"
                        className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-indigo-500/70 focus:bg-white/[0.07] text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none transition"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-zinc-300">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setMode("forgot");
                          setErrorMessage("");
                          setSuccessMessage("");
                        }}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                        className="w-full h-10 pl-10 pr-10 rounded-xl bg-white/[0.04] border border-white/10 focus:border-indigo-500/70 focus:bg-white/[0.07] text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 transition active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* Mode 2: FORGOT PASSWORD FLOW */}
            {mode === "forgot" && (
              <form
                onSubmit={
                  isResetStep2 ? handleConfirmPasswordReset : handleRequestPasswordReset
                }
                className="space-y-3.5 animate-fadeIn"
              >
                {!isResetStep2 ? (
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-indigo-500/70 focus:bg-white/[0.07] text-white text-xs sm:text-sm placeholder-zinc-500 focus:outline-none transition"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        Recovery Token
                      </label>
                      <input
                        type="text"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Paste reset token"
                        required
                        className="w-full h-10 px-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                        New Password (min 8 chars)
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="w-full h-10 pl-10 pr-10 rounded-xl bg-white/[0.04] border border-white/10 focus:border-indigo-500/70 text-white text-xs sm:text-sm focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 p-1"
                        >
                          {showNewPassword ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <span>
                      {isResetStep2 ? "Update Password" : "Send Recovery Instructions"}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setIsResetStep2(false);
                    setErrorMessage("");
                    setSuccessMessage("");
                  }}
                  className="w-full text-center text-xs text-zinc-400 hover:text-white pt-2 transition"
                >
                  ← Back to login
                </button>
              </form>
            )}

            {/* Bottom Card Navigation */}
            {mode === "login" && (
              <div className="mt-6 pt-5 border-t border-white/10 text-center text-xs text-zinc-400">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="text-white hover:text-indigo-400 font-semibold transition"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Trust & Security Footnote */}
          <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-zinc-500">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enterprise 256-bit AES</span>
            </div>
            <span>•</span>
            <span>Zero Plain-Text Storage</span>
          </div>
        </div>
      </main>

      {/* Footer Links */}
      <footer className="relative z-10 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-zinc-500 text-xs max-w-7xl mx-auto w-full gap-2">
        <div>© 2026 BOT BRO Inc. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-zinc-300 transition">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-zinc-300 transition">
            Terms of Service
          </Link>
          <Link href="/docs" className="hover:text-zinc-300 transition">
            Documentation
          </Link>
        </div>
      </footer>
    </div>
  );
}
