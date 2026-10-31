# Anthropic Claude API Features: Architecture & Capabilities

*Last Verified: October 2026*  
*Official Source: [https://platform.claude.com/docs/en/api/overview](https://platform.claude.com/docs/en/api/overview)*

---

## 1. Messages API & Streaming

The Messages API (`POST https://api.anthropic.com/v1/messages`) is Anthropic's primary conversational endpoint.

### Streaming Protocol
Streaming is enabled by passing `"stream": true`. Responses arrive as Server-Sent Events (SSE):
- `message_start`: Initial message metadata and model info.
- `content_block_start`: Begins a content block (`text`, `thinking`, `tool_use`).
- `content_block_delta`: Streaming deltas:
  - `text_delta`: `{ "type": "text_delta", "text": "..." }`
  - `thinking_delta`: `{ "type": "thinking_delta", "thinking": "..." }`
  - `input_json_delta`: `{ "type": "input_json_delta", "partial_json": "..." }`
- `content_block_stop`: Closes the active block.
- `message_delta`: Contains `stop_reason` and token usage metrics.
- `message_stop`: Concludes the SSE stream.

---

## 2. Extended Thinking & Adaptive Effort

Claude 3.7 Sonnet introduces hybrid reasoning:

```json
{
  "model": "claude-3-7-sonnet-20250219",
  "max_tokens": 16000,
  "thinking": {
    "type": "enabled",
    "budget_tokens": 2048
  },
  "messages": [...]
}
```

- **Budget Tokens**: Minimum 1,024 tokens. `max_tokens` must always exceed `budget_tokens`.
- **Adaptive Thinking**: When configured without a fixed token cap, Claude dynamically allocates reasoning depth based on problem complexity.

---

## 3. Prompt Caching

Anthropic's prompt caching reduces latency and provides up to **90% cost savings** on large repetitive prompts (codebases, documentation, system prompts).

### Implementation
Add `"cache_control": { "type": "ephemeral" }` to system prompts, documents, or message blocks:
```json
{
  "role": "user",
  "content": [
    {
      "type": "text",
      "text": "Detailed codebase documentation ...",
      "cache_control": { "type": "ephemeral" }
    },
    {
      "type": "text",
      "text": "How do I add a new route?"
    }
  ]
}
```

---

## 4. Token Counting API

Anthropic provides a token counting endpoint to estimate costs before submission:
`POST https://api.anthropic.com/v1/messages/count_tokens`

```json
{
  "model": "claude-3-7-sonnet-20250219",
  "messages": [{ "role": "user", "content": "Hello world" }]
}
```
Returns: `{ "input_tokens": 12 }`.

---

## 5. Structured Outputs & JSON Schema

Guarantee strict schema-compliant JSON outputs:
```json
{
  "tools": [
    {
      "name": "extract_user_info",
      "description": "Extract structured user information",
      "input_schema": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "email": { "type": "string" },
          "role": { "type": "string", "enum": ["admin", "member", "guest"] }
        },
        "required": ["name", "email", "role"]
      }
    }
  ],
  "tool_choice": { "type": "tool", "name": "extract_user_info" }
}
```

---

## 6. Multimodal Inputs (Images & PDFs)

- **Images**: Base64 encoded JPEG, PNG, GIF, WEBP up to 5MB.
- **Documents (PDF)**:
  ```json
  {
    "type": "document",
    "source": {
      "type": "base64",
      "media_type": "application/pdf",
      "data": "..."
    }
  }
  ```
