# NOVA AI — PRODUCTION DEPLOYMENT & PUBLIC BETA LAUNCH GUIDE

**Document Version**: 2.0.0 (Production Release)  
**Target Release**: NOVA AI Controlled Public Beta  
**Engine**: Official Anthropic Claude Messages API (Claude 3.7 Sonnet Dynamic Hybrid Reasoning)  
**Architecture**: Unified Single Conversational Interface (Zero Left-Rail Clutter, 9 Invisible Internal Subsystems)  
**Database**: Supabase PostgreSQL with strict Row Level Security (RLS)  

---

## 1. EXECUTIVE SUMMARY & PRE-FLIGHT CHECKLIST

Before opening NOVA AI to external beta users, verify the following 10 pre-flight milestones:

- [x] **Left Navigation Rail Removed**: Single chat interface is the primary and only visual focus; zero left-side dead space; sidebar collapses cleanly to the edge.
- [x] **Zero Secret Leakage**: `sanitizeClientResponse` blocks `ANTHROPIC_API_KEY`, service role keys, and scrypt hashes from ever reaching the client bundle or network responses.
- [x] **Production Build Verified**: Next.js 14 compiled 42 routes cleanly with zero static generation warnings or TypeScript errors.
- [x] **Automated Test Suite**: 204 automated unit & live integration tests passing with 0 failures across 39 test suites.
- [x] **Database Isolation (RLS)**: PostgreSQL `auth.uid() = user_id` policies active across all 10 user tables.
- [x] **Health Check Endpoint**: `/api/health` reports status, provider latencies, uptime, and memory statistics.
- [x] **Telemetry & Metrics**: `/api/monitoring/metrics` tracks token consumption, latency, and security events.
- [x] **Feedback Collection**: `/api/feedback` ready to receive bug reports and feature requests during beta.
- [x] **Onboarding Experience**: First-time onboarding modal greets public beta participants.
- [x] **Legal Disclaimers**: Public `/privacy` and `/terms` routes live.

---

## 2. PRODUCTION ARCHITECTURE OVERVIEW

```
                               ┌─────────────────────────────┐
                               │   End User (Desktop/Mobile) │
                               └──────────────┬──────────────┘
                                              │ HTTPS (Port 443)
                                              ▼
                               ┌─────────────────────────────┐
                               │  NGINX / Vercel Edge Proxy  │
                               └──────────────┬──────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
       ┌──────────────────────────────┐              ┌─────────────────────────────────┐
       │     Single Chat UI (Next.js) │              │ REST & SSE API Layer (/api/*)   │
       │   - Model Selector           │              │   - /api/chat (SSE Stream)      │
       │   - History & Search         │              │   - /api/health                 │
       │   - Personal Workspace 2.0   │              │   - /api/workspace/*            │
       │   - No Left Rail Clutter     │              │   - /api/monitoring/metrics     │
       └──────────────┬───────────────┘              └────────────────┬────────────────┘
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              ▼
                             ┌─────────────────────────────────┐
                             │ Unified Conversational Engine   │
                             │  (Intent Classifier & Router)   │
                             └────────────────┬────────────────┘
                                              │
         ┌──────────────────┬─────────────────┼──────────────────┬──────────────────┐
         ▼                  ▼                 ▼                  ▼                  ▼
┌─────────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────────────┐ ┌────────────────┐
│ Anthropic Claude│ │ Real-Time Data│ │ Vector Engine │ │ 7-Agent Swarm  │ │ Supabase RLS   │
│ 3.7 Sonnet API  │ │ Weather/News/ │ │ 128-Dim Hybrid│ │ Multi-Agent    │ │ PostgreSQL DB  │
│ Extended Budget │ │ Bullion Spot  │ │ BM25 Retrieval│ │ Execution      │ │ User Isolation │
└─────────────────┘ └───────────────┘ └───────────────┘ └────────────────┘ └────────────────┘
```

---

## 3. HOSTING & DEPLOYMENT INSTRUCTIONS

### Option A: Standard Node.js Linux VM (Ubuntu 22.04 LTS / 24.04 LTS)

1. **System Provisioning**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y curl git nginx build-essential
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm install -g pm2
   ```

2. **Clone & Configure**:
   ```bash
   git clone https://github.com/your-org/nova-ai.git /var/www/nova-ai
   cd /var/www/nova-ai
   cp .env.production.example .env.local
   # Edit .env.local with production credentials:
   nano .env.local
   ```

3. **Install & Build**:
   ```bash
   npm ci
   npm run build
   ```

4. **Launch with PM2 Daemon**:
   ```bash
   pm2 start npm --name "nova-ai-prod" -- start
   pm2 save
   pm2 startup
   ```

5. **NGINX Reverse Proxy Configuration (`/etc/nginx/sites-available/nova.ai`)**:
   ```nginx
   server {
       listen 80;
       server_name nova.ai www.nova.ai;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name nova.ai www.nova.ai;

       ssl_certificate /etc/letsencrypt/live/nova.ai/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/nova.ai/privkey.pem;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;

           # Required for SSE chat streaming
           proxy_buffering off;
           proxy_cache off;
           proxy_read_timeout 300s;
       }
   }
   ```

### Option B: Docker Container Deployment

1. **Build Container**:
   ```bash
   docker build -t nova-ai:beta .
   ```

2. **Run Container**:
   ```bash
   docker run -d \
     --name nova-ai-app \
     -p 3000:3000 \
     --env-file .env.local \
     --restart always \
     nova-ai:beta
   ```

---

## 4. DATABASE & SUPABASE MIGRATIONS

Run the production schema migration script located at `src/lib/supabase/schema.sql` inside the Supabase SQL Editor:
- Enables Row Level Security on `conversations`, `messages`, `artifacts`, `user_memories`, `personal_tasks`, `personal_reminders`, `calendar_events`, `email_messages`, `monitored_topics`, and `background_jobs`.
- Installs composite performance indexes:
  - `idx_messages_conversation_created`
  - `idx_tasks_user_deadline`
  - `idx_reminders_trigger_completed`
  - `idx_events_user_start`

---

## 5. MONITORING & ALERTING RUNBOOK

| Endpoint | Probe Interval | Expected Response | Alert Trigger |
| :--- | :--- | :--- | :--- |
| `GET /api/health` | Every 60s | HTTP 200 `{"status":"healthy"}` | HTTP status $\neq 200$ for 2 consecutive cycles |
| `GET /api/monitoring/metrics` | Every 5m | HTTP 200 telemetry JSON | Error rate $> 2.0\%$ or p95 latency $> 2,000\text{ms}$ |
| `GET /api/feedback` | Daily | HTTP 200 feedback list | Unresolved severity "bug" reports |

---

## 6. PUBLIC BETA ROLLOUT & FEEDBACK STRATEGY

1. **Cohort 1 (Day 1–3)**: 50 invited internal and developer users. Validate Anthropic streaming tokens, voice synthesis, and multi-format export.
2. **Cohort 2 (Day 4–7)**: 500 early-access community members. Verify rate limits, cross-document Q&A, and mobile UX.
3. **Public Beta Launch (Day 8+)**: Open registration with default quota tiering.
