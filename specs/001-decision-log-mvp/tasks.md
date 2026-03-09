# Tasks: ArchLog Decision Logging MVP

**Input**: Design documents from `/specs/001-decision-log-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-routes.md, quickstart.md

**Tests**: Not explicitly requested - test tasks omitted. Add tests per story as needed.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and basic configuration

- [x] T001 Initialize Next.js 15 project with App Router and TypeScript strict mode in `src/`
- [x] T002 Install core dependencies: `@supabase/supabase-js`, `@supabase/ssr`, `tailwindcss`, `@tiptap/react`, `@tiptap/starter-kit`, `@anthropic-ai/sdk`, `stripe`, `resend`, `@trigger.dev/sdk`
- [x] T003 [P] Configure ESLint and Prettier per constitution in `eslint.config.js` and `.prettierrc`
- [x] T004 [P] Create `.env.example` with all required environment variables per `quickstart.md`
- [x] T005 [P] Configure Tailwind CSS in `tailwind.config.ts` with custom theme tokens (colors, spacing, typography)
- [x] T006 Create base project folder structure per plan.md: `src/app/`, `src/components/`, `src/lib/`, `src/types/`, `src/jobs/`, `supabase/migrations/`, `tests/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create Supabase migration for enums and base tables (users, projects, decisions, decision_edits, subscriptions) in `supabase/migrations/001_initial_schema.sql` per data-model.md
- [x] T008 Create Supabase migration to enable pgvector extension and add embedding column to decisions in `supabase/migrations/002_enable_pgvector.sql`
- [x] T009 Create Supabase migration for Row Level Security policies on all tables in `supabase/migrations/003_rls_policies.sql` per data-model.md RLS section
- [x] T010 Create seed file with default categories in `supabase/seed.sql`
- [x] T011 [P] Create Supabase server client helper in `src/lib/supabase/server.ts` (uses cookies for auth)
- [x] T012 [P] Create Supabase browser client helper in `src/lib/supabase/client.ts`
- [x] T013 [P] Generate and create TypeScript database types in `src/types/database.ts` from Supabase schema
- [x] T014 [P] Create shared decision and entity types in `src/types/decisions.ts` (Decision, Outcome, Category, ConfidenceLevel enums and interfaces)
- [x] T015 [P] Create billing plan types and limit constants in `src/types/plans.ts` and `src/lib/stripe/plans.ts` (Free: 1 project/50 decisions/no AI query, Pro: unlimited)
- [x] T016 Implement Next.js auth middleware in `src/middleware.ts` that redirects unauthenticated users to login (exclude marketing page and auth callback)
- [x] T017 Implement Supabase auth middleware helper in `src/lib/supabase/middleware.ts` for session refresh
- [x] T018 Create root layout in `src/app/layout.tsx` with Tailwind, font config, and metadata
- [x] T019 [P] Create auth callback route handler in `src/app/(auth)/callback/route.ts` for Supabase OAuth/magic link redirect
- [x] T020 [P] Create login page in `src/app/(auth)/login/page.tsx` with email/password and magic link forms
- [x] T021 [P] Create signup page in `src/app/(auth)/signup/page.tsx` with email/password form and default project auto-creation trigger
- [x] T022 Create dashboard layout shell in `src/app/(dashboard)/layout.tsx` with sidebar navigation and project switcher slot
- [x] T023 [P] Create shared UI components: Button in `src/components/ui/button.tsx`, Input in `src/components/ui/input.tsx`, Select in `src/components/ui/select.tsx`, Badge in `src/components/ui/badge.tsx`, Card in `src/components/ui/card.tsx`
- [x] T024 [P] Create sidebar component in `src/components/ui/sidebar.tsx` with nav links (Dashboard, Decisions, Ask, Projects, Settings)
- [x] T025 Create utility helpers in `src/lib/utils.ts` (date formatting, confidence/category display labels, cn class merge)

