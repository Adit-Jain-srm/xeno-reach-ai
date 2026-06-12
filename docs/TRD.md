# Technical Requirements Document (TRD)
## ReachAI — System Architecture & Technical Specification

### 1. System Overview

ReachAI is a three-service architecture:

1. **Frontend** — React SPA (Vercel)
2. **CRM Backend** — Express/TypeScript API server (Railway)
3. **Channel Service** — Separate Express/TypeScript delivery simulator (Railway)

Communication flow:
```
Frontend <--REST/SSE--> CRM Backend <--HTTP--> Channel Service
                                    <--Webhook-- Channel Service
```

---

### 2. Technology Decisions

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Frontend Framework | React 18 + Vite | Fast HMR, small bundle, no SSR complexity needed |
| UI Library | shadcn/ui + Tailwind | Production-quality components, fully customizable |
| Animation | Framer Motion | Smooth delivery pulse animations, layout transitions |
| Charts | Recharts | Lightweight, composable, React-native charting |
| Client State | Zustand | Minimal boilerplate, no providers, TypeScript-first |
| Server State | TanStack Query v5 | Cache invalidation, background refetch, optimistic updates |
| Realtime | Supabase Realtime | Free, Postgres-native, no extra infrastructure |
| Backend Runtime | Node.js 20 LTS | Team familiarity, excellent TypeScript support |
| Backend Framework | Express 4 | Mature, minimal, well-understood |
| Language | TypeScript (strict) | Across all services for shared types |
| Database | Supabase (PostgreSQL 15) | Managed, free tier, realtime built-in, RLS |
| Cache/Queue | Upstash Redis | Serverless, free tier, HTTP-based (no connection limits) |
| AI Provider | OpenAI (GPT-4o + GPT-4o-mini) | Best function calling, streaming support |
| Deployment | Vercel + Railway | Free tiers, GitHub auto-deploy, zero config |

---

### 3. API Contracts

#### 3.1 CRM Backend API (Port 3001)

**Base URL:** `https://<railway-url>/api`

##### Customers
```
GET    /api/customers              — List (paginated, filterable)
GET    /api/customers/:id          — Get single customer with orders
POST   /api/customers              — Create customer
POST   /api/customers/bulk         — Bulk import customers
GET    /api/customers/:id/timeline — Communication history
```

##### Orders
```
GET    /api/orders                 — List (paginated, by customer)
POST   /api/orders                 — Create order
POST   /api/orders/bulk            — Bulk import orders
```

##### Segments
```
GET    /api/segments               — List all saved segments
POST   /api/segments               — Create segment (filter config)
POST   /api/segments/preview       — Preview audience count without saving
POST   /api/segments/natural-language — NL query → filter config + SQL
GET    /api/segments/:id/customers — Get customers in segment
```

##### Campaigns
```
GET    /api/campaigns              — List all campaigns
POST   /api/campaigns              — Create campaign
GET    /api/campaigns/:id          — Get campaign with stats
POST   /api/campaigns/:id/launch   — Execute campaign (queue messages)
GET    /api/campaigns/:id/communications — Per-recipient status
GET    /api/campaigns/:id/stats    — Aggregated performance metrics
```

##### AI Agent
```
POST   /api/agent/chat             — Send message, get streaming response
GET    /api/agent/sessions         — List past sessions
GET    /api/agent/sessions/:id     — Get session with full history
```

##### Webhooks (Called by Channel Service)
```
POST   /api/webhooks/delivery      — Receive delivery status callback
```

##### Analytics
```
GET    /api/analytics/overview     — Dashboard metrics
GET    /api/analytics/channels     — Per-channel performance comparison
```

##### SSE (Server-Sent Events)
```
GET    /api/events/campaigns/:id   — Stream real-time delivery updates
GET    /api/events/agent/:sessionId — Stream agent thinking/responses
```

#### 3.2 Channel Service API (Port 3002)

**Base URL:** `https://<railway-url>/api`

```
POST   /api/send                   — Receive message to simulate delivery
GET    /api/health                 — Health check
GET    /api/stats                  — Simulation statistics
```

#### 3.3 Webhook Payload Contracts

**CRM → Channel Service (Send):**
```json
{
  "communication_id": "uuid",
  "campaign_id": "uuid",
  "recipient": {
    "customer_id": "uuid",
    "name": "Rahul Sharma",
    "email": "rahul@gmail.com",
    "phone": "+919876543210"
  },
  "channel": "whatsapp",
  "message": {
    "content": "Hey Rahul! Miss your morning latte? Here's 20% off your next order.",
    "personalization": { "name": "Rahul", "offer": "20%", "product": "latte" }
  },
  "metadata": {
    "campaign_name": "Win Back Lapsed Customers",
    "sent_at": "2026-06-13T10:00:00Z"
  }
}
```

