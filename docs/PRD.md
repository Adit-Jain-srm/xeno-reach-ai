# Product Requirements Document (PRD)
## ReachAI — AI-Native Mini CRM for BrewPulse

### 1. Product Overview

**Product Name:** ReachAI  
**Brand Context:** BrewPulse — Premium coffee chain (India)  
**Product Type:** AI-native marketing and consumer engagement platform  
**Target User:** Brand marketer / marketing manager  

**One-line:** An AI-powered CRM that helps BrewPulse decide who to talk to, what to say, and reach them across WhatsApp, SMS, Email, and RCS — with an AI agent that can autonomously plan and execute campaigns.

---

### 2. Problem Statement

Consumer brands struggle with:
- **Audience selection:** Who should receive this campaign? Manual segmentation is slow and often misses behavioral signals.
- **Message personalization:** Writing tailored messages for different segments across different channels is labor-intensive.
- **Channel optimization:** Choosing the right channel per customer (not blast-all) requires data analysis most marketers don't have time for.
- **Performance visibility:** Understanding what worked, what didn't, and why — at both campaign and individual level.

**ReachAI solves this** by putting an AI agent at the center of the marketing workflow that can analyze customer data, recommend audiences, draft messages, select channels, execute campaigns, and surface insights — all from a single natural language goal.

---

### 3. User Persona

**Name:** Priya — Marketing Manager at BrewPulse  
**Goals:**
- Run 3-5 targeted campaigns per week across channels
- Win back lapsed customers before they churn completely
- Maximize engagement rates (not just blast volume)
- Understand which campaigns drive actual orders

**Pain Points:**
- Spends 2+ hours manually building segments in spreadsheets
- Writes same message for all channels (no channel-native formatting)
- Can't easily see which customers overlap between campaigns
- No real-time visibility into campaign delivery progress

---

### 4. Core Features (Prioritized)

#### P0 — Must Have (Assignment Minimum + AI Core)

| Feature | Description |
|---------|-------------|
| Data Ingestion | API + UI to ingest customers and orders; realistic seed data |
| Audience Segmentation | Visual filter builder + natural language segmentation |
| AI Agent Chat | Conversational AI that plans campaigns from business goals |
| Campaign Execution | Orchestrate sending personalized messages to audience via channel service |
| Channel Service (stub) | Separate service simulating delivery lifecycle with callbacks |
| Delivery Tracking | Event-sourced communication status with real-time updates |
| Campaign Analytics | Funnel visualization, delivery/open/click rates, per-channel breakdown |

#### P1 — Should Have (Differentiation)

| Feature | Description |
|---------|-------------|
| Self-Correction Loop | AI audits own campaign plan, refines if confidence < 70% |
| Smart Channel Routing | Per-customer channel recommendation based on behavior data |
| Visible Chain of Thought | Agent shows reasoning steps in real-time (not black box) |
| Campaign Confidence Score | AI-predicted success probability before execution |
| Real-time Delivery Pulse | Live animated counters as webhooks arrive |
| AI-Generated Insights | Post-campaign natural language analysis of results |

#### P2 — Nice to Have (Polish)

| Feature | Description |
|---------|-------------|
| Segment Overlap Analysis | Venn diagram showing customer overlap between segments |
| Customer Engagement Score | Computed score predicting churn / engagement probability |
| AI-Suggested Campaigns | Proactive suggestions based on data patterns |
| Historical Campaign Learning | Agent references past campaign performance in planning |

---

### 5. User Flows

#### Flow 1: AI-Driven Campaign (Primary)

```
Marketer opens Agent Chat
  → Types business goal: "Win back customers who haven't ordered in 30 days"
  → AI analyzes customer data (visible tool calls)
  → AI identifies audience: 2,100 customers matching criteria
  → AI recommends channels: WhatsApp (1,200), SMS (600), Email (300)
  → AI generates personalized message variants per channel
  → AI presents campaign card with confidence score (87%)
  → Marketer reviews and clicks "Approve & Launch"
  → Campaign executes (messages queued → sent to channel service)
  → Real-time delivery status flows in
  → AI summarizes performance when complete
```

#### Flow 2: Manual Campaign with AI Assist

```
Marketer navigates to Segments
  → Creates segment using visual filters OR natural language
  → Reviews audience preview (count, demographics breakdown)
  → Clicks "Campaign this segment"
  → Redirected to Campaign Builder
  → AI pre-fills message template based on segment characteristics
  → Marketer tweaks message, selects channels
  → Launches campaign
  → Monitors in Campaign Detail with live pulse
```

#### Flow 3: Analytics Review

```
Marketer opens Dashboard
  → Sees overview metrics + AI suggestions
  → Clicks into a completed campaign
  → Views delivery funnel (animated)
  → Reviews per-channel performance comparison
  → Reads AI-generated insight summary
  → Clicks "Run similar campaign" → Agent Chat pre-filled
```

---

### 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Page load (Lighthouse) | < 2s FCP on 4G |
| API response time | < 200ms for CRUD, < 5s for AI streaming start |
| Campaign throughput | 100 messages/second sustained |
| Webhook processing | < 100ms per callback (queue-first) |
| Realtime latency | < 500ms from webhook to UI update |
| Uptime (demo) | 99% during evaluation period |
| Mobile responsive | Functional on tablet+ (not primary mobile) |

---

### 7. Out of Scope (Explicit)

- Real messaging provider integration (Twilio, Gupshup, etc.)
- User authentication / multi-tenant (single brand demo)
- Payment processing
- Sales pipelines, deals, leads, tickets
- A/B testing framework (mentioned as future in TRADEOFFS.md)
- Email template builder (rich HTML editor)
- Scheduled campaigns (future — campaigns execute immediately on approval)
- GDPR/compliance automation (would add in production)

---

### 8. Success Metrics (Demo Context)

| Metric | Target |
|--------|--------|
| End-to-end campaign from NL goal to completion | < 60 seconds |
| AI agent correctly identifies audience from vague goal | 90%+ of demo scenarios |
| All webhook callbacks processed without data loss | 100% |
| Live delivery pulse updates within 1s of webhook | Verified |
| All 7 screens functional and polished | Verified |

---

### 9. Quality Assurance Protocol

**Active Skills Used Throughout Development:**

| Skill | When Applied | What It Does |
|-------|-------------|-------------|
| `/self-review` | After EVERY code change | Re-read, check bugs, edge cases, types, security |
| `/skill-forge` | After phases 2, 4, 7, 9 | Compare against best-in-class, identify gaps, improve |
| `/prompt-amplifier` | Before every implementation step | Expand intent into full spec with success criteria |

**Testing Pyramid:**
- **Unit Tests:** Every service function, every AI tool, every component
- **Integration Tests:** Cross-service communication loops
- **Edge Case Tests:** Failure modes, race conditions, invalid inputs
- **E2E Tests:** Full demo scenarios (5 canonical paths)

**Continuous Improvement Cycle:**
```
After every phase:
1. Run tests → identify coverage gaps → add missing tests
2. Self-review all code → fix issues before moving on
3. Compare against research (hackathon winners) → implement improvements
4. Update documentation → keep PRD/TRD/ARCHITECTURE.md current
5. Prove it works → evidence (test output, curl, screenshot)
```

**Quality Gates (Cannot proceed to next phase without):**
- All existing tests pass (zero failures)
- Self-review checklist completed (no unresolved issues)
- At least one improvement identified and implemented
- Documentation reflects current state
- Phase is independently demo-able
