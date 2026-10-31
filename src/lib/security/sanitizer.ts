export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  hasInjectionRisk: boolean;
  flaggedPatterns: string[];
}

const INJECTION_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|prior|above)\s+instructions\b/i,
  /\bdisregard\s+(the\s+)?system\s+prompt\b/i,
  /\byou\s+are\s+now\s+in\s+developer\s+mode\b/i,
  /\bdo\s+anything\s+now\b/i,
  /\boverride\s+(all\s+)?security\s+rules\b/i,
  /\breveal\s+(your\s+)?system\s+instructions\b/i,
  /\bleak\s+the\s+hidden\s+prompt\b/i,
];

/**
 * Validates and sanitizes incoming user prompts against known prompt injection
 * and memory corruption vulnerabilities.
 */
export function validateAndSanitizePrompt(rawInput: string): ValidationResult {
  if (!rawInput || typeof rawInput !== "string") {
    return {
      isValid: false,
      sanitized: "",
      hasInjectionRisk: false,
      flaggedPatterns: ["Empty or non-string input"],
    };
  }

  // Length limit enforcement (50,000 characters per message turn)
  const trimmed = rawInput.trim();
  const capped = trimmed.slice(0, 50000);

  // Check injection patterns
  const flaggedPatterns: string[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(capped)) {
      flaggedPatterns.push(pattern.source);
    }
  }

  const hasInjectionRisk = flaggedPatterns.length > 0;

  // Sanitize potentially dangerous raw script tags while keeping standard markdown intact
  const sanitized = capped
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "[filtered script]")
    .replace(/javascript:/gi, "blocked-javascript:");

  return {
    isValid: true,
    sanitized,
    hasInjectionRisk,
    flaggedPatterns,
  };
}