**Checkpoint**: Foundation ready - auth works, database schema deployed, dashboard shell renders. User story implementation can now begin.

---

## Phase 3: User Story 1 - Log a Decision (Priority: P1) MVP

**Goal**: A user can create a structured decision entry with AI-assisted drafting. The core capture loop works end-to-end.

**Independent Test**: Sign up, land on dashboard, create a new decision with AI draft assistance, see it saved with all fields. Full value delivered as a personal decision log.

### Implementation for User Story 1

- [x] T026 [P] [US1] Create Tiptap rich text editor component (paragraph + bullet list only) in `src/components/decisions/tiptap-editor.tsx` - client component with toolbar and JSON output
- [x] T027 [P] [US1] Create AI draft structuring prompt and Claude API call in `src/lib/ai/draft.ts` - takes raw note string, returns suggested title/why/context/confidence/category
- [x] T028 [US1] Create AI draft API route in `src/app/api/ai/draft/route.ts` - POST endpoint per contracts/api-routes.md, validates input, rate limits (10/hr/user), calls `src/lib/ai/draft.ts`
- [x] T029 [US1] Create draft preview component in `src/components/ai/draft-preview.tsx` - client component showing AI-suggested fields with accept/edit/discard actions, preserves original rough note
- [x] T030 [US1] Create decision form component in `src/components/decisions/decision-form.tsx` - client component with title input, Tiptap editors for why/context, confidence select (Low/Medium/High), category select (presets + custom), AI draft button, and auto-save to localStorage
- [x] T031 [US1] Create `createDecision` server action in `src/app/(dashboard)/decisions/actions.ts` - validates input, enforces free-tier 50 decision limit, calculates outcome_due_date from user's default_review_days, inserts decision, auto-creates default project if none exists
- [x] T032 [US1] Create new decision page in `src/app/(dashboard)/decisions/new/page.tsx` - renders decision-form, handles submission via server action, redirects to decision detail on success
- [x] T033 [US1] Create decision detail page in `src/app/(dashboard)/decisions/[id]/page.tsx` - server component that fetches and displays a single decision with all fields rendered (Tiptap content as HTML)
- [x] T034 [US1] Create dashboard home page in `src/app/(dashboard)/page.tsx` - shows recent decisions (last 5) and a prominent "Log a Decision" call-to-action
- [x] T035 [US1] Create marketing/landing page in `src/app/page.tsx` - public page with product description and sign-up CTA (server component, no auth required)

**Checkpoint**: User Story 1 complete. Users can sign up, log decisions with AI drafting, and view them. This is the MVP.

---

## Phase 4: User Story 2 - Browse & Filter Decision History (Priority: P2)

**Goal**: Users can see a chronological timeline of all their decisions and filter by category, outcome status, and date range.

**Independent Test**: Log several decisions across categories, open timeline, verify chronological order, apply filters individually and in combination.

### Implementation for User Story 2

- [x] T036 [P] [US2] Create decision card component in `src/components/decisions/decision-card.tsx` - displays title, category badge, confidence badge, outcome status badge, and relative date
- [x] T037 [P] [US2] Create filter bar component in `src/components/decisions/filter-bar.tsx` - client component with category select, outcome status select, date range picker, and clear-all button; updates URL search params
- [x] T038 [US2] Create decisions timeline page in `src/app/(dashboard)/decisions/page.tsx` - server component that fetches decisions with pagination (20 per page), applies filters from URL search params, renders decision cards in reverse chronological order
- [x] T039 [US2] Add `listDecisions` server action in `src/app/(dashboard)/decisions/actions.ts` - accepts filter params (category, outcome_status, date_from, date_to, project_id, page), returns paginated results with total count
- [x] T040 [US2] Add pagination controls to timeline page in `src/app/(dashboard)/decisions/page.tsx` - previous/next page links using URL search params

**Checkpoint**: User Story 2 complete. Users can browse and filter their entire decision history.

---

## Phase 5: User Story 3 - Track Decision Outcomes (Priority: P2)

