import Anthropic from "@anthropic-ai/sdk";

export const NOVA_TOOLS: Anthropic.Tool[] = [
  {
    name: "web_search",
    description:
      "Search the live web for recent news, up-to-date documentation, current events, articles, and real-time facts.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The targeted web search query.",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "web_fetch",
    description:
      "Fetch and extract readable text, article content, and information from a specific public webpage URL.",
    input_schema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The complete HTTP/HTTPS URL of the webpage to fetch.",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "execute_code",
    description:
      "Safely execute Python or JavaScript code in an isolated computational sandbox. Use for data analysis, math calculations, algorithms, or generating structured tables.",
    input_schema: {
      type: "object",
      properties: {
        language: {
          type: "string",
          enum: ["python", "javascript"],
          description: "Programming language to execute.",
        },
        code: {
          type: "string",
          description: "The complete executable code snippet.",
        },
      },
      required: ["language", "code"],
    },
  },
  {
    name: "create_artifact",
    description:
      "Create or update an interactive artifact (HTML app, React component, Mermaid diagram, SVG graphic, or code project) displayed in the dedicated split-screen side panel.",
    input_schema: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description: "Unique slug identifier for the artifact (e.g. 'budget-calculator', 'system-architecture').",
        },
        title: {
          type: "string",
          description: "User-facing title of the artifact.",
        },
        type: {
          type: "string",
          enum: [
            "text/html",
            "application/vnd.ant.react",
            "application/vnd.ant.code",
            "image/svg+xml",
            "application/vnd.ant.mermaid",
            "text/markdown",
          ],
          description: "MIME type of the artifact.",
        },
        language: {
          type: "string",
          description: "Programming language if type is code (e.g. 'python', 'javascript', 'typescript').",
        },
        content: {
          type: "string",
          description: "Complete source content of the artifact.",
        },
      },
      required: ["identifier", "title", "type", "content"],
    },
  },
];
