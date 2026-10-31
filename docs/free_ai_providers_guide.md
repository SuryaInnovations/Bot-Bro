# NOVA AI — Free AI Providers Architecture & Integration Guide

## 1. Overview & Zero-Cost Philosophy

NOVA AI has transitioned completely from a paid-only Anthropic Claude architecture to an intelligent **Multi-Tier Free AI Provider Router**.

Users can now interact with NOVA AI for conversational intelligence, code execution, web search, multi-agent swarms, document analysis, and daily intelligence **without requiring paid Anthropic credits or credit card charges**.

---

## 2. Integrated Free AI Providers

| Tier | Provider | Flagship Model | Free Rate Limits | Latency | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Primary** | **Google Gemini** | `gemini-flash-lite-latest` | 15 RPM / 1,500 RPD | ~400ms | 1M Context, Function Calling, Multimodal, Vision |
| **Secondary** | **Groq LPU** | `openai/gpt-oss-120b` | 30 RPM / 14,400 RPD | ~150ms | Ultra-fast token streaming, Deep Reasoning, Tools |
| **Tertiary** | **OpenRouter Free** | `liquid/lfm-2.5-2.6b:free` | 20 RPM / 200 RPD | ~500ms | Zero-cost foundation models (`:free` safeguard) |
| **Local** | **Ollama AI** | `llama3.2:latest` | **Unlimited** (Local) | Device-dependent | 100% offline privacy, zero egress, infinite quota |
| **Legacy** | **Anthropic** | `claude-3-7-sonnet` | Custom Key Only | ~800ms | Optional; only if user enters their own funded key |

---

## 3. Intelligent Multi-Tier Provider Router

The Provider Router (`src/lib/providers/provider-router.ts`) acts as the central traffic controller:

```
[Incoming User Request]
         │
         ▼
[Request Sanitizer & Accuracy Analysis]
         │
         ▼
[Attempt 1: Google Gemini Free Tier] ──(HTTP 200)──► [Stream to User]
         │ (On 429 Rate Limit or 503 Spike)
         ▼
[Attempt 2: Groq Ultra-Fast LPU] ─────(HTTP 200)──► [Stream to User]
         │ (On 429 / Daily Limit)
         ▼
[Attempt 3: OpenRouter Free Models] ──(HTTP 200)──► [Stream to User]
         │ (On Network / Offline)
         ▼
[Attempt 4: Local Ollama (if online)] ─(HTTP 200)──► [Stream to User]
```

### Key Router Features:
1. **Zero-Cost Safeguard**: OpenRouter requests are strictly filtered by `enforceFreeModelOnly()`. Any attempt to request a model without the `:free` suffix is automatically redirected to a verified zero-cost free model.
2. **Context Preservation**: During an automatic failover, conversation history, attachments, and system instructions are preserved seamlessly across provider schemas.
3. **Transparent Notification**: Emits a `provider_switch` event so the user is informed when traffic is gracefully rerouted due to provider load.

---

## 4. Environment Variables Configuration

In `.env.local`:

```bash
# 1. Primary: Google Gemini Free API Key (Get at https://aistudio.google.com)
GEMINI_API_KEY=your_gemini_api_key_here

# 2. Secondary: Groq LPU Free API Key (Get at https://console.groq.com)
GROQ_API_KEY=your_groq_api_key_here

# 3. Tertiary: OpenRouter Free API Key (Get at https://openrouter.ai/keys)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# 4. Local AI: Ollama Endpoint
OLLAMA_BASE_URL=http://localhost:11434
```

---

## 5. Tool & Function Calling Compatibility

Both Gemini and Groq are fully wired into NOVA AI's tool execution framework:
- **`web_search`**: Live DuckDuckGo web search with citation extraction.
- **`web_fetch`**: HTTP webpage scraper with HTML-to-markdown text extraction.
- **`execute_code`**: Isolated Node.js VM & Python computational sandbox.
- **`create_artifact`**: Dynamic split-screen artifact generator (React, HTML, SVG, Mermaid).

Tool responses are translated dynamically to each provider's expected format:
- Gemini: `functionDeclarations` + `functionResponse`
- Groq: OpenAI-standard `tools` + `tool_calls` + `role: "tool"`

---

## 6. Privacy & Free-Tier Data Policies

- **Google Gemini & Free Tier APIs**: Cloud free tiers may use prompts and completions to improve model quality under standard terms of service.
- **Privacy Mode with Ollama**: For sensitive code, financial records, or confidential documentation, users can start Ollama locally (`ollama run llama3.2`). NOVA AI detects Ollama automatically, keeping 100% of the inference and data on the local machine with zero external network egress.