**Goal**: Users are prompted to review past decisions when their outcome due date arrives. They record what happened and build a track record.

**Independent Test**: Create a decision, manually set outcome_due_date to today, verify review prompt appears on dashboard, record an outcome, verify status updates.

### Implementation for User Story 3

- [x] T041 [P] [US3] Create outcome form component in `src/components/decisions/outcome-form.tsx` - client component with status select (Vindicated/Reversed/Still playing out/Wrong), optional notes textarea, and submit button
- [x] T042 [US3] Add `recordOutcome` server action in `src/app/(dashboard)/decisions/actions.ts` - validates input, updates decision outcome_status/outcome_notes/outcome_recorded_at, if "Still playing out" resets outcome_due_date to now + user's default_review_days
- [x] T043 [US3] Update dashboard home page `src/app/(dashboard)/page.tsx` to show "Reviews Due" section - queries decisions where outcome_due_date <= now and outcome_status = 'pending', renders each with title, age, and inline outcome form
- [x] T044 [US3] Add outcome recording UI to decision detail page `src/app/(dashboard)/decisions/[id]/page.tsx` - show outcome form if status is pending or still_playing_out, show recorded outcome if terminal
- [x] T045 [US3] Create user settings page in `src/app/(dashboard)/settings/page.tsx` - form to update default_review_days (30/60/90 select), digest_opted_in toggle, timezone select, display name

**Checkpoint**: User Story 3 complete. Users get prompted for outcome reviews and can record what happened.

---

## Phase 6: User Story 4 - Query Decision History with AI (Priority: P3)

**Goal**: Users ask natural language questions against their decision history and get grounded, cited answers.

**Independent Test**: Log 5+ decisions with varied content, ask a question related to one of them, verify the AI returns a relevant answer citing the specific decision.

### Implementation for User Story 4

- [x] T046 [P] [US4] Create embedding generation trigger in `src/lib/ai/embeddings.ts` - calls Supabase Edge Function asynchronously after decision create/update/outcome
- [x] T047 [US4] Create Supabase Edge Function in `supabase/functions/generate-embedding/index.ts` - fetches decision, builds text from title/why/context/outcome, calls OpenAI text-embedding-3-small, stores vector in pgvector column
- [x] T048 [US4] Create AI query logic in `src/lib/ai/query.ts` - fetches recent decisions as context, passes to Claude, returns streaming response with citation detection
- [x] T049 [US4] Create AI query API route in `src/app/api/ai/query/route.ts` - POST endpoint, enforces Pro-only access, streams SSE response
- [x] T050 [US4] Create query chat component in `src/components/ai/query-chat.tsx` - client component with question input, streaming response display, citation links, project scoping
- [x] T051 [US4] Create Ask page in `src/app/(dashboard)/ask/page.tsx` - renders query chat component, shows upgrade CTA for free users, passes active project

**Checkpoint**: User Story 4 complete. Pro users can ask natural language questions and get cited answers from their decision history.

---

## Phase 7: User Story 5 - Organise Decisions by Project (Priority: P3)

**Goal**: Users can create multiple projects and scope decisions to each. Default project auto-created on signup.

**Independent Test**: Create a second project, log decisions in each, verify timeline scopes correctly, verify project switcher works.

### Implementation for User Story 5

- [x] T052 [P] [US5] Create project CRUD server actions in `src/app/(dashboard)/projects/actions.ts` - createProject (enforces free-tier 1 project limit), updateProject, archiveProject (moves decisions to default project, cannot archive default)
- [x] T053 [US5] Create project switcher component in `src/components/projects/project-switcher.tsx` - client component in sidebar showing active project with dropdown to switch; stores active project in cookie
- [x] T054 [US5] Create project management page in `src/app/(dashboard)/projects/page.tsx` - list projects, create new, rename, archive; shows decision count per project
- [x] T055 [US5] Update `listDecisions` server action in `src/app/(dashboard)/decisions/actions.ts` to scope queries by active project_id from project switcher
- [x] T056 [US5] Update `createDecision` server action in `src/app/(dashboard)/decisions/actions.ts` to require project_id from active project context
- [x] T057 [US5] Update sidebar `src/components/ui/sidebar.tsx` to integrate project switcher and mobile-responsive hamburger menu