**Channel Service → CRM (Delivery Receipt):**
```json
{
  "communication_id": "uuid",
  "event_type": "delivered",
  "occurred_at": "2026-06-13T10:00:05Z",
  "idempotency_key": "uuid:delivered",
  "metadata": {
    "channel": "whatsapp",
    "latency_ms": 5000
  }
}
```

---

### 4. Database Schema

See full schema in plan file. Key design decisions:

**Event Sourcing for Communications:**
- `communications` table holds current state (for fast reads)
- `communication_events` table is append-only log (for audit, replay, debugging)
- Postgres trigger on `communication_events` INSERT updates `communications.current_status`
- Postgres trigger also updates `campaign_stats` aggregation row

**Why Event Sourcing:**
- Handles out-of-order webhook delivery gracefully
- Full audit trail of every status transition
- Can replay events to rebuild state if corrupted
- Signals senior engineering thinking to evaluators

**Indexes:**
```sql
CREATE INDEX idx_customers_loyalty ON customers(loyalty_tier);
CREATE INDEX idx_customers_last_purchase ON customers(last_purchase_at);
CREATE INDEX idx_customers_city ON customers(city);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_communications_campaign ON communications(campaign_id);
CREATE INDEX idx_communications_status ON communications(current_status);
CREATE INDEX idx_comm_events_comm_id ON communication_events(communication_id);
CREATE INDEX idx_comm_events_idempotency ON communication_events(idempotency_key);
```

---

### 5. Channel Service — Delivery Simulation Logic

```
On receiving POST /api/send:
1. Validate payload (reject malformed with 400)
2. Generate idempotency key
3. Respond 202 Accepted immediately
4. Schedule async lifecycle simulation:

   For each message:
   a. Wait random(1-3s) → emit "sent" callback
   b. Roll delivery dice (channel-specific success rate):
      - Success → wait random(2-5s) → emit "delivered"
      - Failure (5-12%) → emit "failed" with reason
   c. If delivered, roll engagement dice:
      - Opened: WhatsApp 75%, SMS 60%, Email 35%, RCS 50%
        → wait random(10-60s) → emit "opened"
      - Read: 80% of opened → wait random(5-30s) → emit "read"
      - Clicked: 40% of read → wait random(30-120s) → emit "clicked"

Callback emission:
- POST to CRM webhook URL with exponential backoff
- Retry: 3 attempts, delays of 2s, 4s, 8s (+ jitter)
- After 3 failures: log to DLQ array, stop retrying
```

**Channel-Specific Parameters:**

| Channel | Delivery Rate | Open Rate | Read Rate | Click Rate | Speed |
|---------|:---:|:---:|:---:|:---:|:---:|
| WhatsApp | 95% | 75% | 60% | 40% | Fast (2-10s) |
| SMS | 92% | 60% | 45% | 15% | Medium (5-30s) |
| Email | 88% | 35% | 25% | 12% | Slow (30-120s) |
| RCS | 80% | 50% | 40% | 25% | Medium (5-20s) |

---

### 6. AI Agent — Technical Design

**Orchestration Pattern:** Sequential pipeline with QA gating (self-correction loop)

**System Prompt Core:**
```
You are ReachAI, an expert marketing strategist for BrewPulse coffee chain.
You help marketers reach the right customers with the right message on the right channel.

When given a marketing goal:
1. Analyze the customer data to identify the best audience
2. Recommend optimal channels per customer segment
3. Generate personalized, channel-native messages
4. Present a campaign plan with confidence score
5. Execute upon approval

Always explain your reasoning. Show your work.
```

**Tool Definitions (OpenAI Function Calling):**

Each tool has strict JSON schema validation. The agent orchestrator:
1. Receives user message
2. Calls OpenAI with tools + conversation history
3. Executes any tool calls against CRM services
4. Feeds results back to model
5. Repeats until model produces final response
6. Runs self-audit (separate GPT-4o call scoring 0-100)
7. If score < 70: feeds audit feedback back, re-runs from step 2
8. Streams final response to frontend via SSE

**Model Routing:**
- GPT-4o: Initial planning, self-audit, complex analysis
- GPT-4o-mini: Message generation, simple queries, tool param construction

---

### 7. Realtime Architecture

**Supabase Realtime (Postgres Changes):**
- Subscribe to `campaign_stats` row changes → live dashboard counters
- Subscribe to `communications` status changes (filtered by campaign_id) → delivery log

**Server-Sent Events (custom):**
- Agent streaming: token-by-token response + tool call events
- Campaign execution progress: queued/sending/complete states

**Why both:**
- Supabase Realtime is perfect for DB-driven updates (stats, status)
- SSE is better for streaming AI responses (no DB write needed per token)

---

### 8. Security Considerations (Demo Scope)

| Concern | Approach |
|---------|----------|
| API keys in frontend | All AI calls through backend; frontend never touches OpenAI |
| Webhook authentication | HMAC signature on channel service callbacks (shared secret) |
| Rate limiting | Express rate-limit middleware (100 req/min per IP) |
| SQL injection | Parameterized queries via Supabase client (never raw string concat) |
| CORS | Whitelist frontend domain only |
| Environment secrets | .env files, never committed; .env.example provided |

