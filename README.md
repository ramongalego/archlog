# ArchLog

ArchLog is a decision logging platform for solo founders and small teams. It provides a dedicated place to capture decisions as they happen, record the reasoning and context behind them, track outcomes over time, and query that history using natural language.

The product is built around a simple loop: **capture, context, outcome, query.** Users log a decision with structured fields, get reminded to review outcomes after a configurable review period, and can ask questions like "have we tried anything like this before?" against their own history.

## What It Does

- **Structured decision capture.** Users write a rough note and optionally ask the AI to structure it into a clean entry. The original note is always preserved.
- **Timeline and filters.** Decisions are browsable in reverse chronological order, filterable by category, outcome status, date range, and project.
- **Outcome tracking.** After a configurable review window, the dashboard prompts the user to mark a decision as vindicated, reversed, or still playing out.
- **Natural language query.** Users can ask questions across their decision history and get a streamed, source cited answer grounded in their own entries.
- **Projects and teams.** Decisions are scoped to projects. Paid tiers support shared projects with role based access.
- **Integrations.** GitHub, GitLab, and Notion integrations surface potential decisions and suggest them for logging.
- **Weekly digest.** A weekly email summarises recent activity, outcomes due for review, and resurfaces a past decision for reflection.
- **Billing.** Free, Pro, and Team tiers managed through Stripe.

## Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript (strict mode) |
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Rich text | Tiptap |
| Database | Supabase Postgres with pgvector |
| Auth | Supabase Auth |
| AI | Anthropic SDK (Claude) |
| Background jobs | Trigger.dev |
| Email | Resend |
| Payments | Stripe |
| Validation | Zod |
| Testing | Jest and React Testing Library |

## Architecture

ArchLog is a server first Next.js application. Data fetching and mutations run through Server Components and Server Actions by default. Client components are reserved for genuinely interactive surfaces such as the editor, filter controls, and the AI query chat.

### High level flow

```
 Browser
   |
   v
 Next.js App Router
   |                          |                        |
   v                          v                        v
 Supabase Postgres     Anthropic API            Stripe / Resend
   ^                          ^
   |                          |
   +------ Background jobs ---+
```

Postgres is the single source of truth. Semantic search is powered by pgvector, with embeddings kept in sync asynchronously. AI features cover structured drafting from rough notes, retrieval augmented query over a user's own history, and extracting suggested decisions from integration payloads.

### Design principles

- **App Router and server first.** Default to Server Components and Server Actions; opt into client components only where interactivity demands it.
- **Simplicity over abstraction.** Flat colocation, no premature indirection, types and helpers added when a second or third caller appears.
- **Type safety end to end.** Strict TypeScript, Zod at trust boundaries, and generated types for the database layer.
- **Performance by default.** Embedding work is asynchronous and debounced, AI responses are streamed, and images are optimised.
