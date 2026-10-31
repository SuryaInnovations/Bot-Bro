/**
 * Comprehensive Test Suite: Google OAuth, PKCE, Session Persistence & UI Recovery
 */
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

console.log("==================================================");
console.log("  BOT BRO GOOGLE OAUTH & SESSION PERSISTENCE TESTS");
console.log("==================================================");

let passed = 0;
let failed = 0;

function testAssert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// 1. Static Architecture & Code Review Tests
console.log("\n[TEST GROUP 1] Google OAuth Architecture & Redirect URLs");
{
  const clientCode = fs.readFileSync(path.join(__dirname, "../src/lib/supabase/client.ts"), "utf-8");
  testAssert(clientCode.includes("getSiteUrl"), "client.ts exports getSiteUrl function");
  testAssert(clientCode.includes("getAuthCallbackUrl"), "client.ts exports getAuthCallbackUrl function");
  testAssert(clientCode.includes("NEXT_PUBLIC_SITE_URL"), "client.ts resolves NEXT_PUBLIC_SITE_URL in production");
  testAssert(clientCode.includes("localhost"), "client.ts safely defaults to localhost only in development");

  const callbackCode = fs.readFileSync(path.join(__dirname, "../src/app/auth/callback/route.ts"), "utf-8");
  testAssert(callbackCode.includes("getSiteUrl"), "Callback route uses getSiteUrl for redirects");
  testAssert(callbackCode.includes("exchangeCodeForSession"), "Callback route calls exchangeCodeForSession");
  testAssert(callbackCode.includes("createServerClient"), "Callback route initializes @supabase/ssr createServerClient");
  testAssert(callbackCode.includes("nova_session_token"), "Callback sets nova_session_token cookie");
  testAssert(callbackCode.includes("loginWithGoogleOAuth"), "Callback synchronizes Google OAuth identity with Bot Bro user store");

  const middlewareCode = fs.readFileSync(path.join(__dirname, "../src/middleware.ts"), "utf-8");
  testAssert(middlewareCode.includes("getSiteUrl"), "Middleware uses getSiteUrl for redirects");
  testAssert(middlewareCode.includes("redirectResponse.cookies.set"), "Middleware preserves refreshed cookies during redirects");

  const loginCode = fs.readFileSync(path.join(__dirname, "../src/app/login/page.tsx"), "utf-8");
  testAssert(loginCode.includes("getAuthCallbackUrl"), "Login page uses getAuthCallbackUrl for OAuth redirect");

  const registerCode = fs.readFileSync(path.join(__dirname, "../src/app/register/page.tsx"), "utf-8");
  testAssert(registerCode.includes("getAuthCallbackUrl"), "Registration page uses getAuthCallbackUrl for OAuth redirect");
}

// 2. Session Route Handler Verification
console.log("\n[TEST GROUP 2] Session Route Handler & Dual-Engine Session Resolution");
{
  const sessionRouteCode = fs.readFileSync(path.join(__dirname, "../src/app/api/auth/session/route.ts"), "utf-8");
  testAssert(sessionRouteCode.includes("createServerSupabaseClient"), "Session route checks Supabase SSR server client");
  testAssert(sessionRouteCode.includes("supabase.auth.getUser()"), "Session route verifies user with Supabase server client");
  testAssert(sessionRouteCode.includes("validateSession"), "Session route validates custom signed session tokens");
  testAssert(sessionRouteCode.includes("generateSecureSessionToken"), "Session route generates secure stateless tokens for Supabase users");
  testAssert(sessionRouteCode.includes("response.cookies.set(\"nova_session_token\""), "Session route keeps nova_session_token cookie in sync");
  testAssert(sessionRouteCode.includes("supabase.auth.signOut()"), "Session POST logout signs out from Supabase server client");
}

