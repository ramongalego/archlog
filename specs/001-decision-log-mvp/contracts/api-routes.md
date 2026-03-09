# API Contracts: ArchLog Decision Logging MVP

**Date**: 2026-03-09
**Branch**: `001-decision-log-mvp`

All routes are Next.js App Router API routes (`app/api/`). Authentication is required unless noted.

---

## AI Routes

### POST /api/ai/draft

AI-assisted decision structuring. Takes a rough note and returns a structured suggestion.

**Auth**: Required. Available on Free and Pro tiers.

**Request**:

```json
{
  "raw_note": "string (required, max 5000 chars)"
}
```

**Response 200**:

```json
{
  "suggestion": {
    "title": "string",
    "why": "string (plain text summary)",
    "context": "string",
    "confidence": "low | medium | high",
    "category": "product | pricing | technical | hiring | marketing | other"
  }
}
```

**Errors**:

- 400: Missing or empty `raw_note`
- 401: Not authenticated
- 429: Rate limit exceeded (max 10 drafts per hour per user)
- 500: Claude API failure (returns user-friendly message)

---

### POST /api/ai/query

Natural language query against decision history. Streams the response.

**Auth**: Required. Pro tier only.

**Request**:

```json
{
  "question": "string (required, max 1000 chars)",
  "project_id": "uuid | null (null = all projects)"
}
```

**Response**: Server-Sent Events (SSE) stream

```
data: {"type": "chunk", "content": "Based on your decision from..."}
data: {"type": "chunk", "content": " March 2026..."}
data: {"type": "citations", "decisions": [{"id": "uuid", "title": "string", "created_at": "iso8601"}]}
data: {"type": "done"}
```

**Errors**:

- 400: Missing or empty `question`
- 401: Not authenticated
- 403: Free tier user attempting AI query
- 404: No decisions found (returns structured message, not an error stream)
- 429: Rate limit exceeded (max 20 queries per hour per user)
- 500: Claude API failure

---

## Stripe Routes

### POST /api/stripe/checkout

Creates a Stripe Checkout session for Pro subscription.

**Auth**: Required.

**Request**:

```json
{
  "price_id": "string (required)"
}
```

**Response 200**:

```json
{
  "checkout_url": "string (Stripe hosted checkout URL)"
}
```

**Errors**:

- 400: Invalid price_id
- 401: Not authenticated
- 409: User already has an active Pro subscription

---

### POST /api/stripe/webhook

Handles Stripe webhook events. No auth — verified via Stripe signature.

**Auth**: None (Stripe signature verification).

**Headers**: `stripe-signature` (required)

**Events handled**:

- `checkout.session.completed` → Create subscription record, update user tier to Pro
- `customer.subscription.updated` → Update subscription status and period
- `customer.subscription.deleted` → Set user tier back to Free, mark subscription canceled

**Response**: 200 (always, to acknowledge receipt)

---

## Trigger.dev Route

### POST /api/trigger

Trigger.dev webhook endpoint for job execution.

**Auth**: Trigger.dev signature verification.

**Jobs registered**:

- `outcome-reminders` (daily 09:00 UTC): Queries decisions with `outcome_due_date <= now()` and `outcome_status = 'pending'`. Sends batched Resend emails per user.
- `weekly-digest` (Monday 09:00 UTC): Compiles past-week decisions, pending outcomes, random past decision per user. Sends via Resend.

---

## Server Actions (App Router)

These are not API routes — they're Next.js Server Actions called directly from client components. Documented here for contract completeness.

### Decisions

| Action            | Input                                                                           | Output         | Plan Limits            |
| ----------------- | ------------------------------------------------------------------------------- | -------------- | ---------------------- |
| `createDecision`  | `{ project_id, title, why?, context?, confidence, category, custom_category? }` | `{ decision }` | Free: max 50 decisions |
| `updateDecision`  | `{ id, title?, why?, context?, confidence?, category?, custom_category? }`      | `{ decision }` | —                      |
| `archiveDecision` | `{ id }`                                                                        | `{ success }`  | —                      |
| `restoreDecision` | `{ id }`                                                                        | `{ success }`  | —                      |
| `recordOutcome`   | `{ id, outcome_status, outcome_notes? }`                                        | `{ decision }` | —                      |

### Projects

| Action           | Input                         | Output        | Plan Limits                    |
| ---------------- | ----------------------------- | ------------- | ------------------------------ |
| `createProject`  | `{ name, description? }`      | `{ project }` | Free: max 1 project            |
| `updateProject`  | `{ id, name?, description? }` | `{ project }` | —                              |
| `archiveProject` | `{ id }`                      | `{ success }` | Cannot archive default project |

### User Settings

| Action           | Input                                                                  | Output     |
| ---------------- | ---------------------------------------------------------------------- | ---------- |
| `updateSettings` | `{ default_review_days?, digest_opted_in?, timezone?, display_name? }` | `{ user }` |
