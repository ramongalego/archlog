# Data Model: ArchLog Decision Logging MVP

**Date**: 2026-03-09
**Branch**: `001-decision-log-mvp`

## Enums

### confidence_level

- `low`
- `medium`
- `high`

### decision_category

- `product`
- `pricing`
- `technical`
- `hiring`
- `marketing`
- `other`

### outcome_status

- `pending` — no outcome recorded yet
- `vindicated` — decision worked as intended
- `reversed` — decision was reversed/changed course
- `still_playing_out` — too early to tell
- `wrong` — decision didn't work, here's why

### subscription_tier

- `free`
- `pro`

## Tables

### users

Extends Supabase Auth `auth.users`. This table stores app-specific profile data.

| Column              | Type              | Constraints                   | Notes                         |
| ------------------- | ----------------- | ----------------------------- | ----------------------------- |
| id                  | uuid              | PK, references auth.users(id) | Same as Supabase Auth user ID |
| email               | text              | NOT NULL, UNIQUE              | Synced from auth.users        |
| display_name        | text              |                               | Optional display name         |
| default_review_days | integer           | NOT NULL, DEFAULT 90          | 30, 60, or 90                 |
| digest_opted_in     | boolean           | NOT NULL, DEFAULT true        | Weekly digest preference      |
| timezone            | text              | NOT NULL, DEFAULT 'UTC'       | For digest delivery timing    |
| stripe_customer_id  | text              | UNIQUE                        | Stripe customer reference     |
| subscription_tier   | subscription_tier | NOT NULL, DEFAULT 'free'      | Current billing tier          |
| created_at          | timestamptz       | NOT NULL, DEFAULT now()       |                               |
| updated_at          | timestamptz       | NOT NULL, DEFAULT now()       |                               |

**Validation**:

- `default_review_days` must be one of: 30, 60, 90
- `timezone` must be a valid IANA timezone string

---

### projects

| Column      | Type        | Constraints                                | Notes                                  |
| ----------- | ----------- | ------------------------------------------ | -------------------------------------- |
| id          | uuid        | PK, DEFAULT gen_random_uuid()              |                                        |
| user_id     | uuid        | NOT NULL, FK → users(id) ON DELETE CASCADE | Owner                                  |
| name        | text        | NOT NULL                                   | e.g., "My Decisions", "SaaS Product A" |
| description | text        |                                            | Optional project description           |
| is_default  | boolean     | NOT NULL, DEFAULT false                    | True for the auto-created project      |
| is_archived | boolean     | NOT NULL, DEFAULT false                    | Soft-delete for projects               |
| created_at  | timestamptz | NOT NULL, DEFAULT now()                    |                                        |
| updated_at  | timestamptz | NOT NULL, DEFAULT now()                    |                                        |

**Constraints**:

- Unique (user_id, name) where is_archived = false — no duplicate active project names per user
- Exactly one project per user must have is_default = true

**State transitions**:

- Active → Archived: decisions moved to default project
- Archived → Active: restored with original decisions (none moved back automatically)

---

### decisions

| Column               | Type              | Constraints                                | Notes                                               |
| -------------------- | ----------------- | ------------------------------------------ | --------------------------------------------------- |
| id                   | uuid              | PK, DEFAULT gen_random_uuid()              |                                                     |
| project_id           | uuid              | NOT NULL, FK → projects(id)                | Scoped to a project                                 |
| user_id              | uuid              | NOT NULL, FK → users(id) ON DELETE CASCADE | Denormalized for RLS performance                    |
| title                | text              | NOT NULL                                   | One-line statement of what was decided              |
| why                  | jsonb             |                                            | Tiptap JSON content — reasoning and trade-offs      |
| context              | text              |                                            | Situation that prompted the decision                |
| confidence           | confidence_level  | NOT NULL, DEFAULT 'medium'                 | How sure they were at the time                      |
| category             | decision_category | NOT NULL, DEFAULT 'product'                | Classification                                      |
| custom_category      | text              |                                            | If category = 'other', user-provided label          |
| outcome_status       | outcome_status    | NOT NULL, DEFAULT 'pending'                | Current outcome state                               |
| outcome_notes        | text              |                                            | Explanation of what happened                        |
| outcome_recorded_at  | timestamptz       |                                            | When outcome was recorded                           |
| outcome_due_date     | timestamptz       | NOT NULL                                   | Calculated: created_at + user's default_review_days |
| is_archived          | boolean           | NOT NULL, DEFAULT false                    | Soft-delete                                         |
| embedding            | vector(1536)      |                                            | pgvector embedding for semantic search              |
| embedding_updated_at | timestamptz       |                                            | When embedding was last generated                   |
| created_at           | timestamptz       | NOT NULL, DEFAULT now()                    |                                                     |
| updated_at           | timestamptz       | NOT NULL, DEFAULT now()                    |                                                     |

