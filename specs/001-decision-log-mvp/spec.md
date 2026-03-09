# Feature Specification: ArchLog Decision Logging MVP

**Feature Branch**: `001-decision-log-mvp`
**Created**: 2026-03-09
**Status**: Draft
**Input**: User description: "ArchLog — a dedicated place to log decisions as they happen, understand why they were made, and look back at what actually happened. Core loop: capture → context → outcome → query."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Log a Decision (Priority: P1)

A founder just made a meaningful decision — say, to drop a feature from the roadmap. They open ArchLog, write a rough note about what they decided and why. The system helps them structure it into a proper entry with a clear statement, reasoning, context, confidence level, and category. The whole thing takes 2–3 minutes.

**Why this priority**: This is the core action of the product. Without low-friction decision capture, nothing else matters. If this doesn't work, users won't come back.

**Independent Test**: Can be fully tested by logging a decision and verifying it appears in the user's history with all structured fields populated. Delivers immediate value as a personal decision record.

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they create a new decision entry with a rough note, **Then** the system saves it with all required fields: title, reasoning, context, confidence level, category, and date.
2. **Given** a user writing a rough unstructured note, **When** they request AI assistance via an explicit action (e.g., "Help me structure this"), **Then** the system shows a structured preview with clear title, reasoning, and context that the user can accept, edit, or discard — the original rough note is always preserved.
3. **Given** a user creating a decision, **When** they select a confidence level, **Then** they can choose from Low, Medium, or High.
4. **Given** a user creating a decision, **When** they assign a category, **Then** they can choose from preset categories (product, pricing, technical, hiring, marketing) or create a custom one.
5. **Given** a brand new user who has just signed up, **When** they log their first decision, **Then** a default project ("My Decisions") is auto-created and the decision is assigned to it — no manual project setup required.

---

### User Story 2 - Browse and Filter Decision History (Priority: P2)

A founder wants to look back at the decisions they've made over the past quarter. They open the timeline view and see a chronological feed of all their decisions. They filter by category ("pricing") and see every pricing decision they've made, with outcomes visible at a glance.

**Why this priority**: The decision log only becomes valuable when users can navigate it. A timeline with filtering turns a pile of entries into a readable product journey.

**Independent Test**: Can be tested by creating several decisions across categories and date ranges, then verifying the timeline displays them chronologically and filters work correctly.

**Acceptance Scenarios**:

1. **Given** a user with multiple logged decisions, **When** they open the decision history, **Then** they see all decisions in reverse chronological order.
2. **Given** a user viewing the timeline, **When** they filter by category, **Then** only decisions in that category are displayed.
3. **Given** a user viewing the timeline, **When** they filter by outcome status (vindicated, reversed, still playing out, wrong, pending), **Then** only decisions matching that status are shown.
4. **Given** a user viewing the timeline, **When** they filter by date range, **Then** only decisions within that range are displayed.
5. **Given** a user viewing the timeline, **When** they combine multiple filters (e.g., category + date range), **Then** the results reflect all active filters.

---

### User Story 3 - Track Decision Outcomes (Priority: P2)

Three months ago, a founder decided to raise prices by 20%. Now the system prompts them: "It's been 90 days since you decided to raise prices — what happened?" They mark it as "Vindicated" and add a short note about the results. Over time, they build a personal track record of decision quality.

**Why this priority**: Outcome tracking is what turns ArchLog from a passive log into an active feedback loop. It's the key differentiator from generic note-taking apps.

**Independent Test**: Can be tested by creating a decision, advancing past the review period, and verifying the user receives a prompt and can record an outcome.

**Acceptance Scenarios**:

