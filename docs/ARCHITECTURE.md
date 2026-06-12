# Architecture Decisions & Tradeoffs

## Design Philosophy

> "Bold, opinionated product choices rather than building everything shallowly."

ReachAI makes one bold bet: **the AI agent IS the product**. The traditional CRM screens (campaigns, customers, segments) exist as transparent views into what the agent is doing — not as the primary interface. The marketer's primary workflow is conversational, with visual screens serving as monitoring and override surfaces.

---

## Key Architecture Decisions

### Decision 1: Event-Sourced Communication Status

**What:** Communications have an append-only `communication_events` log. Current status is derived by Postgres triggers, not mutated directly.

**Why:**
- Webhook callbacks may arrive out of order (network jitter)
- Duplicate callbacks are safely ignored via idempotency keys
- Full audit trail for debugging delivery issues
- Can replay events to rebuild state (disaster recovery)
- Signals senior-level system design thinking

**Tradeoff:** Slightly more complex than a simple `UPDATE status = 'delivered'`, but dramatically more robust at scale.

**At scale:** This pattern evolves naturally into CQRS with a Kafka event stream and separate read/write databases.

---

### Decision 2: Separate Channel Service (Decoupled)

**What:** Channel delivery simulation runs as a completely separate Express server with its own deployment, independent of the CRM backend.

**Why:**
- Mirrors real-world architecture (Twilio/Gupshup are separate services)
- Forces proper API contracts and webhook design
- Can be scaled independently (sending is bursty, receiving is steady)
- Demonstrates understanding of distributed system boundaries
- Makes the callback loop explicit and testable

**Tradeoff:** Two services to deploy/maintain vs. a single monolith. Worth it for architectural clarity and what it demonstrates.

---

### Decision 3: AI Agent with Self-Correction Loop

**What:** After the AI plans a campaign, a separate audit call scores the plan (0-100). If below 70, it automatically refines.

**Why:**
- Prevents low-quality campaigns from reaching the marketer
- Makes AI reasoning transparent and trustworthy
- Demonstrates awareness of LLM failure modes
- Directly inspired by hackathon-winning patterns (AetherSnap)
- The self-correction is VISIBLE to the user — builds trust

**Tradeoff:** Extra API call (cost + latency). Mitigated by using GPT-4o-mini for audits when the plan is simple, GPT-4o only for complex multi-segment campaigns.

---

### Decision 4: Queue-First Webhook Processing

**What:** When the CRM receives a delivery callback from the channel service, it immediately returns 202 and processes asynchronously via Redis.

**Why:**
- Never blocks the channel service (which may have thousands of callbacks to send)
- Handles burst traffic gracefully
- Failed processing doesn't lose data (message stays in queue)
- Idempotency check happens during processing, not at ingestion

**Tradeoff:** Adds ~50-200ms latency before UI updates. Acceptable for delivery tracking (not real-time chat). In demo mode, processing is near-instant anyway.

**At scale:** Replace Redis list with SQS/Kafka for guaranteed delivery and dead letter routing.

---

### Decision 5: Supabase Realtime for Live Dashboard (Not Custom WebSocket)

**What:** Frontend subscribes to Postgres Changes on `campaign_stats` row via Supabase's built-in Realtime.

**Why:**
- Zero additional infrastructure (comes free with Supabase)
- Trigger-based aggregation means we subscribe to ONE row, not thousands of communications
- Postgres LISTEN/NOTIFY is battle-tested
- No custom WebSocket server to build and deploy

**Tradeoff:** Limited to ~200 concurrent connections on free tier. Fine for a demo. At scale, use dedicated WebSocket cluster with Redis Pub/Sub.

---

### Decision 6: GPT-4o for Strategy, GPT-4o-mini for Execution

**What:** Two-tier model routing based on task complexity.

**Why:**
- GPT-4o ($2.50/1M tokens) is 16x more expensive than GPT-4o-mini ($0.15/1M)
- Strategy/planning needs GPT-4o's reasoning depth
- Message generation and routine queries work perfectly with GPT-4o-mini
- 60-70% cost reduction without quality loss

**Tradeoff:** Slightly more complex orchestration code. Worth the cost savings and demonstrates production-awareness.

---

### Decision 7: React + Vite (Not Next.js)

**What:** Plain React SPA with Vite, deployed as static build on Vercel.

**Why:**
- No SSR needed (this is a dashboard app, not SEO-sensitive)
- Faster development iteration (Vite HMR < 50ms)
- Simpler deployment (static files on CDN)
- No server-side complexity to debug
- Full control over routing and data fetching

**Tradeoff:** No server components, no ISR. Doesn't matter for a single-user dashboard app.

---

### Decision 8: Monorepo with Shared Types

**What:** Single repository with `frontend/`, `backend/`, `channel-service/`, and `shared/` directories.

**Why:**
- TypeScript types shared across all services (single source of truth)
- One `git clone` for the evaluator to see everything
- Coordinated deployments from same commit
- Easier development workflow

