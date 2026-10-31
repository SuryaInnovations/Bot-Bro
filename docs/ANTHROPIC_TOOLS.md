# Anthropic Claude Tools Catalogue & Technical Specification

*Last Verified Against Official Documentation: October 2026*  
*Official Source: [https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)*

---

## 1. Tool Architectural Taxonomy: Server vs. Client Tools

Anthropic categorizes tools into two distinct architectural execution models:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ANTHROPIC TOOLS TAXONOMY                        │
├───────────────────────────────────┬────────────────────────────────────┤
│     ANTHROPIC SERVER TOOLS        │       ANTHROPIC CLIENT TOOLS       │
├───────────────────────────────────┼────────────────────────────────────┤
│ • Executed by Anthropic Cloud     │ • Executed by Your Application     │
│ • Sandboxed on Anthropic Infra    │ • Sandboxed on Host / Container    │
│ • Returns results mid-turn        │ • Tool call emitted via tool_use   │
│ • Encrypted citation blocks       │ • Response returned via tool_result│
│ • Web Search, Code Execution      │ • Bash, Text Editor, Computer Use  │
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 2. Category A: Anthropic Server Tools

### 1. Web Search Tool
- **Tool Type Identifiers**: `web_search_20260318`, `web_search_20260209`, `web_search_20250305`
- **Beta Header**: `anthropic-beta: web-search-2025-03-05`
- **Execution**: Server-side by Anthropic.
- **Description**: Enables Claude to perform targeted web searches to answer questions about recent events, documentation, statistics, and live information.
- **Input Schema**:
  ```json
  {
    "type": "web_search_20250305",
    "name": "web_search",
    "max_uses": 5,
    "allowed_domains": ["github.com", "developer.mozilla.org"],
    "blocked_domains": ["untrusted-source.com"]
  }
  ```
- **Parameters**:
  - `query` (string, required): The search terms.
- **Output**: Returns parsed search snippets, URLs, titles, and `encrypted_content` blocks that must be preserved across multi-turn history to retain citation context.

### 2. Web Fetch Tool
- **Tool Type Identifiers**: `web_fetch_20260318`, `web_fetch_20260309`, `web_fetch_20260209`, `web_fetch_20250910`
- **Beta Header**: `anthropic-beta: web-fetch-2025-09-10`
- **Execution**: Server-side by Anthropic.
- **Description**: Fetches and extracts full text or PDF documents from specific URLs that have appeared in the conversation context.
- **Input Schema**:
  ```json
  {
    "type": "web_fetch_20250910",
    "name": "web_fetch",
    "max_content_size_tokens": 16000
  }
  ```
- **Constraint**: Claude can only fetch URLs mentioned in the prompt, previous turns, or web search results (cannot fabricate blind URLs).

### 3. Code Execution Tool
- **Tool Type Identifiers**: `code_execution_20260521`, `code_execution_20260120`, `code_execution_20250825`
- **Beta Header**: `anthropic-beta: code-execution-2025-08-25`
- **Execution**: Anthropic-managed isolated Python sandbox.
- **Description**: Runs Python code for mathematical calculations, dataset parsing (CSV/JSON), and dynamic filtering of tool outputs.
- **Input Schema**:
  ```json
  {
    "type": "code_execution_20250825",
    "name": "code_execution"
  }
  ```
- **Programmatic Tool Calling**: Claude can execute code that invokes other user-defined tools inside the container, reducing token overhead.

### 4. Advisor Tool
- **Tool Type Identifier**: `advisor_20260301`
- **Beta Header**: `anthropic-beta: advisor-tool-2026-03-01`
- **Description**: Allows a primary executor model (e.g. Sonnet 5.5) to consult a specialized advisor model (e.g. Opus 5.5) mid-generation within a single API turn for architectural validation.

### 5. Tool Search
- **Tool Type Identifiers**: `tool_search_tool_bm25_20251119`, `tool_search_tool_regex_20251119`
- **Beta Header**: `anthropic-beta: tool-search-2025-11-19`
- **Description**: Dynamically indexes large collections of tools using BM25 ranking or regex pattern matching, allowing Claude to retrieve only relevant tools on demand.

### 6. MCP Connector
- **Tool Type Identifier**: `mcp_toolset`
- **Description**: Integrates with Model Context Protocol (MCP) servers to expose external tools (GitHub, Slack, Google Drive, Postgres) directly to Claude.

---

## 3. Category B: Anthropic Client Tools

### 1. Memory Tool
- **Tool Type Identifier**: `memory_20250818`
- **Execution**: Application client.
- **Description**: Claude emits tool calls to save, retrieve, update, and delete long-term facts, preferences, and project context.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "action": { "type": "string", "enum": ["create", "read", "update", "delete"] },
      "key": { "type": "string" },
      "value": { "type": "string" }
    },
    "required": ["action", "key"]
  }
  ```

### 2. Bash Tool
- **Tool Type Identifier**: `bash_20250124`
- **Beta Header**: `anthropic-beta: computer-use-2024-10-22`
- **Execution**: Host / Docker container sandbox.
- **Description**: Executes terminal shell commands and returns `stdout` and `stderr`.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "command": { "type": "string", "description": "The command to run in the terminal." },
      "restart": { "type": "boolean", "description": "Restart the bash session." }
    },
    "required": ["command"]
  }
  ```

### 3. Text Editor Tool
- **Tool Type Identifier**: `text_editor_20250728`
- **Execution**: Host application file system.
- **Description**: String-replace based text editor for inspecting, creating, and modifying codebase files without rewriting entire documents.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "command": { "type": "string", "enum": ["view", "create", "str_replace", "insert", "undo_edit"] },
      "path": { "type": "string" },
      "file_text": { "type": "string" },
      "old_str": { "type": "string" },
      "new_str": { "type": "string" },
      "insert_line": { "type": "integer" },
      "view_range": { "type": "array", "items": { "type": "integer" } }
    },
    "required": ["command", "path"]
  }
  ```

### 4. Computer Use Tool
- **Tool Type Identifiers**: `computer_toolset_20260801`, `computer_20250124`, `computer_20241022`
- **Beta Header**: `anthropic-beta: computer-use-2024-10-22` or `computer-use-2025-01-24`
- **Execution**: Controlled virtual desktop environment.
- **Input Schema**:
  ```json
  {
    "type": "object",
    "properties": {
      "action": {
        "type": "string",
        "enum": [
          "key", "type", "mouse_move", "left_click", "left_click_drag",
          "right_click", "middle_click", "double_click", "screenshot", "cursor_position"
        ]
      },
      "coordinate": { "type": "array", "items": { "type": "integer" } },
      "text": { "type": "string" },
      "display_width_px": { "type": "integer" },
      "display_height_px": { "type": "integer" }
    },
    "required": ["action"]
  }
  ```

### 5. Browser Use Tool
- **Tool Type Identifier**: `browser_toolset_20260801`
- **Execution**: Isolated headless browser instance (Playwright / Chromium).
- **Description**: Navigates web applications, interacts with DOM elements, clicks buttons, fills out forms, and extracts page content.
