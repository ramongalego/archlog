# Research: ArchLog Decision Logging MVP

**Date**: 2026-03-09
**Branch**: `001-decision-log-mvp`

## R1: Embedding Strategy (Latency & Cost)

**Decision**: Debounced async embedding generation — not on every save.

**Rationale**: Generating embeddings on every keystroke/save adds latency and API cost, especially during frequent edits. Instead:

- Embeddings are generated asynchronously after a decision is created or updated
- A Supabase Edge Function triggers on insert/update with a 30-second debounce — if the user saves multiple times in quick succession, only the final version gets embedded
- Embedding generation never blocks the UI; decisions are immediately visible in the timeline without waiting for the embedding
- Decisions without embeddings are still findable via text-based filters (category, date, status); they just won't appear in semantic AI query results until embedded

**Alternatives considered**:

- Synchronous embedding on save: rejected — adds 1-2s latency per save, poor UX for frequent editors
- Batch nightly job: rejected — too much delay; a decision logged in the morning wouldn't be queryable until the next day
- Client-side embedding: rejected — requires exposing API keys or a proxy, adds complexity

## R2: Tiptap Editor Scope for MVP

**Decision**: Ship with paragraph and bullet list blocks only. No custom callout/trade-offs block for MVP.

**Rationale**: Tiptap's default StarterKit provides paragraph, bold, italic, bullet list, and ordered list out of the box. Custom block types (callout, trade-offs panel) require building custom node views, which adds significant development time without proportional user value at launch. The "why" and "context" fields are well-served by simple prose with bullet lists.

**Alternatives considered**:

- Full custom block types from day one: rejected — adds 2-3 days of development for a nice-to-have
- Markdown textarea instead of Tiptap: rejected — Tiptap provides better UX (formatting toolbar, paste handling) and stores structured JSON that's easier to process for embeddings
- Plain textarea: rejected — too spartan for the target audience who are used to modern editors

## R3: AI Drafting — Free Tier as Hook

**Decision**: AI-assisted drafting is available on Free tier. AI query (natural language search) is Pro-only.

**Rationale**: Drafting is the UX hook that makes decision logging feel effortless from day one. Gating it would undermine the core "log in under 3 minutes" promise. AI query is the power feature that becomes valuable once users have 10+ decisions — natural conversion point to Pro. Cost-wise, drafting is a single Claude API call per decision (~$0.01-0.03/call at typical prompt sizes), which is manageable at free-tier volumes (50 decisions max).

**Alternatives considered**:

- Gate both to Pro: rejected — removes the magic from free tier, reduces stickiness
- Unlimited free everything: rejected — AI query at scale is expensive (embedding + retrieval + synthesis per query)
- Usage-based metering: rejected — adds billing complexity for MVP, confusing for users

## R4: Supabase Auth Strategy

**Decision**: Email/password + magic link via Supabase Auth. Social login (Google, GitHub) as optional enhancement.

**Rationale**: Supabase Auth handles email/password and magic link out of the box with minimal configuration. Social logins can be added later via Supabase's built-in OAuth providers without changing the auth architecture. For solo founders, email auth is sufficient; magic link reduces friction further.

**Alternatives considered**:

- Custom auth with JWT: rejected — reinventing the wheel, security risk
- Auth.js (NextAuth): rejected — adds a dependency when Supabase Auth already provides everything needed
- Social-only (no email/password): rejected — some users prefer email/password, especially in B2B contexts

## R5: Stripe Integration Pattern

**Decision**: Stripe Checkout + Customer Portal + webhooks. No custom billing UI.

**Rationale**: Stripe Checkout handles the entire payment flow (card entry, SCA, receipts). Customer Portal handles plan changes, cancellation, and invoice history. This means zero custom billing UI code — the app just redirects to Stripe-hosted pages. Webhooks update the local subscription state.

**Alternatives considered**:

- Custom payment form with Stripe Elements: rejected — unnecessary complexity for two simple tiers
- LemonSqueezy: rejected — less ecosystem support, would require learning a new API
- No billing for MVP: considered but rejected — the free/pro split is fundamental to the product model and informs feature gating from day one

## R6: Trigger.dev for Background Jobs

**Decision**: Use Trigger.dev for outcome reminders (daily) and weekly digest (Monday cron).

**Rationale**: Trigger.dev integrates natively with Next.js, supports cron schedules, and provides a dashboard for monitoring job runs. It avoids running a separate worker process. The two jobs are:

1. **Outcome reminders**: Daily at 09:00 UTC — query decisions where `outcome_due_date <= today` and `outcome_status = 'pending'`, send Resend email per user (batched)
2. **Weekly digest**: Monday 09:00 UTC — compile decisions from past 7 days, pending outcomes, one random decision; send via Resend

**Alternatives considered**:

- Vercel Cron: rejected — limited to 1-minute minimum intervals and basic scheduling; no built-in monitoring or retry
- Inngest: viable alternative but Trigger.dev has better Next.js integration docs
- Supabase Edge Functions on cron: rejected — less visibility into job failures, harder to debug

## R7: pgvector Semantic Search Configuration

**Decision**: Use `vector(1536)` with cosine similarity, top-20 retrieval, scoped by project_id with RLS.

**Rationale**: Claude's embedding model outputs 1536-dimensional vectors. Cosine similarity is the standard metric for text embeddings. Retrieving top-20 results provides enough context for Claude to synthesize a useful answer without exceeding token limits. RLS ensures users can only search their own decisions.

**Alternatives considered**:

- OpenAI embeddings: rejected — adding a second AI vendor; Claude handles both generation and embedding
- Full-text search only (no vectors): rejected — misses semantic similarity (e.g., "pricing change" matching "we raised prices")
- Pinecone/Weaviate external vector DB: rejected — Supabase pgvector keeps everything in one database, simpler ops

## R8: Outcome Review Prompt Delivery

**Decision**: Dashboard in-app prompts + inclusion in weekly digest email. No per-decision reminder emails.

**Rationale**: Per-decision emails would be noisy for users with many decisions hitting their review dates. Instead:

- The dashboard shows a "Reviews Due" section when decisions have passed their outcome_due_date
- The weekly digest includes a summary of all pending reviews
- The daily Trigger.dev job only updates internal state (marking decisions as "review due"); it does NOT send individual emails
- Exception: if a decision has been overdue for 2+ weeks and wasn't in the last digest, a single nudge email is sent

**Alternatives considered**:

- Email per decision: rejected — too noisy, especially for power users
- In-app only, no email: rejected — users might not log in frequently enough; the digest is the retention hook
- Push notifications: rejected — no mobile app in MVP scope
