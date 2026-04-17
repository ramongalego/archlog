import { z } from 'zod';

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url(),

  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  ANTHROPIC_API_KEY: z.string().min(1).optional(),

  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID: z.string().min(1).optional(),

  RESEND_API_KEY: z.string().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  GITHUB_CLIENT_ID: z.string().min(1).optional(),
  GITHUB_CLIENT_SECRET: z.string().min(1).optional(),
  GITHUB_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, 'GITHUB_ENCRYPTION_KEY must be 32 bytes hex (64 chars)')
    .optional(),

  GITLAB_CLIENT_ID: z.string().min(1).optional(),
  GITLAB_CLIENT_SECRET: z.string().min(1).optional(),
  GITLAB_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, 'GITLAB_ENCRYPTION_KEY must be 32 bytes hex (64 chars)')
    .optional(),

  NOTION_CLIENT_ID: z.string().min(1).optional(),
  NOTION_CLIENT_SECRET: z.string().min(1).optional(),
  NOTION_REDIRECT_URI: z.string().url().optional(),
  NOTION_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, 'NOTION_ENCRYPTION_KEY must be 32 bytes hex (64 chars)')
    .optional(),

  TEAM_INVITE_SECRET: z.string().min(32, 'TEAM_INVITE_SECRET must be at least 32 characters'),
  OAUTH_STATE_SECRET: z.string().min(32, 'OAUTH_STATE_SECRET must be at least 32 characters'),

  TRIGGER_SECRET_KEY: z.string().min(1).optional(),
});

type Env = z.infer<typeof serverSchema>;

function loadEnv(): Env {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

let cached: Env | null = null;

/**
 * Validated server-side environment variables.
 *
 * Access lazily: this throws on first read in environments where required
 * vars are missing (e.g. dev without a full .env), so importing it at
 * module load time in code that doesn't need every var would be fragile.
 */
export function env(): Env {
  if (!cached) cached = loadEnv();
  return cached;
}

export function isProduction(): boolean {
  return env().NODE_ENV === 'production';
}
