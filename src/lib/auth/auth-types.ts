export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: "user" | "admin";
  emailVerified: boolean;
  preferences?: {
    theme?: "light" | "dark" | "system";
    defaultModel?: string;
    customInstructions?: string;
    timezone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  token: string;
  user: UserProfile;
  expiresAt: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  session?: UserSession;
  token?: string;
  error?: string;
  message?: string;
  requiresEmailVerification?: boolean;
}

export interface PasswordResetRecord {
  token: string;
  userId: string;
  email: string;
  expiresAt: string;
}

export interface EmailVerificationRecord {
  token: string;
  userId: string;
  email: string;
  expiresAt: string;
}