---

### 9. Error Handling Strategy

| Layer | Strategy |
|-------|----------|
| Frontend | TanStack Query error boundaries + toast notifications |
| API Routes | Centralized error middleware with structured error responses |
| AI Agent | Graceful fallback messages if OpenAI fails; retry once |
| Queue | Failed messages go to DLQ; campaign marked "partially failed" |
| Webhooks | 202 response always; process async; log failures |
| Database | Transaction rollback on constraint violations |

---

### 10. Testing Strategy (Comprehensive)

#### Testing Framework
- **Runner:** Vitest (fast, TypeScript-native, compatible with Vite)
- **HTTP Testing:** Supertest (Express endpoint testing)
- **Mocking:** Vitest built-in mocks + MSW (Mock Service Worker) for OpenAI
- **Coverage Target:** 80%+ for services, 60%+ for routes

#### Test Categories

**Unit Tests (per service file):**
| Service | Test File | Key Cases |
|---------|-----------|-----------|
| customer.service | `customers.test.ts` | CRUD, pagination, filtering, bulk import, engagement score calc |
| segment.service | `segments.test.ts` | Filter→SQL, NL parsing, audience count, overlap detection |
| campaign.service | `campaigns.test.ts` | Create, launch, status transitions, audience resolution |
| queue.service | `queue.test.ts` | Enqueue, dequeue, rate limiting, batch size |
| webhook handler | `webhooks.test.ts` | Idempotency, status ordering, event sourcing, stats update |
| AI orchestrator | `orchestrator.test.ts` | Tool calling, self-correction, streaming, error recovery |
| Channel simulator | `simulator.test.ts` | Lifecycle transitions, timing, failure rates |
| Callback emitter | `callback.test.ts` | Retry logic, backoff timing, DLQ routing |

**Integration Tests (cross-service):**
| Test | What It Proves |
|------|---------------|
| `campaign-loop.test.ts` | CRM → Channel → Webhook → Stats: full roundtrip with 100 messages |
| `agent-campaign.test.ts` | NL goal → agent tools → campaign created → executable |
| `segment-campaign.test.ts` | Create segment → attach to campaign → resolve audience correctly |
| `realtime-stats.test.ts` | Webhook receipt → trigger fires → stats row updates → Realtime notifies |

**Edge Case Tests (critical scenarios):**
| Edge Case | Expected Behavior |
|-----------|-------------------|
| Duplicate webhook (same idempotency_key) | Ignored silently, no duplicate events |
| Out-of-order webhook (read before delivered) | Rejected or queued for reprocessing |
| Channel service down during campaign | Messages stay in queue, retry when service recovers |
| OpenAI API 429 (rate limited) | Graceful fallback message, retry after delay |
| OpenAI returns malformed JSON | Caught, logged, user sees "AI had trouble, retrying..." |
| 10K messages sent simultaneously | Queue handles backpressure, no memory explosion |
| Campaign launched with 0 audience | Blocked with validation error before queueing |
| Customer deleted mid-campaign | Communication marked failed, campaign continues for others |
| Very long message content (>4KB) | Truncated or rejected with clear error |
| Non-UTF8 characters in customer name | Handled gracefully, stored correctly in Postgres |
| Redis connection lost | Circuit breaker, fallback to direct processing |
| Supabase Realtime disconnects | Auto-reconnect with exponential backoff |
| Agent self-correction loops infinitely | Hard cap at 3 iterations, present best attempt |
| NL segment query with SQL injection | Parameterized query prevents execution |

**Frontend Component Tests:**
| Component | Key Assertions |
|-----------|---------------|
| `ChatMessage` | Renders user/AI variants, handles markdown, shows timestamps |
| `DeliveryFunnel` | Animates on data change, shows correct percentages, handles 0 |
| `CampaignCard` | All status variants render, progress bar accurate |
| `CustomerTable` | Sorts, filters, paginates, handles empty state |
| `NLSegmentInput` | Loading state during generation, error handling, preview display |
| `ThinkingBlock` | Collapsible, shows tool names, handles many steps |

#### Self-Review Protocol (Applied After Every Test Run)

```
After tests pass:
1. Are there paths NOT covered? (check coverage report)
2. Did I test the HAPPY path only? (add failure cases)
3. What happens with NULL/undefined inputs? (add null tests)
4. What happens under concurrent load? (add race condition tests)
5. Did I mock correctly or am I testing mocks? (verify mock accuracy)
```

#### Continuous Improvement After Testing

```
After each phase's tests pass:
1. Run coverage report → identify untested paths
2. Review test quality: "Would these catch a real bug?"
3. Compare test patterns against research (Serena, NexusAI test strategies)
4. Search: "best practices testing [specific concern] 2026"
5. Add any discovered edge cases immediately
6. Update TRD testing section if new patterns emerge
```
