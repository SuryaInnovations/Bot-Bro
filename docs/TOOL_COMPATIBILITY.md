# Claude Model & Tool Compatibility Matrix

*Last Verified: October 2026*  
*Official Source: [https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)*

---

## 1. Compatibility Matrix

| Tool Identifier | Tool Type | Claude 3.7 Sonnet | Claude 3.5 Sonnet | Claude 3.5 Haiku | Claude 3 Opus | Required Beta Header |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| `web_search_20250305` | Server | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | `web-search-2025-03-05` |
| `web_fetch_20250910` | Server | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | `web-fetch-2025-09-10` |
| `code_execution_20250825` | Server | ✅ Yes | ✅ Yes | ⚠️ Limited | ❌ No | `code-execution-2025-08-25` |
| `advisor_20260301` | Server | ✅ Yes | ✅ Yes | ❌ No | ❌ No | `advisor-tool-2026-03-01` |
| `tool_search_tool_bm25_20251119`| Server | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | `tool-search-2025-11-19` |
| `memory_20250818` | Client | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | *Standard Tool Calling* |
| `bash_20250124` | Client | ✅ Yes | ✅ Yes | ⚠️ Limited | ❌ No | `computer-use-2024-10-22` |
| `text_editor_20250728` | Client | ✅ Yes | ✅ Yes | ⚠️ Limited | ❌ No | `computer-use-2024-10-22` |
| `computer_20241022` | Client | ✅ Yes | ✅ Yes | ❌ No | ❌ No | `computer-use-2024-10-22` |
| `computer_20250124` | Client | ✅ Yes | ✅ Yes | ❌ No | ❌ No | `computer-use-2025-01-24` |
| `browser_toolset_20260801` | Client | ✅ Yes | ✅ Yes | ❌ No | ❌ No | `browser-use-2026-08-01` |

---

## 2. Beta Headers Reference

When invoking advanced or beta tools, the `anthropic-beta` header must be passed as a comma-separated string or array:

| Feature / Tool | Header Name | Value |
| :--- | :--- | :--- |
| **Web Search** | `anthropic-beta` | `web-search-2025-03-05` |
| **Web Fetch** | `anthropic-beta` | `web-fetch-2025-09-10` |
| **Code Execution** | `anthropic-beta` | `code-execution-2025-08-25` |
| **Advisor Strategy** | `anthropic-beta` | `advisor-tool-2026-03-01` |
| **Computer Use (v1)**| `anthropic-beta` | `computer-use-2024-10-22` |
| **Computer Use (v2)**| `anthropic-beta` | `computer-use-2025-01-24` |
| **Prompt Caching** | `anthropic-beta` | `prompt-caching-2024-07-31` |
| **Token Counting** | `anthropic-beta` | `token-counting-2024-11-01` |
| **128k Output** | `anthropic-beta` | `output-128k-2025-02-19` |

### Multiple Beta Headers
Multiple beta headers can be combined using commas:
```http
anthropic-beta: web-search-2025-03-05,code-execution-2025-08-25,output-128k-2025-02-19
```

---

## 3. Invalid Combinations & Fallback Policies

1. **Claude 3 Opus with Server Tools**:
   - Claude 3 Opus does not support the newer native server-side tools (`web_search_20250305`, `code_execution_20250825`).
   - *Fallback Policy*: NOVA AI automatically falls back to client-executed function calling or notifies the user to switch to Claude 3.7 Sonnet or Claude 3.5 Sonnet.
2. **Haiku with Computer Use**:
   - Haiku models do not have spatial visual coordination for desktop computer control.
   - *Policy*: Reject request upfront with a clear descriptive message: "Computer use requires Claude 3.7 Sonnet or Claude 3.5 Sonnet."
3. **Thinking Budget with Non-Thinking Models**:
   - Supplying `thinking: { type: "enabled" }` to Claude 3.5 Sonnet or Haiku will throw an `invalid_request_error`.
   - *Policy*: Strip thinking parameters automatically when non-reasoning models are selected.
