# Anthropic Claude API Code Examples (TypeScript & cURL)

*Last Verified: October 2026*  
*Official Source: [https://platform.claude.com/docs/en/api/overview](https://platform.claude.com/docs/en/api/overview)*

---

## 1. Real-Time Streaming with Extended Thinking (TypeScript)

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function runStreamingWithThinking() {
  const stream = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 16000,
    thinking: {
      type: "enabled",
      budget_tokens: 2048,
    },
    messages: [
      {
        role: "user",
        content: "Prove why the square root of 2 is irrational step by step.",
      },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    if (chunk.type === "content_block_delta" && chunk.delta.type === "thinking_delta") {
      process.stdout.write(`[Thinking] ${chunk.delta.thinking}`);
    } else if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
      process.stdout.write(chunk.delta.text);
    }
  }
}
```

---

## 2. Invoking Native Server Tools (Web Search & Code Execution)

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function runServerTools() {
  const response = await anthropic.messages.create({
    model: "claude-3-7-sonnet-20250219",
    max_tokens: 8192,
    extra_headers: {
      "anthropic-beta": "web-search-2025-03-05,code-execution-2025-08-25",
    },
    tools: [
      {
        type: "web_search_20250305" as any,
        name: "web_search",
      },
      {
        type: "code_execution_20250825" as any,
        name: "code_execution",
      },
    ],
    messages: [
      {
        role: "user",
        content: "What were the top 3 tech acquisitions this month? Calculate their combined value in Python.",
      },
    ],
  });

  console.log(JSON.stringify(response.content, null, 2));
}
```

---

## 3. Client Tool Execution Loop (Bash & File Editor)

```typescript
import Anthropic from "@anthropic-ai/sdk";
import { execSync } from "child_process";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function runAgentLoop() {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: "List the files in the current directory and count lines in package.json." },
  ];

  const tools: Anthropic.Tool[] = [
    {
      name: "bash",
      description: "Execute bash commands in a local isolated sandbox.",
      input_schema: {
        type: "object",
        properties: {
          command: { type: "string" },
        },
        required: ["command"],
      },
    },
  ];

  let keepGoing = true;

  while (keepGoing) {
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 4096,
      tools,
      messages,
    });

    // Check if Claude requested tool calls
    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "tool_use" && block.name === "bash") {
          const input = block.input as { command: string };
          let stdout = "";
          try {
            stdout = execSync(input.command, { encoding: "utf-8", timeout: 5000 });
          } catch (err: any) {
            stdout = err.message;
          }

          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: stdout,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    } else {
      console.log("Final response:", response.content[0]);
      keepGoing = false;
    }
  }
}
```

---

## 4. Models API Discovery (cURL)

```bash
curl https://api.anthropic.com/v1/models \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```
