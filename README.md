# NOVA AI — Production Claude-Powered AI Assistant

**NOVA AI** is an advanced, production-ready AI assistant powered directly by the **Official Anthropic Claude API**. Inspired by the minimalist, warm, and distraction-free design philosophy of Claude.ai, NOVA AI delivers deep reasoning, interactive split-screen artifacts, sandboxed code execution, live web search with citations, multi-format document analysis, project knowledge bases, and persistent assistant memory.

---

## 🌟 Key Features

### 1. Official Anthropic Messages API Integration
- Powered by official `@anthropic-ai/sdk`.
- Real-time Server-Sent Events (SSE) streaming (`POST /api/chat`).
- Dynamic hybrid reasoning support (Claude 3.7 Sonnet Extended Thinking).
- Configurable models:
  - **Claude 3.7 Sonnet** (Hybrid reasoning, smartest coding)
  - **Claude 3.5 Sonnet** (Balanced speed & intelligence)
  - **Claude 3.5 Haiku** (Lightning fast turnaround)
  - **Claude 3 Opus** (Deep analytical context)
  - **Nova Tier Models** (Opus 5.5, Sonnet 5.5, Haiku 5.5)
- Tool calling loops: autonomously invokes web search, webpage fetching, code execution, and artifact creation.

### 2. Split-Screen Artifacts Workspace
- Interactive right-side panel for standalone creations.
- Sandboxed isolated `<iframe>` environment with `allow-scripts allow-modals allow-forms`.
- Supports:
  - **HTML/JS/CSS** (interactive dashboards, calculators, mini-games)
  - **React Components** (live JSX rendering via Babel)
  - **SVG Vector Graphics**
  - **Mermaid Diagrams**
  - **Markdown Documents**
- Tab switcher between **Live Preview** and **Code View**.
- Copy, download, full-screen, and version history.

### 3. Live Web Search & Web Fetch
- Claude searches the live web for breaking news, current documentation, and time-sensitive facts.
- Fetches webpage content, parses readable text, and extracts summaries.
- Clickable citation pills with domain attribution, titles, and snippets.

### 4. Sandboxed Code Execution
- Runs Python or JavaScript code safely in an isolated environment.
- Captures `stdout`, `stderr`, execution time, and mathematical/statistical outputs.
- Returns structured results back into Claude's multi-step tool reasoning loop.

### 5. Multi-Format File Upload & Document Analysis
- **PDF**: Text and tabular extraction via `pdf-parse`.
- **Word (.docx)**: Document text extraction via `mammoth`.
- **Excel (.xlsx, .xls, .csv)**: Sheet-by-sheet conversion via `xlsx`.
- **Images (.png, .jpeg, .webp, .gif)**: Base64 multimodal visual analysis using Claude Vision.
- **Code & Text (.txt, .json, .xml, .md)**: Direct text buffer parsing.

### 6. Projects & Knowledge Base
- Create isolated projects with custom system prompts, rules, and domain context.
- Group related conversations under specific projects.

### 7. Persistent Assistant Memory
- Remembers user preferences, facts, and guidelines across sessions.
- Inspect, add, edit, or delete memories at any time from Settings.

### 8. Enterprise Security & Database
- Production Supabase SQL schema (`src/lib/supabase/schema.sql`) with Row-Level Security (RLS).
- Private data isolation per user.
- Resilient local storage fallback active by default for instant zero-config launch.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Anthropic API Key**: Get one at [console.anthropic.com](https://console.anthropic.com/)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env.local` in the project root:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_DEFAULT_MODEL=claude-3-7-sonnet-20250219

# Optional: Supabase Database (Local storage fallback is active by default)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: Brave Search API
BRAVE_SEARCH_API_KEY=
```
> **Note**: You can also enter your Anthropic API Key directly in the application UI under **Settings → API & Usage**!

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🗄️ Database Setup (Supabase)

To connect Supabase for remote multi-device sync and authentication:
1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open `src/lib/supabase/schema.sql` from this repository and run the entire script.
4. Add your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.

---

## 🛡️ Security Architecture
- **API Key Protection**: Server-side Route Handlers (`/api/chat`) execute all Anthropic API calls. Credentials are never exposed to browser client JavaScript.
- **Iframe Sandboxing**: Generated user/artifact scripts run inside a sandboxed iframe with strict boundaries preventing access to the host app DOM or localStorage.
- **Code Execution Isolation**: Arbitrary execution is sandboxed with execution time limits and restricted scopes.

---

## ⌨️ Keyboard Shortcuts
| Shortcut | Action |
| --- | --- |
| `Enter` | Send message |
| `Shift + Enter` | New line in composer |
| `Ctrl / Cmd + K` | Search conversations and messages |
| `Ctrl / Cmd + Shift + O` | Start a new chat |
| `Esc` | Close open dialog or search modal |
