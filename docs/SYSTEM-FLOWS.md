# System Flows

## Flow 1: Campaign Execution (End-to-End)

```mermaid
sequenceDiagram
    participant User as Marketer
    participant FE as Frontend
    participant API as CRM Backend
    participant AI as OpenAI
    participant Redis as Redis Queue
    participant CS as Channel Service
    participant DB as Supabase

    User->>FE: Types goal in Agent Chat
    FE->>API: POST /api/agent/chat (streaming)
    API->>AI: Chat completion with tools
    AI-->>API: tool_call: query_customers
    API->>DB: SELECT customers WHERE ...
    DB-->>API: 2,100 customers
    API->>AI: Tool result: 2,100 matches
    AI-->>API: tool_call: generate_message
    API->>AI: GPT-4o-mini for message gen
    AI-->>API: Personalized message template
    AI-->>API: Final response + campaign plan
    API-->>FE: SSE stream (thinking + plan card)
    FE-->>User: Displays campaign plan

    User->>FE: Clicks "Approve & Launch"
    FE->>API: POST /campaigns/:id/launch
    API->>DB: UPDATE campaign status='running'
    API->>DB: INSERT communications (bulk)
    API->>Redis: LPUSH messages (batched, rate-limited)

    loop Queue Consumer (100 msg/sec)
        API->>Redis: RPOP message
        API->>CS: POST /api/send {communication}
        CS-->>API: 202 Accepted
    end

    Note over CS: Async delivery simulation begins

    loop Lifecycle Callbacks (staggered)
        CS->>API: POST /webhooks/delivery {sent}
        API->>Redis: Check idempotency key
        API->>DB: INSERT communication_events
        Note over DB: Trigger updates communications.status
        Note over DB: Trigger updates campaign_stats
        DB-->>FE: Realtime subscription fires
        FE-->>User: Live counter increments
    end

    CS->>API: POST /webhooks/delivery {delivered}
    CS->>API: POST /webhooks/delivery {opened}
    CS->>API: POST /webhooks/delivery {read}
    CS->>API: POST /webhooks/delivery {clicked}
```

## Flow 2: AI Agent Self-Correction Loop

```mermaid
graph TD
    A[Receive marketer goal] --> B[Plan campaign with GPT-4o]
    B --> C[Execute tool calls]
    C --> D[Assemble campaign plan]
    D --> E[Self-Audit with GPT-4o]
    E --> F{Score >= 70?}
    F -->|Yes| G[Present to marketer]
    F -->|No| H[Identify weaknesses]
    H --> I[Refine plan]
    I --> C
    G --> J{Approved?}
    J -->|Yes| K[Execute campaign]
    J -->|Edit| L[Open visual builder]
    L --> K
```

## Flow 3: Webhook Processing (Idempotent)

```mermaid
graph TD
    A[Webhook received from Channel Service] --> B[Validate HMAC signature]
    B -->|Invalid| C[Return 401]
    B -->|Valid| D[Return 202 Accepted immediately]
    D --> E[Check idempotency key in Redis]
    E -->|Exists| F[Skip - already processed]
    E -->|New| G[Set idempotency key with TTL 24h]
    G --> H[Validate status transition ordering]
    H -->|Invalid order| I[Log warning, skip]
    H -->|Valid| J[INSERT into communication_events]
    J --> K[Postgres trigger fires]
    K --> L[Update communications.current_status]
    K --> M[Update campaign_stats counters]
    M --> N[Supabase Realtime notifies subscribers]
    N --> O[Frontend updates live]
```

## Flow 4: Natural Language Segmentation

```mermaid
graph TD
    A[Marketer types: show me gold-tier in Mumbai who havent ordered in 2 weeks] --> B[POST /segments/natural-language]
    B --> C[GPT-4o-mini parses intent]
    C --> D[Generate filter config JSON]
    D --> E[Generate parameterized SQL]
    E --> F[Execute query against customers table]
    F --> G[Return count + sample customers]
    G --> H[Display preview in UI]
    H --> I{Save segment?}
    I -->|Yes| J[INSERT into segments table]
    I -->|Campaign| K[Create campaign with this audience]
```

