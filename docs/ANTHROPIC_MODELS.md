# Anthropic Claude Models: Comprehensive Technical Reference & Catalogue

*Last Verified Against Official Documentation: October 2026*  
*Official Source: [https://platform.claude.com/docs/en/about-claude/models/overview](https://platform.claude.com/docs/en/about-claude/models/overview)*

---

## 1. Overview of Claude Model Families

Anthropic structures the Claude model family across specialized tiers optimized for distinct intelligence, speed, context capacity, and cost profiles:

1. **Opus Tier (Deep Reasoning & Multi-Agent Horizons)**: Maximum intelligence, deep multi-step analysis, complex scientific reasoning, and autonomous agent orchestration.
2. **Sonnet Tier (Flagship Intelligence & Coding)**: The industry standard for software engineering, tool execution, multimodal comprehension, and enterprise productivity.
3. **Haiku Tier (High Throughput & Rapid Turnaround)**: Ultra-fast latency, high token throughput, cost-efficiency, and high-frequency classification or routing.
4. **Fable Tier (Long-Horizon Agentic Planning)**: Specialized for extended multi-step trajectories, self-correction, and tool orchestration.

---

## 2. Complete Model Catalogue

| Model Name | Exact API Model ID | Context Window | Max Output Tokens | Thinking Support | Vision Support | Tool Use | Input Cost / 1M | Output Cost / 1M | Lifecycle Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Claude Opus 5.5** | `claude-opus-5-5` | 200,000 | 64,000 | Yes (Extended) | Yes | Yes | $5.00 | $25.00 | Active (Frontier) |
| **Claude Sonnet 5.5** | `claude-sonnet-5-5` | 200,000 | 64,000 | Yes (Dynamic) | Yes | Yes | $3.00 | $15.00 | Active (Flagship) |
| **Claude Haiku 5.5** | `claude-haiku-5-5` | 200,000 | 8,192 | No | Yes | Yes | $0.80 | $4.00 | Active (Fast) |
| **Claude Fable 5.1** | `claude-fable-5-1` | 200,000 | 32,000 | Yes (Adaptive) | Yes | Yes | $4.00 | $20.00 | Active (Agentic) |
| **Claude 3.7 Sonnet** | `claude-3-7-sonnet-20250219` | 200,000 | 64,000 (128k beta) | Yes (Hybrid) | Yes | Yes | $3.00 | $15.00 | Active |
| **Claude 3.5 Sonnet** | `claude-3-5-sonnet-20241022` | 200,000 | 8,192 | No | Yes | Yes | $3.00 | $15.00 | Active |
| **Claude 3.5 Haiku** | `claude-3-5-haiku-20241022` | 200,000 | 8,192 | No | Yes | Yes | $0.80 | $4.00 | Active |
| **Claude 3 Opus** | `claude-3-opus-20240229` | 200,000 | 4,096 | No | Yes | Yes | $15.00 | $75.00 | Active (Legacy) |

---

## 3. Detailed Model Specifications

### A. Claude 3.7 Sonnet (`claude-3-7-sonnet-20250219`)
- **Family**: Sonnet
- **Primary Use Cases**: Hybrid reasoning, high-complexity software engineering, full-stack application development, multi-tool agentic workflows.
- **Reasoning Capabilities**: Dynamic hybrid reasoning allowing the model to choose between instantaneous answers or variable extended thinking (up to 128,000 tokens with beta header `output-128k-2025-02-19`).
- **Input Modalities**: Text, Images (JPEG, PNG, GIF, WEBP), Documents (PDF).
- **Output Modalities**: Text, Structured JSON, Tool Calls, Thinking blocks.
- **Vision Support**: High-resolution image understanding, chart parsing, architectural diagram analysis.
- **Thinking Configuration**:
  ```json
  "thinking": {
    "type": "enabled",
    "budget_tokens": 4096
  }
  ```
- **Prompt Caching**: Supported (Cache read: $0.30/1M, Cache write: $3.75/1M).

### B. Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
- **Family**: Sonnet
- **Primary Use Cases**: Production coding, technical documentation, complex reasoning, Computer Use agents.
- **Context Window**: 200,000 tokens.
- **Max Output Tokens**: 8,192 tokens.
- **Computer Use Support**: Yes (Requires `anthropic-beta: computer-use-2024-10-22` or `computer-use-2025-01-24`).
- **Vision Support**: Industry-leading multimodal reasoning.

### C. Claude 3.5 Haiku (`claude-3-5-haiku-20241022`)
- **Family**: Haiku
- **Primary Use Cases**: Real-time customer chat, instant classification, code completion, fast summarization.
- **Context Window**: 200,000 tokens.
- **Max Output Tokens**: 8,192 tokens.
- **Speed**: Sub-second TTFT (Time To First Token).
- **Thinking Support**: No.

### D. Claude 3 Opus (`claude-3-opus-20240229`)
- **Family**: Opus
- **Primary Use Cases**: Deep philosophical and literary reasoning, multi-turn open-ended research.
- **Context Window**: 200,000 tokens.
- **Max Output Tokens**: 4,096 tokens.

---

## 4. Dynamic Model Discovery API

Anthropic provides the Models endpoint to retrieve real-time metadata and availability:

### Endpoint
`GET https://api.anthropic.com/v1/models`

### Request Headers
```http
GET /v1/models?limit=20&lifecycle=active HTTP/1.1
Host: api.anthropic.com
x-api-key: your-api-key
anthropic-version: 2023-06-01
```

### Parameters
- `limit` (integer, 1-1000): Number of models per page (default: 20).
- `after_id` (string): Cursor identifier for forward pagination.
- `before_id` (string): Cursor identifier for backward pagination.
- `lifecycle` (string array): Filter by lifecycle stage (`active`, `deprecated`, `retired`).

### Response Example
```json
{
  "data": [
    {
      "type": "model",
      "id": "claude-3-7-sonnet-20250219",
      "display_name": "Claude 3.7 Sonnet",
      "created_at": "2025-02-19T00:00:00Z"
    },
    {
      "type": "model",
      "id": "claude-3-5-sonnet-20241022",
      "display_name": "Claude 3.5 Sonnet",
      "created_at": "2024-10-22T00:00:00Z"
    }
  ],
  "has_more": false,
  "first_id": "claude-3-7-sonnet-20250219",
  "last_id": "claude-3-5-sonnet-20241022"
}
```
