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
- Azure OpenAI deployment name: gpt-4o (API version 2025-01-01-preview); gpt-4o-mini and gpt-5.3-chat do NOT work on this resource
- Vercel scope: aj5
- Vercel project name: xenoreach.ai (has deployment protection — must disable for public access)
- Railway project: 849038b9-555d-4df2-adee-503069d11cec
- Railway backend URL: https://backend-production-33a3.up.railway.app
- Railway channel-service URL: channel-service-production-7233.up.railway.app
- Railway requires Root Directory set per service: `backend` and `channel-service` respectively
- Railway uses Node 20 — requires `ws` package + `globalThis.WebSocket = WebSocket` polyfill for Supabase
- Frontend dev port: 5173, Backend: 3001, Channel Service: 3002
- Webhook secret shared between services: reachai-webhook-secret-2026
- Monorepo structure: /frontend, /backend, /channel-service, /shared, /scripts, /tests, /docs
- Each Railway service needs its own `railway.json` in its subdirectory
- Seed data target: 10K customers, 50K+ orders, 5 historical campaigns
- A `.cursor/rules/diagrams.mdc` rule enforces Mermaid-only diagrams in markdown files
- Event-sourced communication status via append-only `communication_events` table + Postgres triggers
- Vercel build requires `--legacy-peer-deps` due to vite 7/8 peer dep conflict with vitest
- react-router-dom must be v6 (v7 removed BrowserRouter which the app uses)
- Vercel inline env vars in buildCommand to avoid newline issues: `VITE_API_URL=... npx vite build`
- Frontend `react-is` package must be explicitly installed (recharts peer dep not auto-resolved)
