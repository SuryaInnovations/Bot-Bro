# NOVA AI — Enterprise Capacity Planning for 100,000 Concurrent Users

**Document Version**: 2.0.0 (Enterprise Architecture Specification)  
**Target Concurrency**: 100,000 Simultaneously Active Users  
**System Target**: 24/7 High Availability (99.99% SLA), Maximum Answer Accuracy, Single Conversational Interface  

---

## 1. Executive Summary & Concurrency Model

NOVA AI is architected as a stateless, horizontally scalable conversational enterprise platform. To support **100,000 concurrent active users** without degradation or artificial usage interruptions, the system decouples client connections from external LLM processing via distributed fair queuing, connection pooling, multi-tier caching, and asynchronous SSE streaming.

### Key Traffic Assumptions & Calculations

| Metric | Dimension | Formula / Value |
| :--- | :--- | :--- |
| **Total Active Concurrent Users ($U_{active}$)** | User Population | $100,000$ simultaneous sessions |
| **Active Turn Concurrency Ratio ($R_{flight}$)** | % users generating prompts concurrently | $2.5\% - 5.0\%$ (Industry benchmark for chat) |
| **In-Flight Active Streams ($S_{flight}$)** | Active streaming SSE connections | $2,500 - 5,000$ concurrent streams |
| **Peak Requests Per Second ($RPS_{peak}$)** | Inbound API calls | $5,000 - 10,000\text{ RPS}$ |
| **Sustained Requests Per Second ($RPS_{sustained}$)** | Steady-state load | $2,000 - 3,500\text{ RPS}$ |
| **Average Prompt Length** | Input tokens | $1,200\text{ tokens}$ |
| **Average Response Length** | Output tokens | $450\text{ tokens}$ |
| **Peak Token Consumption** | Anthropic Claude API | $6,000,000\text{ input tokens/min}$, $2,250,000\text{ output tokens/min}$ |
| **Stream Bandwidth per Active Stream** | SSE egress rate | $1.5\text{ KB/s}$ ($12\text{ kbps}$) |
| **Total Network Egress (Streams)** | Peak bandwidth | $5,000 \times 1.5\text{ KB/s} = 7.5\text{ MB/s} = 60\text{ Mbps}$ (Burst: $120\text{ Mbps}$) |

---

## 2. Distributed Architecture Topology

```
                  ┌──────────────────────────────────────────────┐
                  │   Cloudflare Enterprise CDN & Anycast DNS    │
                  │   • DDoS Protection  • TLS 1.3 Termination   │
                  │   • Static Asset Caching (JS Chunks, CSS)    │
                  └──────────────────────┬───────────────────────┘
                                         │
                  ┌──────────────────────▼───────────────────────┐
                  │    AWS Application Load Balancer (ALB)       │
                  │    • Least-Connections • Path-Based Routing  │
                  └──────────┬────────────────────────┬──────────┘
                             │                        │
         ┌───────────────────▼──┐                  ┌──▼───────────────────┐
         │ Kubernetes Worker Pod│                  │ Kubernetes Worker Pod│
         │ Node 01 (Stateless)  │  • • • (40 Pods) │ Node 40 (Stateless)  │
         │ Next.js 14 API + SSE │                  │ Next.js 14 API + SSE │
         └──────────┬───────────┘                  └──┬───────────────────┘
                    │                                 │
     ┌──────────────┴─────────────────────────────────┴──────────────┐
     │                                                               │
┌────▼──────────────────────────┐           ┌────────────────────────▼───┐
│ Distributed Fair Queue (Redis)│           │ Multi-Tier Cache Cluster   │
│ • Deficit Round Robin per user│           │ • L1 In-Memory LRU (Node)  │
│ • Token Bucket Backpressure   │           │ • L2 Redis Cluster (32 GB) │
│ • Priority: Chat > Batch Jobs │           │ • Semantic & Session Cache │
└────┬──────────────────────────┘           └────────────────────────┬───┘
     │                                                               │
┌────▼──────────────────────────┐           ┌────────────────────────▼───┐
│ PgBouncer Connection Pool     │           │ Resilient Claude API Engine│
│ • Transaction Mode (350 conn) │           │ • Dynamic Model Routing    │
│ • Read-Write Splitting        │           │ • Exponential Jitter Retry │
│ • Primary + 3 Read Replicas   │           │ • Multi-Key / Tier Rotation│
└───────────────────────────────┘           └────────────────────────────┘
```

---

## 3. Subsystem Capacity Sizing & Bottleneck Analysis

