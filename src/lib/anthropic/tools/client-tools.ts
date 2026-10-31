export interface AnthropicClientToolDefinition {
  name: string;
  typeIdentifier: string;
  supportedVersions: string[];
  defaultVersion: string;
  betaHeader?: string;
  description: string;
  whatClaudeDoes: string;
  whatAppImplements: string;
  executionEnvironment: "Host Application File System" | "Local Process Sandbox" | "Virtual Desktop (X11)" | "Headless Browser (Playwright)";
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  supportedModels: string[];
  securityRequirements: string[];
  officialDocUrl: string;
}

export const ANTHROPIC_CLIENT_TOOLS: AnthropicClientToolDefinition[] = [
  {
    name: "memory",
    typeIdentifier: "memory",
    supportedVersions: ["memory_20250818"],
    defaultVersion: "memory_20250818",
    description: "Enables Claude to manage persistent user memory across turns by saving, retrieving, updating, and removing facts.",
    whatClaudeDoes: "Decides when important user information, rules, or preferences should be stored or recalled, and emits memory tool calls.",
    whatAppImplements: "Your application persists memory blocks into a database (PostgreSQL/Supabase or LocalStorage) and returns updated status.",
    executionEnvironment: "Host Application File System",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["create", "read", "update", "delete"] },
        key: { type: "string", description: "Identifier key for the memory entry." },
        value: { type: "string", description: "Content value to store." },
      },
      required: ["action", "key"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
      },
    },
    supportedModels: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229",
      "claude-sonnet-5-5",
      "claude-opus-5-5",
      "claude-haiku-5-5",
      "claude-fable-5-1",
    ],
    securityRequirements: [
      "Strict tenant isolation: never expose one user's memories to another.",
      "Sanitize memory strings to prevent prompt injection payloads.",
      "Allow user inspection and deletion of all saved memories in Settings.",
    ],
    officialDocUrl: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
  },
  {
    name: "bash",
    typeIdentifier: "bash",
    supportedVersions: ["bash_20250124"],
    defaultVersion: "bash_20250124",
    betaHeader: "computer-use-2024-10-22",
    description: "Executes shell commands in a local terminal or sandbox container to run builds, tests, or system utilities.",
    whatClaudeDoes: "Constructs terminal commands to inspect system state, compile packages, or run tests.",
    whatAppImplements: "Spawn an isolated shell subprocess with execution timeouts, resource limits, and environment variable shielding.",
    executionEnvironment: "Local Process Sandbox",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "The shell command string to execute." },
        restart: { type: "boolean", description: "Whether to restart the bash session." },
      },
      required: ["command"],
    },
    outputSchema: {
      type: "object",
      properties: {
        stdout: { type: "string" },
        stderr: { type: "string" },
        exit_code: { type: "integer" },
      },
    },
    supportedModels: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-sonnet-5-5",
      "claude-opus-5-5",
    ],
    securityRequirements: [
      "Execute only inside isolated Docker container or sandboxed environment.",
      "Block destructive commands (rm -rf /, format, fork bombs).",
      "Timeout long-running tasks after 30 seconds.",
    ],
    officialDocUrl: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
  },
  {
    name: "text_editor",
    typeIdentifier: "text_editor",
    supportedVersions: ["text_editor_20250728"],
    defaultVersion: "text_editor_20250728",
    betaHeader: "computer-use-2024-10-22",
    description: "String-replace based text editor for inspecting, creating, and modifying codebase files without rewriting entire documents.",
    whatClaudeDoes: "Issues targeted file view or replace commands specifying exact substrings to substitute.",
    whatAppImplements: "Reads target files on disk, verifies unique string matches, applies replacements, and saves file diffs.",
    executionEnvironment: "Host Application File System",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", enum: ["view", "create", "str_replace", "insert", "undo_edit"] },
        path: { type: "string", description: "Relative path to target file." },
        file_text: { type: "string", description: "File content when creating a file." },
        old_str: { type: "string", description: "Exact target substring to replace." },
        new_str: { type: "string", description: "Replacement text to insert." },
        insert_line: { type: "integer", description: "Line number where text should be inserted." },
        view_range: { type: "array", items: { type: "integer" }, description: "Line range [start, end] to view." },
      },
      required: ["command", "path"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        output: { type: "string" },
      },
    },
    supportedModels: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-sonnet-5-5",
      "claude-opus-5-5",
    ],
    securityRequirements: [
      "Restrict operations strictly within the project workspace directory.",
      "Prevent path traversal (e.g. ../../etc/passwd).",
      "Backup files prior to applying edits to permit undo.",
    ],
    officialDocUrl: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
  },
  {
    name: "computer_use",
    typeIdentifier: "computer_toolset",
    supportedVersions: ["computer_toolset_20260801", "computer_20250124", "computer_20241022"],
    defaultVersion: "computer_20250124",
    betaHeader: "computer-use-2025-01-24",
    description: "Allows Claude to interact with a controlled virtual desktop via mouse movements, clicks, keystrokes, and screenshots.",
    whatClaudeDoes: "Examines desktop screenshots, plans GUI interactions, and emits mouse coordinates and keyboard input.",
    whatAppImplements: "Interfaces with a virtual desktop (X11 / VNC) to dispatch mouse/keyboard events and take screenshots as base64 images.",
    executionEnvironment: "Virtual Desktop (X11)",
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: [
            "key", "type", "mouse_move", "left_click", "left_click_drag",
            "right_click", "middle_click", "double_click", "screenshot", "cursor_position"
          ],
        },
        coordinate: { type: "array", items: { type: "integer" }, description: "[x, y] screen coordinates." },
        text: { type: "string", description: "Text to type into focused input." },
        display_width_px: { type: "integer", default: 1024 },
        display_height_px: { type: "integer", default: 768 },
      },
      required: ["action"],
    },
    outputSchema: {
      type: "object",
      properties: {
        base64_image: { type: "string" },
        output: { type: "string" },
      },
    },
    supportedModels: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-sonnet-5-5",
      "claude-opus-5-5",
    ],
    securityRequirements: [
      "Virtual desktop must be strictly isolated from personal desktop.",
      "Prompt confirmation required for sensitive actions (payments, account deletes).",
      "Never feed password or confidential login credentials directly to Claude.",
    ],
    officialDocUrl: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
  },
  {
    name: "browser_use",
    typeIdentifier: "browser_toolset",
    supportedVersions: ["browser_toolset_20260801"],
    defaultVersion: "browser_toolset_20260801",
    betaHeader: "browser-use-2026-08-01",
    description: "Drives an isolated browser to navigate websites, click elements, fill forms, and complete multi-step online workflows.",
    whatClaudeDoes: "Directs page navigation, reads rendered DOM snapshots, clicks buttons, and extracts page content.",
    whatAppImplements: "Connects to a headless browser automation engine (Playwright / Chromium) and executes navigation commands safely.",
    executionEnvironment: "Headless Browser (Playwright)",
    inputSchema: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["navigate", "click", "type", "scroll", "extract", "screenshot"] },
        url: { type: "string" },
        selector: { type: "string" },
        text: { type: "string" },
      },
      required: ["action"],
    },
    outputSchema: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        page_title: { type: "string" },
        extracted_content: { type: "string" },
        screenshot_base64: { type: "string" },
      },
    },
    supportedModels: [
      "claude-3-7-sonnet-20250219",
      "claude-3-5-sonnet-20241022",
      "claude-sonnet-5-5",
      "claude-opus-5-5",
    ],
    securityRequirements: [
      "Block internal network access (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, 169.254.169.254).",
      "Clear session cookies and storage after browser session completes.",
      "Ask before financial transactions or contract submissions.",
    ],
    officialDocUrl: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview",
  },
];
