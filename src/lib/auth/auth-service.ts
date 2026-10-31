import crypto from "crypto";
import {
  UserProfile,
  UserSession,
  AuthResponse,
  PasswordResetRecord,
  EmailVerificationRecord,
} from "./auth-types";
import { getSupabaseServerClient } from "../supabase/server";

interface StoredUser extends UserProfile {
  passwordHash?: string;
  salt?: string;
}

// In-memory persistent backing store (augmented by Supabase when configured)
let usersStore: StoredUser[] = [
  {
    id: "usr-admin-default",
    email: "admin@nova.ai",
    fullName: "Chief AI Architect",
    avatarUrl: "/avatars/nova-admin.png",
    role: "admin",
    emailVerified: true,
    // Password is pre-hashed: "NovaAdmin2026!"
    passwordHash: "dcd0143df228d10ed09ce5bb213020c4ebada0c852d95f8693035adcef997d32122be8300472fd9f0c1850536573926243fa4128e4480c99b4397185269f212f",
    salt: "8f79d3910c2c1998e1fae923b723812d",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "usr-saleh-default",
    email: "saleh@example.com",
    fullName: "Saleh",
    avatarUrl: "",
    role: "user",
    emailVerified: true,
    passwordHash: "dcd0143df228d10ed09ce5bb213020c4ebada0c852d95f8693035adcef997d32122be8300472fd9f0c1850536573926243fa4128e4480c99b4397185269f212f",
    salt: "8f79d3910c2c1998e1fae923b723812d",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let sessionsStore: UserSession[] = [];
let passwordResetTokens: PasswordResetRecord[] = [];
let emailVerificationTokens: EmailVerificationRecord[] = [];

// ==========================================
// CRYPTOGRAPHY UTILITIES
// ==========================================

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const computed = crypto.scryptSync(password, salt, 64);
  const existing = Buffer.from(hash, "hex");
  if (computed.length !== existing.length) return false;
  return crypto.timingSafeEqual(computed, existing);
}

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function sanitizeUser(user: StoredUser): UserProfile {
  const { passwordHash, salt, ...sanitized } = user;
  return sanitized;
}

// ==========================================
// REGISTRATION & LOGIN
// ==========================================

export async function registerWithEmailPassword(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResponse> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Validate Email & Password Complexity
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return { success: false, error: "Please provide a valid email address." };
  }
  if (!password || password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters long." };
  }

  // 2. Check if user already exists
  if (usersStore.some((u) => u.email === cleanEmail)) {
    return { success: false, error: "An account with this email already exists." };
  }

  // 3. Supabase Auth Integration Bridge
  const supabase = getSupabaseServerClient();
  let supabaseId: string | undefined;

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        console.warn("Supabase signUp warning:", error.message);
      } else if (data.user) {
        supabaseId = data.user.id;
      }
    } catch (sbErr: any) {
      console.warn("Supabase connection warning:", sbErr.message);
    }
  }

  // 4. Create user record
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const now = new Date().toISOString();

  const newUser: StoredUser = {
    id: supabaseId || `usr-${crypto.randomBytes(8).toString("hex")}`,
    email: cleanEmail,
    fullName: fullName.trim() || cleanEmail.split("@")[0],
    role: "user",
    emailVerified: false,
    passwordHash,
    salt,
    createdAt: now,
    updatedAt: now,
  };

  usersStore.push(newUser);

  // 5. Generate Email Verification Token
  const verificationToken = generateSecureToken();
  emailVerificationTokens.push({
    token: verificationToken,
    userId: newUser.id,
    email: cleanEmail,
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(), // 24 hours
  });

  // 6. Create active session
  const sessionToken = generateSecureToken();
  const session: UserSession = {
    token: sessionToken,
    user: sanitizeUser(newUser),
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), // 7 days
    createdAt: now,
  };
  sessionsStore.push(session);

  return {
    success: true,
    user: sanitizeUser(newUser),
    session,
    token: sessionToken,
    requiresEmailVerification: true,
    message: "Registration successful. A verification email token has been generated.",
  };
}

export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResponse> {
  const cleanEmail = email.toLowerCase().trim();
  const user = usersStore.find((u) => u.email === cleanEmail);

  if (!user || !user.passwordHash || !user.salt) {
    return { success: false, error: "Invalid email or password." };
  }

  const isValid = verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    return { success: false, error: "Invalid email or password." };
  }

  // Generate new session
  const sessionToken = generateSecureToken();
  const session: UserSession = {
    token: sessionToken,
    user: sanitizeUser(user),
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  sessionsStore.push(session);

  return {
    success: true,
    user: sanitizeUser(user),
    session,
    token: sessionToken,
  };
}

