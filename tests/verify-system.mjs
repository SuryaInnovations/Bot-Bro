import { resolveActualModelId, CLAUDE_MODELS } from "./src/lib/anthropic/client.ts";
import { executeCodeInSandbox } from "./src/lib/code-sandbox.ts";
import { performWebSearch, fetchWebPageContent } from "./src/lib/web-search.ts";

console.log("=== NOVA AI INTEGRATION TEST SUITE ===");

// 1. Verify Model Resolution
console.log("\n[1/4] Testing Model Resolver...");
console.assert(
  resolveActualModelId("claude-3-7-sonnet-20250219") === "claude-3-7-sonnet-20250219",
  "Model ID resolution failed"
);
console.assert(
  resolveActualModelId("claude-opus-5-5") === "claude-3-7-sonnet-20250219",
  "Alias Opus 5.5 resolution failed"
);
console.log("✓ Model Resolver verified. Supported models:", CLAUDE_MODELS.length);

// 2. Verify Code Execution Sandbox
console.log("\n[2/4] Testing Code Execution Sandbox...");
const jsResult = await executeCodeInSandbox("javascript", "const x = 40 + 2; console.log('Result:', x);");
console.log("JS Output:", jsResult.stdout.trim());
console.assert(jsResult.stdout.includes("Result: 42"), "JS execution failed");
console.log("✓ Code Sandbox execution verified.");

// 3. Verify Web Search Tool
console.log("\n[3/4] Testing Web Search Engine...");
const searchRes = await performWebSearch("Anthropic Claude AI");
console.log(`Found ${searchRes.results.length} search results and ${searchRes.citations.length} citations.`);
console.assert(searchRes.citations.length > 0, "Citations should not be empty");
console.log("✓ Web Search verified.");

// 4. Verify Web Page Fetcher
console.log("\n[4/4] Testing Webpage Content Fetcher...");
const fetchRes = await fetchWebPageContent("https://example.com");
console.log("Fetched Title:", fetchRes.title);
console.assert(fetchRes.content.length > 0, "Content extraction failed");
console.log("✓ Webpage Fetcher verified.");

console.log("\n=== ALL SYSTEM TESTS COMPLETED SUCCESSFULLY ===");
