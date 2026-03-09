# Implementation Plan: ArchLog Decision Logging MVP

**Branch**: `001-decision-log-mvp` | **Date**: 2026-03-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-decision-log-mvp/spec.md`

## Summary

ArchLog is a decision logging platform for solo founders and small teams. Users capture decisions with structured fields (title, reasoning, context, confidence, category), track outcomes over time, and query their history using natural language AI search. Built as a Next.js App Router application with Supabase (Postgres + Auth + RLS), pgvector for semantic search, Claude API for AI features, Stripe for billing, Resend for emails, and Trigger.dev for background jobs.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Framework**: Next.js 15 (App Router)
**Primary Dependencies**: Supabase (Auth, Postgres, RLS, Edge Functions), Tiptap, Anthropic SDK, Stripe, Resend, Trigger.dev
**Storage**: Supabase Postgres with pgvector extension
**Testing**: Jest + React Testing Library
**Target Platform**: Web (desktop + mobile-responsive)
**Project Type**: Web application (SaaS)
**Performance Goals**: Cold page load < 2s, AI query response streamed (no full-page wait)
**Constraints**: Mobile-responsive decision capture, no client-side storage beyond draft auto-save
**Scale/Scope**: 1,000 concurrent users, ~50 decisions per user on free tier, unlimited on Pro

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                    | Status | Notes                                                                                                                                                    |
| ---------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I. App Router & Server-First | PASS   | All data fetching via Server Components and Server Actions. `"use client"` only for Tiptap editor, filter controls, AI query input, and Stripe checkout. |
| II. Simplicity               | PASS   | Flat colocation structure. No premature abstractions. Tiptap custom blocks reduced to paragraph + bullet list only for MVP (callout deferred).           |
| III. Type Safety             | PASS   | TypeScript strict mode. Shared types in `types/`. Supabase generates types from schema. No `any`.                                                        |
| IV. Testing                  | PASS   | Jest + RTL for components. Integration tests for auth flows, decision CRUD, and Stripe webhooks.                                                         |
| V. Performance               | PASS   | Server Components by default. Embedding generation is async (debounced, not on every save). AI query streamed. Images via `next/image`.                  |

All gates pass. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-decision-log-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-routes.md
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx                    # Root layout (auth provider, sidebar)
│   ├── page.tsx                      # Marketing/landing page (public)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts         # Supabase auth callback
│   ├── (dashboard)/
│   │   ├── layout.tsx                # Dashboard shell (sidebar, project switcher)
│   │   ├── page.tsx                  # Dashboard home (outcome review prompts, recent decisions)
│   │   ├── decisions/
│   │   │   ├── page.tsx              # Decision timeline (history + filters)
│   │   │   ├── new/page.tsx          # New decision entry form
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Decision detail view
│   │   │       └── edit/page.tsx     # Edit decision
│   │   ├── ask/page.tsx              # AI query interface
│   │   ├── projects/
│   │   │   └── page.tsx              # Project management
│   │   └── settings/
│   │       └── page.tsx              # User settings (review period, digest, billing)
│   └── api/
│       ├── ai/
│       │   ├── draft/route.ts        # AI-assisted structuring
│       │   └── query/route.ts        # AI natural language query (streaming)
│       ├── stripe/
│       │   ├── checkout/route.ts     # Create Stripe Checkout session
│       │   └── webhook/route.ts      # Stripe webhook handler
│       └── trigger/route.ts          # Trigger.dev webhook endpoint
├── components/
│   ├── decisions/
│   │   ├── decision-card.tsx         # Timeline card
│   │   ├── decision-form.tsx         # Create/edit form with Tiptap
│   │   ├── outcome-form.tsx          # Outcome recording form
│   │   └── filter-bar.tsx            # Category/status/date filters
│   ├── ai/
│   │   ├── draft-preview.tsx         # AI draft suggestion UI
│   │   └── query-chat.tsx            # AI query input + streamed response
│   ├── projects/
│   │   └── project-switcher.tsx      # Sidebar project selector
│   └── ui/
│       ├── sidebar.tsx
│       ├── button.tsx
│       ├── input.tsx
│       ├── select.tsx
│       ├── badge.tsx
│       └── card.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   ├── server.ts                 # Server Supabase client
│   │   └── middleware.ts             # Auth middleware
│   ├── ai/
│   │   ├── draft.ts                  # Claude structuring prompt + call
│   │   ├── query.ts                  # Claude query prompt + streaming
│   │   └── embeddings.ts             # Embedding generation via Claude
│   ├── stripe/
│   │   ├── client.ts                 # Stripe client init
│   │   └── plans.ts                  # Plan tier definitions + limit checks
│   └── utils.ts                      # Shared helpers (date formatting, etc.)
├── types/
│   ├── database.ts                   # Supabase-generated types
│   ├── decisions.ts                  # Decision, Outcome, Category types
│   └── plans.ts                      # Billing plan types
├── jobs/
│   ├── outcome-reminders.ts          # Trigger.dev: daily outcome check
│   └── weekly-digest.ts              # Trigger.dev: Monday digest cron
└── middleware.ts                      # Next.js middleware (auth redirect)

supabase/
├── migrations/
│   ├── 001_initial_schema.sql        # Tables, enums, indexes
│   ├── 002_enable_pgvector.sql       # pgvector extension + embedding column
│   └── 003_rls_policies.sql          # Row Level Security policies
└── seed.sql                          # Default categories seed data

tests/
├── components/
│   ├── decision-form.test.tsx
│   ├── decision-card.test.tsx
│   └── filter-bar.test.tsx
├── lib/
│   ├── ai/draft.test.ts
│   └── stripe/plans.test.ts
└── integration/
    ├── auth-flow.test.ts
    ├── decision-crud.test.ts
    └── stripe-webhook.test.ts
```

**Structure Decision**: Next.js App Router with colocation. Route groups `(auth)` and `(dashboard)` separate public and authenticated areas. Components, lib, and types at `src/` level. Supabase migrations in `supabase/`. Tests mirror source structure. Trigger.dev jobs in `src/jobs/`.

## Complexity Tracking

No constitution violations — this section is intentionally empty.
