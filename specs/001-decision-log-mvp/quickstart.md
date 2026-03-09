# Quickstart: ArchLog Decision Logging MVP

**Branch**: `001-decision-log-mvp`

## Prerequisites

- Node.js 20+
- npm
- Supabase CLI (`npx supabase`)
- A Supabase project (free tier works)
- Anthropic API key (Claude)
- Stripe account (test mode)
- Resend account (free tier)
- Trigger.dev account (free tier)

## 1. Clone and Install

```bash
git checkout 001-decision-log-mvp
npm install
```

## 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...

# Resend
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=digest@archlog.app

# Trigger.dev
TRIGGER_API_KEY=tr_dev_...
TRIGGER_API_URL=https://api.trigger.dev
```

## 3. Database Setup

```bash
# Link to your Supabase project
npx supabase link --project-ref your-project-ref

# Run migrations
npx supabase db push

# (Optional) Seed default categories
npx supabase db seed
```

## 4. Run Locally

```bash
# Start Next.js dev server
npm run dev

# In a separate terminal — start Trigger.dev dev worker
npx trigger.dev@latest dev
```

App runs at `http://localhost:3000`.

## 5. Stripe Webhook (Local Dev)

```bash
# Forward Stripe webhooks to local
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## 6. Run Tests

```bash
npm test              # All tests
npm test -- --watch   # Watch mode
```

## Key Development Commands

| Command                                                             | Purpose                        |
| ------------------------------------------------------------------- | ------------------------------ |
| `npm run dev`                                                       | Start Next.js dev server       |
| `npm run build`                                                     | Production build               |
| `npm run lint`                                                      | ESLint check                   |
| `npm run type-check`                                                | TypeScript strict check        |
| `npm test`                                                          | Run Jest tests                 |
| `npx supabase db push`                                              | Apply database migrations      |
| `npx supabase gen types typescript --local > src/types/database.ts` | Regenerate DB types            |
| `npx trigger.dev@latest dev`                                        | Start Trigger.dev local worker |
