# AGENTS.md

## Project

- Name: ReachAI
- Type: AI-native Mini CRM for BrewPulse (premium coffee chain)
- Assignment: Xeno Engineering Internship 2026
- Deadline: June 15, 2026 12:00 PM IST
- GitHub: Adit-Jain-srm/xeno-reach-ai

## Stack

- Frontend: React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Zustand + TanStack Query + Recharts
- Backend: Express/TypeScript on port 3001
- Channel Service: Separate Express/TypeScript delivery simulator on port 3002
- Database: Supabase (Postgres + Realtime)
- AI: Azure OpenAI (GPT-4o for strategy, GPT-4o-mini for generation)
- Queue: Upstash Redis (serverless, HTTP-based)
- Deployment: Vercel (frontend) + Railway (backend + channel-service)

## Learned User Preferences

- ALWAYS use Mermaid diagrams — NEVER use ASCII art (user explicitly corrected this)
- Go BROAD + DEEP — rejected the "pick one" framing; wants maximum scope and quality simultaneously
- Maximum effort / hackathon-winning quality standard on every output
- Embed testing + self-improvement loops after every implementation phase
- Attach `max-effort` and `skill-forge` skills to every session for this project
- User prefers streaming agent responses with visible reasoning (not spinners)
- Prefer bold, opinionated product choices over building everything shallowly

## Learned Workspace Facts

- Shell is PowerShell on Windows — heredocs (`<<EOF`) do not work; use Write-Output or direct strings
- Supabase project ref: fezjpfcrikzirfypjjcp
- Supabase URL: https://fezjpfcrikzirfypjjcp.supabase.co
- Azure OpenAI endpoint: https://aditjain2005-0132-resource.openai.azure.com
- Azure OpenAI deployment name: gpt-4o (API version 2025-01-01-preview)
- Vercel scope: aj5
- Frontend dev port: 5173, Backend: 3001, Channel Service: 3002
- Webhook secret shared between services: reachai-webhook-secret-2026
- Monorepo structure: /frontend, /backend, /channel-service, /shared, /scripts, /tests, /docs
- Seed data target: 10K customers, 50K+ orders, 5 historical campaigns
- A `.cursor/rules/diagrams.mdc` rule enforces Mermaid-only diagrams in markdown files
- Event-sourced communication status via append-only `communication_events` table + Postgres triggers