**Checkpoint**: User Story 5 complete. Users can organise decisions across projects.

---

## Phase 8: User Story 6 - Weekly Digest & Outcome Reminders (Priority: P4)

**Goal**: Users receive a weekly email summarising their decision activity. Outcome reminder emails sent for overdue reviews.

**Independent Test**: Trigger digest job manually, verify email contains correct sections (recent decisions, pending outcomes, random past decision). Trigger reminder job, verify email sent for overdue decisions.

### Implementation for User Story 6

- [x] T058 [P] [US6] Configure Trigger.dev project in `trigger.config.ts`
- [x] T059 [P] [US6] Create Resend email utility in `src/lib/email/send.ts` - wrapper around Resend SDK with from address and error handling
- [x] T060 [US6] Create weekly digest email template in `src/lib/email/templates/weekly-digest.ts` - HTML + text template with sections: decisions this week, outcomes due, random past decision, unsubscribe link
- [x] T061 [US6] Create outcome reminder email template in `src/lib/email/templates/outcome-reminder.ts` - HTML + text template listing overdue decisions with direct links
- [x] T062 [US6] Create weekly digest Trigger.dev cron job in `src/jobs/weekly-digest.ts` - queries users with digest_opted_in=true, compiles data per user, sends via Resend
- [x] T063 [US6] Create outcome reminder Trigger.dev job in `src/jobs/outcome-reminders.ts` - finds overdue decisions, sends batched reminder email per user via Resend
- [x] T064 [US6] Update user settings page `src/app/(dashboard)/settings/page.tsx` to include digest opt-in/out toggle with immediate save

**Checkpoint**: User Story 6 complete. Retention mechanic is live - users get weekly digests and outcome reminders.

---

## Phase 9: Billing & Plan Enforcement (Cross-Cutting)

**Purpose**: Stripe integration for Free/Pro tiers and feature gating throughout the app.

- [x] T065 [P] Create Stripe client initialisation in `src/lib/stripe/client.ts`
- [x] T066 Create Stripe checkout route in `src/app/api/stripe/checkout/route.ts` - POST per contracts/api-routes.md, creates Checkout session for Pro price, redirects to Stripe hosted page
- [x] T067 Create Stripe webhook handler in `src/app/api/stripe/webhook/route.ts` - verifies signature, handles checkout.session.completed (create subscription + update tier), customer.subscription.updated, customer.subscription.deleted (revert to free)
- [x] T068 Add billing section to settings page `src/app/(dashboard)/settings/page.tsx` - shows current plan, upgrade button (links to Stripe Checkout), manage subscription button (links to Stripe Customer Portal via `src/app/api/stripe/portal/route.ts`)
- [x] T069 Enforce plan limits in all server actions - `createDecision` checks 50-decision limit for free tier, `createProject` checks 1-project limit for free tier, AI query route checks Pro-only access; return clear error messages for limit hits
- [x] T070 Add upgrade prompts in UI where features are gated - AI query page shows upgrade CTA for free users, project creation shows upgrade CTA when at limit, decision creation shows limit error message

**Checkpoint**: Billing complete. Free/Pro tiers enforced end-to-end.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Edit history, archive/restore, mobile responsiveness, performance, security