**Tradeoff:** Could use turborepo/nx for caching, but overhead not worth it for this project size.

---

## Scale Assumptions (Explicit)

This system is designed for a demo (10K customers, 50K orders, 5 campaigns). Here's what changes at each scale level:

### Current (Demo): 10K customers, ~1K messages per campaign

- Single Express instances handle all traffic
- Supabase free tier is sufficient
- Redis operations well within 10K/day limit
- No caching needed (fast enough without)

### Medium (100K customers, 10K messages per campaign)

- Add connection pooling (PgBouncer via Supabase)
- Campaign queue needs partitioning per channel
- Add response caching for AI (Redis with TTL)
- Horizontal scale channel service workers
- Pre-aggregate analytics (don't compute on read)

### Large (1M+ customers, 100K+ messages per campaign)

- CQRS: Separate read/write databases
- Kafka for event streaming (replace Redis lists)
- ClickHouse for analytics (OLAP workload)
- Dedicated WebSocket cluster (not Supabase Realtime)
- AI agent runs async with queue-backed tool execution
- Elasticsearch for customer search/filtering
- CDN for static message assets
- Multi-region deployment for latency

---

## What I Consciously Chose NOT to Build

| Feature | Why Not |
|---------|---------|
| User authentication | Single-brand demo; auth adds complexity without demonstrating CRM thinking |
| A/B testing | Would dilute focus on the AI agent experience; note as future enhancement |
| Rich email template editor | Heavy UI investment for one channel; plain text messages demonstrate the system |
| Scheduled campaigns | Adds time-based complexity; campaigns execute immediately for better demo |
| Multi-brand tenancy | Would complicate schema without adding evaluation value |
| Billing/usage tracking | Not relevant to the marketing CRM domain |
| Import from CSV/Excel | Seed script handles data; API exists for programmatic import |
| Campaign approval workflows | Single-user context; agent approval serves this purpose |

---

## Technology Alternatives Considered

| Chose | Over | Reason |
|-------|------|--------|
| Express | Fastify, Hono | More familiar, better debugging story, sufficient perf |
| Supabase | PlanetScale, Neon | Realtime built-in, generous free tier, auth if needed |
| Upstash Redis | BullMQ + local Redis | Serverless (no infra), HTTP-based (no connection issues) |
| shadcn/ui | MUI, Ant Design, Chakra | Full customization, no runtime CSS, tree-shakes well |
| Zustand | Redux, Jotai, Recoil | Minimal boilerplate, TypeScript-first, no providers |
| TanStack Query | SWR, Apollo | Best cache invalidation, background refetch, devtools |
| Recharts | Victory, Nivo, Chart.js | React-native API, lightweight, composable |
| Railway | Render, Fly.io | Easier multi-service setup, GitHub deploy, free tier |
| Framer Motion | React Spring, GSAP | Best React integration, layout animations, gesture support |
| Vitest | Jest, Mocha | Native Vite integration, TypeScript-first, fast parallel execution |

---

## Development Methodology: Skills-Driven Quality Loop

This project uses an active skills system to maintain quality throughout development:

### /self-review (After Every Code Change)

```
For each file modified:
1. RE-READ what was written (don't trust intent memory)
2. CHECK: Does this solve THE thing asked? (not a related thing)
3. BUGS: Off-by-one? Null/undefined? Race conditions?
4. EDGE CASES: Empty input? Large input? Concurrent access?
5. CONSISTENCY: Matches existing patterns? Same naming?
6. TYPES: Type-safe? No `any`? Generics correct?
7. ERROR HANDLING: What throws? Is it caught? Useful message?
8. SECURITY: Input validated? Injection? XSS?
→ Fix issues BEFORE presenting. Never show first drafts.
```

### /skill-forge (After Major Milestones)

```
At phases 2, 4, 7, 9:
1. COMPARE against hackathon winners (Serena, AetherSnap, NexusAI)
2. IDENTIFY what they do better than current implementation
3. SEARCH for improved patterns ("best [X] implementation 2026")
4. IMPLEMENT top 1-2 improvements immediately
5. RE-TEST to ensure no regressions
6. DOCUMENT the improvement rationale in this file
```

### /prompt-amplifier (Before Every Implementation Step)

```
Before coding any phase:
1. INTENT: What specifically needs to be built?
2. SCOPE: What's in, what's explicitly out?
3. SUCCESS CRITERIA: How to verify it's done correctly?
4. EDGE CASES: What can go wrong? Handle proactively.
5. QUALITY BAR: Production-grade, not prototype.
→ Execute the AMPLIFIED version, not the raw intent.
```

### Testing Philosophy

- **Tests are not afterthoughts** — they're exit criteria for each phase
- **Edge cases first** — the happy path is easy; robustness wins evaluations
- **Integration over unit** — proving the two-service loop works is more valuable than 100% line coverage
- **Realistic failure simulation** — test what happens when things break, not just when they work
- **Self-improving** — after each test run, look for gaps and add cases
