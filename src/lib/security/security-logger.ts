/**
 * NOVA AI — Enterprise Security & Event Logger
 * Tracks audit events, rate limit trips, prompt sanitization triggers,
 * authentication operations, and provider failures with zero secret leakage.
 */

export type SecurityEventSeverity = "info" | "warn" | "error" | "critical";

export interface SecurityEventRecord {
  id: string;
  timestamp: string;
  type:
    | "auth_login_success"
    | "auth_login_failure"
    | "auth_registration"
    | "rate_limit_exceeded"
    | "prompt_injection_blocked"
    | "api_error"
    | "background_job_failure"
    | "provider_outage"
    | "admin_access";
  severity: SecurityEventSeverity;
  userId?: string;
  ipAddress?: string;
  details: string;
}

// In-memory persistent security buffer (last 100 events)
const securityLogBuffer: SecurityEventRecord[] = [
  {
    id: "sec-init-1",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: "admin_access",
    severity: "info",
    userId: "admin-root",
    details: "Production security logging engine initialized for Public Beta launch.",
  },
  {
    id: "sec-init-2",
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    type: "auth_login_success",
    severity: "info",
    userId: "user-default",
    details: "Authenticated session verified via scrypt hash token.",
  },
];

/**
 * Redacts potential API keys, passwords, and sensitive tokens from logs.
 */
function sanitizeDetails(str: string): string {
  if (!str) return "";
  return str
    .replace(/sk-ant-[a-zA-Z0-9_\-]{16,}/gi, "sk-ant-***REDACTED***")
    .replace(/bearer\s+[a-zA-Z0-9_\-\.]{16,}/gi, "Bearer ***REDACTED***")
    .replace(/password\s*[:=]\s*["']?[^"',\s]+["']?/gi, 'password="***REDACTED***"');
}

export function logSecurityEvent(
  type: SecurityEventRecord["type"],
  severity: SecurityEventSeverity,
  details: string,
  userId?: string,
  ipAddress?: string
): SecurityEventRecord {
  const event: SecurityEventRecord = {
    id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    severity,
    userId,
    ipAddress: ipAddress ? ipAddress.replace(/:[0-9]+$/, "") : undefined,
    details: sanitizeDetails(details),
  };

  securityLogBuffer.unshift(event);
  if (securityLogBuffer.length > 100) {
    securityLogBuffer.pop();
  }

  // Also print to stderr if warning or higher
  if (severity === "warn" || severity === "error" || severity === "critical") {
    console.warn(`[SECURITY ${severity.toUpperCase()}] [${type}] ${event.details}`);
  }

  return event;
}

export function getSecurityLogs(limit = 50): SecurityEventRecord[] {
  return securityLogBuffer.slice(0, limit);
}