- [x] T071 [P] Create edit decision page in `src/app/(dashboard)/decisions/[id]/edit/page.tsx` - pre-populated decision form, calls `updateDecision` server action
- [x] T072 [P] Add `updateDecision` server action in `src/app/(dashboard)/decisions/actions.ts` - validates input, updates decision (edit history tracked via DB trigger)
- [x] T073 [P] Add `archiveDecision` and `restoreDecision` server actions in `src/app/(dashboard)/decisions/actions.ts` - toggles is_archived flag, excluded from timeline/queries by default
- [x] T074 Add edit history view to decision detail page `src/app/(dashboard)/decisions/[id]/page.tsx` - collapsible section showing previous versions with timestamps
- [x] T075 [P] Add mobile-responsive styles - sidebar collapses to hamburger menu on mobile, dashboard layout adds top padding for mobile menu button
- [x] T076 [P] Add Suspense boundary for edit history async loading in decision detail page
- [x] T077 Validate all API routes check session on every request and return 401 for unauthenticated calls; Stripe webhook signature verification is strict
- [x] T078 Quickstart validation - all env vars documented in .env.example (including OPENAI_API_KEY for embeddings), Supabase Edge Function created, Trigger.dev config present

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational - **this is the MVP**
- **US2 (Phase 4)**: Depends on Foundational; benefits from US1 decisions existing but not blocked
- **US3 (Phase 5)**: Depends on Foundational; benefits from US1 decisions existing but not blocked
- **US4 (Phase 6)**: Depends on Foundational; requires decisions to exist (US1) for meaningful testing
- **US5 (Phase 7)**: Depends on Foundational; touches US1/US2 actions (adds project scoping)
- **US6 (Phase 8)**: Depends on Foundational; needs decisions (US1) and outcomes (US3) for meaningful content
- **Billing (Phase 9)**: Depends on Foundational; enforces limits across US1/US4/US5
- **Polish (Phase 10)**: Depends on US1 at minimum; can run incrementally after each story

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational - **start here**
- **US2 (P2)**: Independent after Foundational - can run in parallel with US1
- **US3 (P2)**: Independent after Foundational - can run in parallel with US1/US2
- **US4 (P3)**: Needs at least a few decisions to exist (test after US1 complete)
- **US5 (P3)**: Modifies US1/US2 server actions (implement after US1/US2 for cleaner integration)
- **US6 (P4)**: Needs decisions + outcomes to have meaningful content (implement after US1/US3)

### Within Each User Story

- Models/types before server actions
- Server actions before pages/UI
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 2** (after T007-T010 migrations):

- T011, T012, T013, T014, T015 - all different files, run in parallel
- T019, T020, T021 - auth routes, independent pages
- T023, T024 - UI components, independent files

**Phase 3 (US1)**:

- T026, T027 - Tiptap editor and AI draft lib, independent files

**Phase 4 (US2)**:

- T036, T037 - decision card and filter bar, independent components

**Phase 6 (US4)**:

- T046 and T058/T059 (from US6) - embeddings lib and Trigger.dev setup, if doing US4 and US6 in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 - Log a Decision
4. **STOP and VALIDATE**: User can sign up, log decisions with AI drafting, view them
5. Deploy if ready - this is a usable product

### Incremental Delivery

1. Setup + Foundational -> Foundation ready
2. **US1** -> Log decisions with AI drafting -> Deploy (MVP!)
3. **US2** -> Timeline + filters -> Deploy
4. **US3** -> Outcome tracking -> Deploy
5. **Billing** -> Free/Pro tiers -> Deploy
6. **US4** -> AI query (Pro feature) -> Deploy
7. **US5** -> Multi-project -> Deploy
8. **US6** -> Weekly digest -> Deploy
9. **Polish** -> Edit history, archive, mobile -> Deploy

### Recommended Solo Founder Order

Since this is a solo project, work sequentially in priority order:

1. Setup -> Foundational -> **US1** (get the core loop working)
2. **US2 + US3** together (history + outcomes complete the feedback loop)
3. **Billing** (gate before adding expensive AI query)
4. **US4** (Pro-only AI query)
5. **US5 + US6** (project scoping + retention)
6. **Polish** (ongoing, not a separate phase in practice)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total: 78 tasks across 10 phases
- All 78 tasks complete