1. **Given** a decision was logged N days ago (where N matches the user's configured review period), **When** the review period elapses, **Then** the user sees a review prompt on their dashboard when they next log in.
2. **Given** a user is reviewing a past decision, **When** they record an outcome, **Then** they can select from: Vindicated, Reversed, Still playing out, or Wrong.
3. **Given** a user is recording an outcome, **When** they select a status, **Then** they can optionally add a note explaining what happened.
4. **Given** a user, **When** they configure their review period, **Then** they can choose from 30, 60, or 90 days (defaulting to 90 days).
5. **Given** a user marks an outcome as "Still playing out", **When** another review period elapses, **Then** the system prompts them again for a follow-up review.

---

### User Story 4 - Query Decision History with AI (Priority: P3)

A founder is about to make a decision about their tech stack. Before committing, they ask ArchLog: "Have we tried anything like this before?" The AI searches their decision history and surfaces a relevant past decision where they evaluated a similar approach — including what happened and why they moved on.

**Why this priority**: This is the most powerful feature but depends on having a critical mass of logged decisions. It transforms the log from an archive into an active memory layer. Lower priority because it requires P1 and P2 to be functional first.

**Independent Test**: Can be tested by logging several decisions with rich context, then asking natural language questions and verifying the AI returns relevant, source-cited answers.

**Acceptance Scenarios**:

1. **Given** a user with logged decisions, **When** they ask a natural language question, **Then** the system searches for the most relevant decisions (up to 20) and returns an answer grounded in those actual entries.
2. **Given** a user asks a question, **When** the AI responds, **Then** the response cites specific decisions as sources (with links to the original entries).
3. **Given** a user asks a question with no relevant decisions, **When** the AI responds, **Then** it clearly states that no matching decisions were found rather than fabricating an answer.
4. **Given** a user with multiple projects, **When** they ask a question, **Then** the query defaults to the currently selected project, with an explicit option to search across all projects.

---

### User Story 5 - Organise Decisions by Project (Priority: P3)

A founder runs two SaaS products. They create a separate project for each in ArchLog, keeping decisions organised. When they search, they can scope to one project or query across both.

**Why this priority**: Multi-project support is important for the target audience but is not required for initial single-product usage. Can be added after the core loop works.

**Independent Test**: Can be tested by creating two projects, logging decisions in each, and verifying decisions are correctly scoped and cross-project queries work.

**Acceptance Scenarios**:

1. **Given** a user, **When** they create a new project, **Then** it appears in their project list and can receive decisions.
2. **Given** a user with multiple projects, **When** they log a decision, **Then** they must assign it to a specific project.
3. **Given** a user viewing the timeline, **When** they select a project filter, **Then** only decisions from that project are shown.
4. **Given** a user using AI query, **When** they ask a question, **Then** they can choose to search within one project or across all projects.

---

### User Story 6 - Receive Weekly Digest (Priority: P4)

Every Monday, a founder receives a short email summarising the past week: decisions logged, outcomes due for review, and a random past decision surfaced for reflection. They can read it without logging in. This keeps the habit alive.

**Why this priority**: The digest is a retention mechanic, not a core feature. It only becomes valuable once users have an established decision log. Important for long-term engagement but not for initial adoption.

**Independent Test**: Can be tested by verifying that a user with logged decisions receives a correctly formatted weekly email containing the expected summary sections.

**Acceptance Scenarios**:

1. **Given** a user with an active account, **When** the weekly digest is sent, **Then** it includes: decisions logged that week, outcomes due for review, and one random past decision for reflection.
2. **Given** a user receives the digest, **When** they read it, **Then** they can understand the content without needing to log in to the application.
3. **Given** a user, **When** they access their notification preferences, **Then** they can opt in or out of the weekly digest.

---

### Edge Cases

- What happens when a user tries to log a decision with no title or reasoning? The system requires at least a title (the "what was decided" statement) and saves the entry; other fields are encouraged but optional.
- What happens when AI-assisted structuring misinterprets the user's intent? The user always sees the AI suggestion as a draft they can edit or discard — the original rough note is preserved.
- What happens when a user has no decisions logged and tries to use AI query? The system explains that there are no decisions to search and encourages them to start logging.
- What happens when the review period for a decision arrives but the user doesn't respond? The prompt remains visible in the application; a follow-up reminder is included in the next weekly digest. The decision stays in "pending review" status.
- What happens when a user deletes a project that has decisions? Decisions are retained and moved to the default "My Decisions" project; they are not permanently deleted.
- What happens when a user wants to edit a decision after logging it? Users can edit any decision at any time; an edit history is maintained so the original reasoning is never lost.
- What happens when a user wants to delete a decision? Users can archive decisions to hide them from the timeline and queries, but archived decisions are not permanently destroyed — preserving the integrity of the decision record. Archived decisions can be restored.
- What happens when a user marks an outcome as "Still playing out"? The review cycle resets and the system prompts again after another full review period.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to create decision entries with: title (required), reasoning, context, confidence level (Low/Medium/High), category, and date.
- **FR-002**: System MUST provide AI-assisted structuring that takes a rough note and suggests a structured decision entry without altering the user's intent.
- **FR-003**: System MUST display a chronological timeline of all decisions, sorted newest first.
- **FR-004**: System MUST support filtering decisions by category, outcome status, and date range — individually and in combination.
- **FR-005**: System MUST prompt users to review decision outcomes after a configurable period (30, 60, or 90 days, default 90).
- **FR-006**: System MUST allow users to record outcomes as: Vindicated, Reversed, Still playing out, or Wrong — with an optional explanatory note.
- **FR-007**: System MUST support natural language queries against the user's decision history, returning answers grounded in actual logged decisions with source citations.
- **FR-008**: System MUST clearly indicate when no relevant decisions are found for a query, rather than generating unsupported answers.
- **FR-009**: System MUST auto-create a default project ("My Decisions") on user signup and support multiple projects per user, with decisions scoped to a specific project.
- **FR-010**: System MUST allow cross-project querying when using AI search.
- **FR-011**: System MUST send a configurable weekly digest email summarising: decisions logged that week, outcomes due for review, and one random past decision.
- **FR-012**: System MUST allow users to opt in or out of the weekly digest.
- **FR-013**: System MUST support user authentication so each user's decisions are private and secure.
- **FR-014**: System MUST allow editing of previously logged decisions while preserving edit history.
- **FR-015**: System MUST provide preset decision categories (product, pricing, technical, hiring, marketing) and allow users to create custom categories.
- **FR-016**: System MUST allow users to archive decisions (soft-delete), hiding them from the timeline and queries, while preserving them for potential restoration.
- **FR-017**: System MUST re-prompt users for outcome review when a previous outcome was marked "Still playing out" and another review period has elapsed.
- **FR-018**: System MUST deliver outcome review prompts as dashboard notifications visible on the user's next login (not via separate emails per decision).

### Key Entities

- **User**: A person with an account. Has authentication credentials, notification preferences, and owns one or more projects.
- **Project**: A named container for decisions. Belongs to a user. A user can have multiple projects. Has a name and optional description.
- **Decision**: The core entity. Belongs to a project. Contains: title, reasoning, context, confidence level (Low/Medium/High), category, date created, date modified, and edit history.
- **Outcome**: A review recorded against a decision. Contains: status (Vindicated/Reversed/Still playing out/Wrong), explanatory note, and date recorded. A decision has zero or one outcome.
- **Category**: A label for organising decisions. Can be a system preset or user-created custom category. Scoped to a user.
- **Digest**: A weekly email summary generated per user. Contains references to that week's decisions, pending outcome reviews, and a random past decision.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can log a structured decision in under 3 minutes, including AI-assisted structuring.
- **SC-002**: Users can find any past decision through timeline filtering in under 30 seconds.
- **SC-003**: AI query returns a relevant, source-cited answer within 5 seconds for 90% of queries against a user's decision history.
- **SC-004**: 70% of users who receive an outcome review prompt record an outcome within 7 days.
- **SC-005**: Weekly digest email open rate exceeds 40% among opted-in users.
- **SC-006**: Users who log at least 10 decisions report that ArchLog is a tool they would miss if it disappeared (measured via user survey, target: 80% agreement).
- **SC-007**: System supports at least 1,000 concurrent users without noticeable performance degradation.

## Assumptions

- Users authenticate via standard email/password or social login (OAuth2). No enterprise SSO is needed for the initial release.
- The AI-assisted structuring and querying features use a large language model with the user's decisions as context. The model does not retain user data between sessions.
- AI structuring is opt-in: the user explicitly requests it via a button/action — it never runs automatically on entry.
- AI query uses semantic search to find the most relevant decisions (up to 20) as context, not the entire decision history.
- Decision data is private by default — there is no sharing or collaboration feature in this version.
- The weekly digest is sent via email on Monday mornings in the user's local timezone; no in-app notification system is required for the MVP beyond the dashboard outcome review prompts.
- Outcome review prompts appear on the user's dashboard (in-app), not as individual emails. They are also included in the weekly digest as a secondary reminder.
- Custom categories are scoped per user (not shared across a team), since the primary audience is solo founders.
- A default project ("My Decisions") is auto-created on signup to eliminate onboarding friction. Users can rename it or create additional projects at any time.
- Decisions cannot be permanently deleted — only archived (soft-deleted) and restored. This preserves the integrity of the historical record.
- The product is a web application; native mobile apps are out of scope for this version.
