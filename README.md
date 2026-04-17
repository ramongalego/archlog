# ArchLog

ArchLog is a decision logging platform for solo founders and small teams. It provides a dedicated place to capture decisions as they happen, record the reasoning and context behind them, track outcomes over time, and query that history using natural language.

The product is built around a simple loop: **capture, context, outcome, query.** Users log a decision with structured fields (title, reasoning, context, confidence, category), get reminded to review outcomes after a configurable review period, and can ask questions like "have we tried anything like this before?" against their own history.

## What It Does

- **Structured decision capture.** Users write a rough note and optionally ask the AI to structure it into a clean entry with title, reasoning, context, confidence level, and category. The original note is always preserved.
- **Timeline and filters.** Decisions are browsable in reverse chronological order, filterable by category, outcome status, date range, and project.
- **Outcome tracking.** After the configured review window (30, 60, or 90 days), the dashboard prompts the user to mark a decision as vindicated, reversed, or still playing out, with an optional note.
- **Natural language query.** Users can ask questions across their decision history. The system retrieves the most relevant past decisions via semantic search and returns a streamed, source cited answer grounded in the actual entries.
- **Projects and teams.** Decisions are scoped to projects. Teams on the paid tier can collaborate on shared projects with role based access.
- **Integrations.** GitHub, GitLab, and Notion integrations surface potential decisions from commits, merge requests, and pages, and suggest them for logging.
- **Weekly digest.** A Monday email summarises the past week's activity, outcomes due for review, and resurfaces a past decision for reflection.
- **Billing.** Free tier with a decision cap, Pro tier for individuals, and Team tier for collaboration, all managed through Stripe.

## Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript 5.x (strict mode) |
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS v4 |
| Rich text | Tiptap 3 |
| Database | Supabase Postgres with pgvector |
| Auth | Supabase Auth with SSR cookies |
| AI | Anthropic SDK (Claude) for drafting, extraction, and retrieval augmented query |
| Embeddings | Supabase Edge Function calling the embeddings model |
| Background jobs | Trigger.dev v4 |
| Email | Resend |
| Payments | Stripe Checkout and webhooks |
| Validation | Zod |
| Testing | Jest and React Testing Library |

## Architecture

ArchLog is a server first Next.js application. Data fetching and mutations run through Server Components and Server Actions by default. Client components are reserved for genuinely interactive surfaces: the Tiptap editor, filter controls, the AI query chat, and the Stripe checkout button.

### High level flow

```
 Browser
   |
   v
 Next.js App Router  (Server Components, Server Actions, Route Handlers)
   |                          |                        |
   v                          v                        v
 Supabase Postgres     Anthropic API            Stripe / Resend
 (RLS, pgvector)       (Claude + embeddings)   (billing + email)
   ^                          ^
   |                          |
   +---- Trigger.dev jobs ----+
        (reminders, digests, extraction)
```

### Data and security

Postgres is the single source of truth. Every user facing table (decisions, projects, outcomes, integrations, team members, suggestions) has Row Level Security policies, so the Supabase client can be used directly from server code without bespoke authorisation layers. Migrations live in `supabase/migrations/` and evolve the schema incrementally, including team tables, suggestion sources, and scoped RPCs for vector search.

Semantic search is powered by pgvector. Each decision has an embedding column that is kept in sync asynchronously by a Supabase Edge Function (`supabase/functions/generate-embedding/`). Queries go through a `match_decisions` RPC that enforces project scoping alongside similarity ranking.

### AI features

AI calls are encapsulated in `src/lib/ai/`:

- `draft.ts` structures a rough note into a clean decision via a single Claude call.
- `embeddings.ts` and `embed-query.ts` produce vectors for storage and for query time retrieval.
- `query.ts` runs the retrieval augmented generation flow: embed the question, fetch the top matching decisions through the scoped RPC, and stream a cited answer back to the client.
- `extract-decisions.ts` and `suggestion-pipeline.ts` turn integration payloads (GitHub commits, GitLab MRs, Notion pages) into suggested decisions the user can accept or discard.

### Background work

Long running or scheduled work runs on Trigger.dev:

- `src/jobs/outcome-reminders.ts` runs daily and flags decisions whose review period has elapsed.
- `src/jobs/weekly-digest.ts` runs Monday mornings and sends the digest email via Resend.

Integration syncs and extraction runs are triggered from Route Handlers in `src/app/api/` and dispatched into the same job system.

### Billing

Stripe Checkout is used for subscription purchase. The webhook handler in `src/app/api/stripe/webhook/route.ts` mirrors subscription state into Postgres, which is what plan limit checks in `src/lib/stripe/plans.ts` consult. The database is always authoritative for plan tier, not the Stripe API.

### Project layout

```
src/
  app/
    (auth)/          Login, signup, auth callback
    dashboard/       Authenticated product surface
      decisions/     Timeline, detail, new, edit
      ask/           AI query interface
      projects/      Project management
      team/          Team management (Team tier)
      integrations/  GitHub, GitLab, Notion connections
      suggestions/   Integration sourced decision suggestions
      analytics/     Usage and outcome metrics
      settings/      Review period, digest, billing
    api/             Route handlers (AI, Stripe, integrations, Trigger.dev)
  components/        UI, decisions, AI, projects, integrations, auth
  lib/
    ai/              Claude prompts, retrieval, extraction
    supabase/        Browser and server clients, middleware
    stripe/          Client and plan logic
    email/           Resend client and templates
    github/, gitlab/, notion/   Integration clients and crypto helpers
    team/            Invite tokens
  jobs/              Trigger.dev job definitions
  types/             Shared and generated types
supabase/
  migrations/        Schema evolution
  functions/         Edge Functions (embedding generation)
  seed.sql
```

### Design principles

- **App Router and server first.** Default to Server Components and Server Actions; opt into `"use client"` only where interactivity demands it.
- **Simplicity over abstraction.** Flat colocation, no premature indirection, types and helpers added when a second or third caller appears.
- **Type safety end to end.** TypeScript strict mode, Zod at trust boundaries, and Supabase generated types for the database layer.
- **Performance by default.** Embedding work is asynchronous and debounced, AI responses are streamed, and images go through `next/image`.