### 3.1. Compute & Application Pods
- **Target Pod Sizing**: $4\text{ vCPU}$, $8\text{ GB RAM}$ per Node.js worker pod.
- **Node.js Concurrency Limit**: With Node.js 20+ event loop and stream piping, each pod comfortably handles $2,500$ open HTTP keep-alive and SSE connections.
- **Pod Count**: $100,000 \text{ connections} / 2,500 \text{ conn/pod} = 40 \text{ pods}$ baseline.
- **Autoscaling Policy (K8s HPA)**:
  - Metric 1: Average Pod CPU $> 70\%$
  - Metric 2: Open Socket Connections $> 2,000$ per pod
  - Min replicas: $40$; Max replicas: $90$. Scale-up delay: $15\text{ seconds}$; Scale-down stabilization: $300\text{ seconds}$.

### 3.2. Database & Connection Pooling
- **Problem**: Opening 100,000 direct connections to PostgreSQL causes immediate connection exhaustion and memory thrashing ($10\text{ MB}$ per direct connection = $1\text{ TB RAM}$).
- **Solution**: **PgBouncer in Transaction Mode**.
  - Physical database connections: $350$ connections to PostgreSQL primary, $150$ connections per read replica.
  - Multiplexing ratio: $100,000$ client sessions mapped onto $350$ physical server connections ($1:285$ multiplexing).
  - Average transaction execution duration: $\le 8\text{ ms}$.
  - Primary handles writes ($10\%$), 3 Read Replicas handle conversation and history retrieval ($90\%$).

### 3.3. Distributed Cache & Session Memory Sizing
- **Active Session Payload**: $256\text{ bytes}$ per stateless token and session metadata.
- **100,000 Active Sessions**: $100,000 \times 256\text{ B} = 25.6\text{ MB}$.
- **Semantic Query & Model Cache**: $4\text{ GB}$.
- **Stream Resumption Checkpoints (1 hour window)**: $5,000 \text{ streams} \times 4\text{ KB} = 20\text{ MB}$.
- **Rate Limit Sliding Window Ring Buffers**: $500\text{ MB}$.
- **Total Redis Cluster RAM Requirement**: **$32\text{ GB}$** (AWS ElastiCache Redis Cluster: 3 shards, 1 primary + 1 replica each, `cache.r6g.xlarge`).

### 3.4. Anthropic Claude API Throughput & Rate Limits
- **Tier Requirement**: Anthropic Enterprise Tier 4 or Custom Commitment.
- **Rate Limit Target**: Minimum $10,000\text{ Requests Per Minute (RPM)}$ and $8,000,000\text{ Tokens Per Minute (TPM)}$.
- **Dynamic Model Allocation**:
  - $65\%$ of routine queries routed to `claude-3-5-haiku-20241022` ($0.80/\text{M in}$, $4.00/\text{M out}$).
  - $35\%$ of complex analytical, reasoning, and coding queries routed to `claude-3-7-sonnet-20250219` ($3.00/\text{M in}$, $15.00/\text{M out}$).
- **Key Rotation**: Dual primary keys + secondary fallback keys configured with round-robin load distribution.

---

## 4. Financial Cost Model (Monthly Estimate)

| Category | Infrastructure / Resource | Sizing & Unit | Monthly Cost (USD) |
| :--- | :--- | :--- | :--- |
| **Compute** | AWS EKS / Fargate Pods | 40 pods (4 vCPU, 8 GB RAM) | $4,320.00 |
| **Load Balancing** | AWS Application Load Balancer | 2 ALBs + LCU data processed | $180.00 |
| **Database** | Supabase Enterprise / AWS RDS PG | db.r6g.2xlarge Multi-AZ + 3 Replicas | $1,850.00 |
| **Distributed Cache** | AWS ElastiCache Redis | 3 Shards (cache.r6g.xlarge) | $740.00 |
| **CDN & Edge** | Cloudflare Enterprise | Static caching & DDoS shielding | $450.00 |
| **Bandwidth (Egress)**| Public Cloud Egress | ~15 TB/month | $360.00 |
| **Total Base Infrastructure** | *(excluding model tokens)* | | **$7,900.00 / month** |

*Note: Infrastructure cost amortizes to **$0.079 per concurrent active user per month**, delivering exceptional unit economics.*

---

## 5. Staged Scaling & Bottleneck Elimination Roadmap

1. **Stage 1 (100–1,000 Concurrent Users)**:
   - Single Node.js server with in-memory caching and direct Supabase connection. Verified and operational.
2. **Stage 2 (1,000–10,000 Concurrent Users)**:
   - Horizontal scaling with ALB (4–6 pods). PgBouncer enabled. L2 Redis caching active.
3. **Stage 3 (10,000–50,000 Concurrent Users)**:
   - 20 worker pods. Deficit Round Robin fair queuing active. Database read replicas online. Rate limit sliding window sharded.
4. **Stage 4 (50,000–100,000 Concurrent Users)**:
   - 40–80 worker pods with auto-scaling HPA. Redis cluster sharding. Multi-key Claude API rotation. Full backpressure and graceful background job shedding enabled.
