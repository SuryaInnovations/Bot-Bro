export interface AnthropicApiErrorInfo {
  type: string;
  statusCode: number;
  message: string;
  remedy: string;
}

export function parseAnthropicError(error: any): AnthropicApiErrorInfo {
  const status = error?.status || error?.statusCode || 500;
  const rawMsg = error?.message || String(error);

  if (status === 401 || rawMsg.includes("401") || rawMsg.includes("authentication_error") || rawMsg.includes("API key")) {
    return {
      type: "authentication_error",
      statusCode: 401,
      message: "Invalid or missing Anthropic API Key.",
      remedy: "Provide a valid Anthropic API key in .env.local or enter it directly in NOVA AI Settings → API & Usage.",
    };
  }

  if (status === 429 || rawMsg.includes("rate_limit_error")) {
    return {
      type: "rate_limit_error",
      statusCode: 429,
      message: "Anthropic API rate limit exceeded.",
      remedy: "Please wait a moment before sending another request, or check your tier rate limits in the Anthropic Console.",
    };
  }

  if (rawMsg.includes("credit balance") || rawMsg.includes("purchase credits") || rawMsg.includes("billing")) {
    return {
      type: "billing_error",
      statusCode: 402,
      message: "Anthropic API credit balance is too low.",
      remedy: "Please visit console.anthropic.com/settings/billing to purchase API credits or enter a funded key in Settings.",
    };
  }

  if (status === 400 || rawMsg.includes("invalid_request_error")) {
    return {
      type: "invalid_request_error",
      statusCode: 400,
      message: `Invalid API request parameter: ${rawMsg}`,
      remedy: "Verify your request parameters, model ID, or tool schemas against official documentation.",
    };
  }

  if (status === 529 || rawMsg.includes("overloaded_error")) {
    return {
      type: "overloaded_error",
      statusCode: 529,
      message: "Anthropic's servers are temporarily overloaded.",
      remedy: "The system will automatically retry with exponential backoff. You can also switch to Claude 3.5 Haiku.",
    };
  }

  return {
    type: "api_error",
    statusCode: status,
    message: rawMsg,
    remedy: "Check your network connection and verify API status at status.anthropic.com.",
  };
}