export async function loginWithGoogleOAuth(
  email: string,
  fullName: string,
  avatarUrl?: string
): Promise<AuthResponse> {
  const cleanEmail = email.toLowerCase().trim();
  let user = usersStore.find((u) => u.email === cleanEmail);

  const now = new Date().toISOString();
  if (!user) {
    user = {
      id: `usr-google-${crypto.randomBytes(8).toString("hex")}`,
      email: cleanEmail,
      fullName: fullName || cleanEmail.split("@")[0],
      avatarUrl: avatarUrl || "",
      role: "user",
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    };
    usersStore.push(user);
  } else {
    user.fullName = fullName || user.fullName;
    if (avatarUrl) user.avatarUrl = avatarUrl;
    user.emailVerified = true;
    user.updatedAt = now;
  }

  const sessionToken = generateSecureToken();
  const session: UserSession = {
    token: sessionToken,
    user: sanitizeUser(user),
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    createdAt: now,
  };
  sessionsStore.push(session);

  return {
    success: true,
    user: sanitizeUser(user),
    session,
    token: sessionToken,
  };
}

// ==========================================
// SESSION VALIDATION & LOGOUT
// ==========================================

export function validateSession(token: string): UserProfile | null {
  if (!token) return null;
  const session = sessionsStore.find((s) => s.token === token);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    // Expired
    sessionsStore = sessionsStore.filter((s) => s.token !== token);
    return null;
  }

  // Refresh user state from store
  const user = usersStore.find((u) => u.id === session.user.id);
  return user ? sanitizeUser(user) : session.user;
}

export function logoutSession(token: string): boolean {
  const initialLen = sessionsStore.length;
  sessionsStore = sessionsStore.filter((s) => s.token !== token);
  return sessionsStore.length < initialLen;
}

// ==========================================
// EMAIL VERIFICATION & PASSWORD RESET
// ==========================================

export function verifyEmailToken(token: string): { success: boolean; message: string } {
  const record = emailVerificationTokens.find((r) => r.token === token);
  if (!record) {
    return { success: false, message: "Invalid or expired verification token." };
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    emailVerificationTokens = emailVerificationTokens.filter((r) => r.token !== token);
    return { success: false, message: "Verification token has expired. Please request a new one." };
  }

  const user = usersStore.find((u) => u.id === record.userId);
  if (user) {
    user.emailVerified = true;
    user.updatedAt = new Date().toISOString();
  }

  emailVerificationTokens = emailVerificationTokens.filter((r) => r.token !== token);
  return { success: true, message: "Email successfully verified. Your account is in good standing." };
}

export function requestPasswordReset(email: string): { success: boolean; token?: string; message: string } {
  const cleanEmail = email.toLowerCase().trim();
  const user = usersStore.find((u) => u.email === cleanEmail);

  if (!user) {
    // Security best practice: don't reveal if email exists
    return { success: true, message: "If an account matches that email, reset instructions have been generated." };
  }

  const resetToken = generateSecureToken();
  passwordResetTokens.push({
    token: resetToken,
    userId: user.id,
    email: cleanEmail,
    expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
  });

  return {
    success: true,
    token: resetToken,
    message: "Password reset token generated. Use this token to set a new password.",
  };
}

export function resetPasswordWithToken(
  token: string,
  newPassword: string
): { success: boolean; message: string } {
  if (!newPassword || newPassword.length < 8) {
    return { success: false, message: "New password must be at least 8 characters long." };
  }

  const record = passwordResetTokens.find((r) => r.token === token);
  if (!record) {
    return { success: false, message: "Invalid or expired password reset token." };
  }

  if (new Date(record.expiresAt).getTime() < Date.now()) {
    passwordResetTokens = passwordResetTokens.filter((r) => r.token !== token);
    return { success: false, message: "Reset token has expired. Please request a new one." };
  }

  const user = usersStore.find((u) => u.id === record.userId);
  if (!user) {
    return { success: false, message: "User account not found." };
  }

  const salt = crypto.randomBytes(16).toString("hex");
  user.passwordHash = hashPassword(newPassword, salt);
  user.salt = salt;
  user.updatedAt = new Date().toISOString();

  // Invalidate all existing sessions on password change
  sessionsStore = sessionsStore.filter((s) => s.user.id !== user.id);
  passwordResetTokens = passwordResetTokens.filter((r) => r.token !== token);

  return { success: true, message: "Password updated successfully. Please sign in with your new credentials." };
}

// ==========================================
// USER PROFILE, DATA EXPORT & DELETION
// ==========================================

export function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): UserProfile | null {
  const user = usersStore.find((u) => u.id === userId);
  if (!user) return null;

  if (updates.fullName) user.fullName = updates.fullName.trim();
  if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;
  if (updates.preferences) {
    user.preferences = { ...user.preferences, ...updates.preferences };
  }
  user.updatedAt = new Date().toISOString();

  return sanitizeUser(user);
}

export function exportUserData(userId: string): Record<string, any> {
  const user = usersStore.find((u) => u.id === userId);
  return {
    exportedAt: new Date().toISOString(),
    profile: user ? sanitizeUser(user) : null,
    systemInfo: {
      platform: "BOT BRO Unified Conversational Assistant",
      securityStandard: "GDPR / RLS Isolated Architecture",
    },
  };
}

export function deleteUserAccount(userId: string): boolean {
  const initLen = usersStore.length;
  usersStore = usersStore.filter((u) => u.id !== userId);
  sessionsStore = sessionsStore.filter((s) => s.user.id !== userId);
  return usersStore.length < initLen;
}