## Flow 5: Data Ingestion

```mermaid
graph TD
    A[POST /customers/bulk or /orders/bulk] --> B[Validate payload schema]
    B -->|Invalid| C[Return 400 with errors]
    B -->|Valid| D[Upsert into Supabase]
    D --> E[Update computed fields]
    E --> F[Recalculate engagement scores]
    F --> G[Update segment counts]
    G --> H[Return success with count]
```

---

# Deployment Architecture

## Infrastructure Diagram

```mermaid
graph TB
    subgraph internet [Internet]
        Browser[Browser - Marketer]
    end

    subgraph vercel [Vercel - Edge Network]
        CDN[CDN - Static Assets]
        SPA[React SPA Build]
    end

    subgraph railway [Railway - Containers]
        CRM[CRM Backend Container]
        Channel[Channel Service Container]
    end

    subgraph supabase [Supabase Cloud]
        PG[(PostgreSQL 15)]
        RT[Realtime Server]
        Auth[Auth + RLS]
    end

    subgraph upstash [Upstash]
        Redis[(Redis - Serverless)]
    end

    subgraph openai [OpenAI]
        GPT[GPT-4o / GPT-4o-mini]
    end

    Browser --> CDN
    CDN --> SPA
    SPA -->|"REST API"| CRM
    SPA -->|"WebSocket"| RT
    CRM -->|"HTTP"| Channel
    Channel -->|"Webhook"| CRM
    CRM --> PG
    CRM --> Redis
    CRM --> GPT
    Channel --> Redis
    PG --> RT
```

## Environment Configuration

```env
# CRM Backend (.env)
PORT=3001
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=xxx
OPENAI_API_KEY=sk-xxx
CHANNEL_SERVICE_URL=http://channel-service:3002
WEBHOOK_SECRET=shared-hmac-secret
FRONTEND_URL=https://reach-ai.vercel.app

# Channel Service (.env)
PORT=3002
CRM_WEBHOOK_URL=http://crm-backend:3001/api/webhooks/delivery
WEBHOOK_SECRET=shared-hmac-secret
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=xxx

# Frontend (.env)
VITE_API_URL=https://crm-backend.railway.app/api
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

# Sprint Plan (Execution Order + Testing + Self-Improvement)

## Phase Execution Protocol (MANDATORY after every phase)

```mermaid
graph LR
    Implement[Implement Phase] --> Test[Run All Tests]
    Test --> Review[Self-Review - /self-review]
    Review --> Improve[Search for Improvements - /skill-forge]
    Improve --> Fix[Implement Fixes Autonomously]
    Fix --> Retest[Re-run Tests]
    Retest --> Docs[Update Documentation]
    Docs --> Checkpoint[Demo Checkpoint - Can I show this?]