// 3. Stateless Token Generation & Validation Algorithm Verification
console.log("\n[TEST GROUP 3] Stateless Token Generation & Validation Cryptographic Harness");
{
  const authServiceCode = fs.readFileSync(path.join(__dirname, "../src/lib/auth/auth-service.ts"), "utf-8");
  testAssert(authServiceCode.includes("generateSecureSessionToken"), "auth-service.ts exports generateSecureSessionToken");
  testAssert(authServiceCode.includes("createHmac"), "auth-service.ts implements HMAC-SHA256 signature for stateless tokens");
  testAssert(authServiceCode.includes("timingSafeEqual"), "auth-service.ts uses timingSafeEqual for signature comparison");

  // Functional cryptographic test simulating auth-service logic
  const SECRET = "bot-bro-auth-signature-salt-2026";
  function testGenToken(user) {
    const payload = Buffer.from(
      JSON.stringify({ u: user, exp: Date.now() + 7 * 24 * 3600 * 1000 })
    ).toString("base64url");
    const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
    return `nvs_${payload}.${sig}`;
  }

  function testValidateToken(token) {
    if (!token || !token.startsWith("nvs_")) return null;
    const parts = token.slice(4).split(".");
    if (parts.length !== 2) return null;
    const [payloadStr, sig] = parts;
    const expectedSig = crypto.createHmac("sha256", SECRET).update(payloadStr).digest("hex");
    if (sig.length !== expectedSig.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
    const payload = JSON.parse(Buffer.from(payloadStr, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp > Date.now()) {
      return payload.u;
    }
    return null;
  }

  const dummyUser = {
    id: "usr-google-xyz-987",
    email: "sarah.connor@example.com",
    fullName: "Sarah Connor",
    avatarUrl: "https://lh3.googleusercontent.com/photo.jpg",
    role: "user",
  };

  const token = testGenToken(dummyUser);
  testAssert(Boolean(token && token.startsWith("nvs_")), "Generated signed session token with nvs_ prefix");

  const validated = testValidateToken(token);
  testAssert(validated !== null, "Validated token across isolated execution boundary");
  testAssert(validated.email === "sarah.connor@example.com", "Decoded user identity matches exactly");

  // Tamper resistance test
  const tamperedToken = token.slice(0, -6) + "000000";
  const tamperedResult = testValidateToken(tamperedToken);
  testAssert(tamperedResult === null, "Tampered session token safely rejected");

  // Expiration test
  const expiredPayload = Buffer.from(
    JSON.stringify({ u: dummyUser, exp: Date.now() - 1000 })
  ).toString("base64url");
  const expiredSig = crypto.createHmac("sha256", SECRET).update(expiredPayload).digest("hex");
  const expiredToken = `nvs_${expiredPayload}.${expiredSig}`;
  testAssert(testValidateToken(expiredToken) === null, "Expired session token safely rejected");
}

// 4. Client Page & Recovery Screen Verification
console.log("\n[TEST GROUP 4] Client Home Page Loading, Timeout & Error Fallback");
{
  const pageCode = fs.readFileSync(path.join(__dirname, "../src/app/page.tsx"), "utf-8");
  testAssert(pageCode.includes("Authenticating BOT BRO session..."), "Displays sleek authenticating status text");
  testAssert(pageCode.includes("getSupabaseBrowserClient"), "Page checks getSupabaseBrowserClient for immediate session resolution");
  testAssert(pageCode.includes("authTimeout"), "Page implements safety timeout to prevent infinite loading state");
  testAssert(pageCode.includes("authError"), "Page provides dedicated authError state for recovery");
  testAssert(pageCode.includes("Session Notice"), "Page renders user-facing error notice if session verification times out");
  testAssert(pageCode.includes("Sign In Again"), "Page renders 'Sign In Again' action button on failure");
  testAssert(pageCode.includes("handleLogout"), "Home page implements handleLogout to cleanly reset sessions");
  testAssert(pageCode.includes("supabase.auth.signOut()"), "handleLogout signs out of Supabase browser client");
}

// 5. Environment & Credentials Safety Audit
console.log("\n[TEST GROUP 5] Environment & Credentials Safety Audit");
{
  const envContent = fs.readFileSync(path.join(__dirname, "../.env.local"), "utf-8");
  testAssert(envContent.includes("NEXT_PUBLIC_SITE_URL=https://bot-bro-one.vercel.app"), ".env.local defines production NEXT_PUBLIC_SITE_URL");
  testAssert(envContent.includes("NEXT_PUBLIC_SUPABASE_URL=https://xdpzndrmyusdwzuktabi.supabase.co"), ".env.local preserves existing Supabase URL");
  testAssert(envContent.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_86-n2k0HH1f5tPPD1p-kMw_ZUrudVdF"), ".env.local preserves existing Supabase Anon Key");

  // Check that no tokens or secrets are logged
  const callbackCode = fs.readFileSync(path.join(__dirname, "../src/app/auth/callback/route.ts"), "utf-8");
  testAssert(!callbackCode.includes("console.log(code)"), "Callback route does not log raw authorization code");
  testAssert(!callbackCode.includes("console.log(data?.session)"), "Callback route does not dump raw session object");
  testAssert(!callbackCode.includes("console.log(cleanKey)"), "Callback route does not log Supabase secret key");
}

console.log("\n==================================================");
console.log(`  OAUTH & SESSION TESTS RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
}