**Validation**:

- `title` must be non-empty (minimum 1 character after trimming)
- `why` must be valid Tiptap JSON or null
- `outcome_due_date` is auto-calculated on insert if not provided

**State transitions** (outcome_status):

- `pending` → `vindicated` | `reversed` | `still_playing_out` | `wrong`
- `still_playing_out` → `vindicated` | `reversed` | `wrong` | `still_playing_out` (re-review)
- `vindicated`, `reversed`, `wrong` are terminal states (can be changed but uncommon)

**Indexes**:

- `(user_id, created_at DESC)` — timeline query
- `(user_id, category)` — category filter
- `(user_id, outcome_status)` — status filter
- `(user_id, outcome_due_date)` WHERE outcome_status = 'pending' — outcome reminder job
- `(project_id)` — project scoping
- IVFFlat index on `embedding` — pgvector similarity search

---

### decision_edits

| Column              | Type              | Constraints                                    | Notes                   |
| ------------------- | ----------------- | ---------------------------------------------- | ----------------------- |
| id                  | uuid              | PK, DEFAULT gen_random_uuid()                  |                         |
| decision_id         | uuid              | NOT NULL, FK → decisions(id) ON DELETE CASCADE |                         |
| user_id             | uuid              | NOT NULL, FK → users(id)                       | For RLS                 |
| previous_title      | text              |                                                | Title before edit       |
| previous_why        | jsonb             |                                                | Why content before edit |
| previous_context    | text              |                                                | Context before edit     |
| previous_confidence | confidence_level  |                                                |                         |
| previous_category   | decision_category |                                                |                         |
| edited_at           | timestamptz       | NOT NULL, DEFAULT now()                        |                         |

**Notes**: Only populated fields that actually changed. A trigger on the `decisions` table creates an edit record before each update.

---

### subscriptions

| Column                 | Type        | Constraints                                        | Notes                            |
| ---------------------- | ----------- | -------------------------------------------------- | -------------------------------- |
| id                     | uuid        | PK, DEFAULT gen_random_uuid()                      |                                  |
| user_id                | uuid        | NOT NULL, FK → users(id) ON DELETE CASCADE, UNIQUE | One active sub per user          |
| stripe_subscription_id | text        | NOT NULL, UNIQUE                                   | Stripe reference                 |
| stripe_price_id        | text        | NOT NULL                                           | Which price they're on           |
| status                 | text        | NOT NULL                                           | active, canceled, past_due, etc. |
| current_period_start   | timestamptz |                                                    |                                  |
| current_period_end     | timestamptz |                                                    |                                  |
| created_at             | timestamptz | NOT NULL, DEFAULT now()                            |                                  |
| updated_at             | timestamptz | NOT NULL, DEFAULT now()                            |                                  |

---

## Row Level Security Policies

All tables enforce RLS scoped to `auth.uid()`:

- **users**: Users can only SELECT/UPDATE their own row
- **projects**: Users can only SELECT/INSERT/UPDATE/DELETE where `user_id = auth.uid()`
- **decisions**: Users can only SELECT/INSERT/UPDATE where `user_id = auth.uid()`
- **decision_edits**: Users can only SELECT where `user_id = auth.uid()` (inserts via trigger only)
- **subscriptions**: Users can only SELECT their own row (mutations via webhook only)

## Relationships

```
users 1──* projects
users 1──* decisions (denormalized)
users 1──1 subscriptions
projects 1──* decisions
decisions 1──* decision_edits
```

## Plan Limits

| Feature              | Free | Pro       |
| -------------------- | ---- | --------- |
| Projects             | 1    | Unlimited |
| Decisions            | 50   | Unlimited |
| AI Drafting          | Yes  | Yes       |
| AI Query             | No   | Yes       |
| Cross-project Search | No   | Yes       |
| Weekly Digest        | Yes  | Yes       |

Limits enforced at the application layer (Server Actions check `subscription_tier` + counts before allowing creates).