```

### The Loop (Applied After EVERY Phase):
1. **IMPLEMENT** the phase deliverable
2. **TEST** — Run unit tests, integration tests, edge case tests for this phase
3. **SELF-REVIEW** — Re-read every modified file. Check for bugs, edge cases, type safety, error handling, security
4. **SEARCH FOR IMPROVEMENT** — Compare against best-in-class. Ask "what would a staff engineer critique?"
5. **FIX** — Implement top improvements immediately (don't ask, just fix)
6. **RE-TEST** — Ensure improvements didn't break anything
7. **UPDATE DOCS** — Reflect changes in PRD/TRD/ARCHITECTURE.md/SYSTEM-FLOWS.md
8. **CHECKPOINT** — Prove this phase works with evidence (curl output, test results, screenshot)

---

| Phase | Duration | Deliverable | Tests | Exit Criteria |
|-------|----------|-------------|-------|---------------|
| 1 | 3h | Monorepo scaffold, Supabase schema, seed script | Schema validation, seed idempotency, data distribution | `npm run seed` populates 10K customers + 50K orders correctly |
| 2 | 4h | CRM Backend core (CRUD + segments + NL) | 25+ unit tests, pagination perf, SQL injection checks | All endpoints return correct data under <200ms |
| 3 | 3h | Channel Service (full lifecycle sim) | Lifecycle validity, retry logic, idempotency, DLQ | 100 messages sent → all callbacks received → stats accurate |
| 4 | 5h | AI Agent (tools + self-correction + streaming) | 5 demo scenarios pass, error recovery, loop prevention | Agent plans campaign from NL goal with confidence >70 |
| 5 | 3h | Frontend shell + routing + layout + dashboard | All routes render, loading/error states, responsive | All 7 routes render without console errors |
| 6 | 5h | Agent Chat UI (streaming + cards + approval) | Streaming renders, approval flow, error recovery | Full conversation → campaign launch works |
| 7 | 4h | Campaign screens (list + detail + live pulse) | Realtime subscription, funnel accuracy, virtualization | Counters animate live on webhook receipt |
| 8 | 4h | Customer + Segments screens (NL builder) | Table performance, NL parsing, filter correctness | NL segmentation returns correct audience |
| 9 | 3h | Integration, deployment, polish, docs | E2E demo scenarios, deploy smoke tests | Live URL, all 5 demo scenarios work end-to-end |

**Total estimated: ~34 hours (including testing + improvement cycles)**

---

# Technical Risk Analysis

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|-----------|
| OpenAI rate limit hit during demo | Low | High | Use GPT-4o-mini (high limits), implement response caching for repeated queries |
| Supabase free tier connection limit (50) | Medium | Medium | Use connection pooling via Supabase built-in pooler |
| Upstash Redis 10K cmd/day limit | Medium | Medium | Batch operations, use pipeline commands, keep demo data moderate |
| Railway free tier cold starts | Medium | Low | Keep services warm with health check pings every 5 min |
| Channel service callback timing in demo | Low | Medium | Add "demo mode" with faster simulation (1-5s vs realistic delays) |
| AI agent generates invalid campaign | Medium | Medium | Self-correction loop catches this; fallback to manual builder |
| Webhook loss during high volume | Low | High | Idempotency keys + DLQ + ordered processing |
| Supabase Realtime subscription limits | Low | Medium | Filter subscriptions narrowly, single-row stats pattern |
| Frontend bundle size too large | Low | Low | Code splitting per route, lazy load heavy components |
| TypeScript build errors blocking deploy | Medium | High | CI-free deployment; thorough local testing before push |

---

# Verification Strategies

## Pre-Deployment Checklist

```
□ All API endpoints return expected response shapes
□ Seed script runs without errors and produces realistic data
□ Channel service receives messages and fires callbacks
□ All webhook callbacks are processed (zero data loss)
□ Idempotency: duplicate webhooks don't create duplicate events
□ Status ordering: can't jump from 'sent' to 'clicked'
□ AI agent can complete 3 canonical demo scenarios
□ Self-correction triggers when plan quality is low
□ Realtime: dashboard counters update live during campaign
□ All 7 frontend screens render without errors
□ Mobile responsive: no horizontal overflow on tablet
□ Error states: graceful handling of API failures
□ Environment variables: no secrets in committed code
□ Deployment: both Railway services start and accept traffic
□ Cross-service communication: CRM ↔ Channel verified
```

## Demo Scenarios (Must All Work)

| Scenario | Expected Outcome |
|----------|-----------------|
| "Win back customers who haven't ordered in 30 days" | Agent segments ~3K churning customers, recommends WhatsApp, generates re-engagement offer |
| "Launch our new cold brew to premium customers in Mumbai" | Agent finds gold/platinum tier in Mumbai, multi-channel campaign, product-focused messaging |
| "Send a loyalty reward to our most active customers this month" | Agent identifies top-decile by order frequency, personalized reward message |
| Manual segment creation: "gold tier, Bangalore, last order > 14 days" | NL → filter → preview shows correct count |
| View running campaign | Live funnel updates, communication log populates in real-time |

## Performance Targets

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Dashboard load time | < 1.5s | Browser DevTools Network tab |
| API response (CRUD) | < 200ms | Console log timing |
| AI first token | < 2s | Measure SSE first data event |
| Webhook processing | < 100ms | Server-side timing logs |
| Realtime update latency | < 500ms | Visual inspection during demo |
| Campaign execution (1000 msgs) | < 30s to queue all | Timing from launch to queue-complete |
