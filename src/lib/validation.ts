import { z } from 'zod';
import type { Json } from '@/types/database';

// --- Shared enums ---

export const confidenceSchema = z.enum(['low', 'medium', 'high'], {
  error: 'Confidence must be low, medium, or high',
});
export const categorySchema = z.enum(
  ['product', 'pricing', 'technical', 'hiring', 'marketing', 'other'],
  { error: 'Please select a valid category' }
);
export const outcomeStatusSchema = z.enum(
  ['pending', 'vindicated', 'reversed', 'still_playing_out'],
  { error: 'Please select a valid outcome status' }
);

// --- Shared field schemas ---

const uuidSchema = z.string().uuid('Please provide a valid ID');
const trimmedString = (max: number, label: string) =>
  z.string().max(max, `${label} must be under ${max} characters`).trim();

// --- Tiptap JSON validation ---

/** Validates that a parsed object looks like a Tiptap document. */
function isValidTiptapDoc(value: unknown): value is { type: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'type' in value &&
    typeof (value as Record<string, unknown>).type === 'string'
  );
}

/**
 * Parse a JSON string and validate it as a Tiptap document.
 * Returns the parsed object or null if empty/invalid.
 */
export function parseTiptapJson(raw: string): { data: Json | null; error?: string } {
  if (!raw) return { data: null };
  try {
    const parsed = JSON.parse(raw);
    if (!isValidTiptapDoc(parsed)) {
      return { data: null, error: 'Invalid document format' };
    }
    return { data: parsed as Json };
  } catch {
    return { data: null, error: 'Invalid document format' };
  }
}

// --- Route param validation ---

/** Validate a UUID from a route param. Returns the validated ID or null. */
export function validateRouteId(id: string): string | null {
  const result = uuidSchema.safeParse(id);
  return result.success ? result.data : null;
}

// --- Decision schemas ---

export const createDecisionSchema = z.object({
  project_id: uuidSchema,
  title: trimmedString(200, 'Title').min(1, 'Title is required'),
  why: z.string().max(50000, 'Content is too long').optional().default(''),
  context: z.string().max(5000, 'Context must be under 5,000 characters').optional().default(''),
  confidence: confidenceSchema.default('medium'),
  category: categorySchema.default('product'),
  custom_category: trimmedString(100, 'Custom category').optional().default(''),
  review_period_days: z
    .string()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(
      z
        .number()
        .int()
        .refine((v) => [30, 60, 90, 180].includes(v), {
          message: 'Review period must be 30, 60, 90, or 180 days',
        })
        .optional()
    ),
});

export const updateDecisionSchema = z.object({
  id: uuidSchema,
  project_id: uuidSchema.optional(),
  title: trimmedString(200, 'Title').min(1, 'Title is required'),
  why: z.string().max(50000, 'Content is too long').optional().default(''),
  context: z.string().max(5000, 'Context must be under 5,000 characters').optional().default(''),
  confidence: confidenceSchema.default('medium'),
  category: categorySchema.default('product'),
  custom_category: trimmedString(100, 'Custom category').optional().default(''),
  review_period_days: z
    .string()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(
      z
        .number()
        .int()
        .refine((v) => [30, 60, 90, 180].includes(v), {
          message: 'Review period must be 30, 60, 90, or 180 days',
        })
        .optional()
    ),
});

export const recordOutcomeSchema = z.object({
  decision_id: uuidSchema,
  outcome_status: outcomeStatusSchema,
  outcome_notes: z
    .string()
    .max(5000, 'Outcome notes must be under 5,000 characters')
    .optional()
    .default(''),
});

export const listDecisionsSchema = z.object({
  projectId: uuidSchema.optional(),
  search: z.string().max(200, 'Search term is too long').optional(),
  category: categorySchema.optional(),
  outcomeStatus: outcomeStatusSchema.optional(),
  confidence: confidenceSchema.optional(),
  dateFrom: z.string().datetime({ message: 'Invalid start date' }).optional(),
  dateTo: z.string().datetime({ message: 'Invalid end date' }).optional(),
  page: z.number().int().min(1, 'Page must be at least 1').default(1),
  pageSize: z.number().int().min(1).max(100, 'Page size must be 100 or less').default(20),
});

export const decisionIdSchema = z.object({
  id: uuidSchema,
});

// --- Project schemas ---

export const createProjectSchema = z.object({
  name: trimmedString(100, 'Project name').min(1, 'Project name is required'),
  description: trimmedString(500, 'Description').optional().default(''),
});

export const updateProjectSchema = z.object({
  id: uuidSchema,
  name: trimmedString(100, 'Project name').min(1, 'Project name is required'),
  description: trimmedString(500, 'Description').optional().default(''),
});

export const projectIdSchema = z.object({
  projectId: uuidSchema,
});

// --- Settings schema ---

export const updateSettingsSchema = z.object({
  display_name: trimmedString(100, 'Display name').optional().default(''),
  default_review_days: z
    .number()
    .int()
    .refine((v) => [30, 60, 90, 180].includes(v), {
      message: 'Review period must be 30, 60, 90, or 180 days',
    }),
  digest_opted_in: z.boolean(),
  timezone: z.string().max(100, 'Timezone is too long').default('UTC'),
});

// --- Suggestion schemas ---

export const suggestionIdSchema = z.object({
  id: uuidSchema,
});

// --- Extract / AI schemas ---

export const extractTextSchema = z.object({
  text: z.string().min(1, 'Paste some text first').max(5000, 'Text must be under 5,000 characters'),
  projectId: uuidSchema,
});

export const aiDraftSchema = z.object({
  raw_note: z
    .string()
    .min(1, 'Write something to structure')
    .max(5000, 'Note must be under 5,000 characters'),
});

export const aiQuerySchema = z.object({
  question: z
    .string()
    .min(1, 'Ask a question')
    .max(2000, 'Question must be under 2,000 characters'),
  project_id: uuidSchema.optional(),
});

// --- GitHub schemas ---

export const selectRepoSchema = z.object({
  repo: z
    .string()
    .min(1, 'Select a repository')
    .max(200, 'Repository name is too long')
    .regex(/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/, 'Invalid repository format'),
});

export const githubScanSchema = z.object({
  project_id: uuidSchema,
});

// --- GitLab schemas ---

export const selectGitLabProjectSchema = z.object({
  project: z.string().min(1, 'Select a project').max(200, 'Project path is too long'),
});

export const gitlabScanSchema = z.object({
  project_id: uuidSchema,
});

// --- Helpers ---

/** Parse FormData into a plain object, then validate with a Zod schema. */
export function parseFormData<T extends z.ZodType>(schema: T, formData: FormData) {
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    raw[key] = typeof value === 'string' ? value : undefined;
  }
  return schema.safeParse(raw) as
    | { success: true; data: z.infer<T> }
    | { success: false; error: { issues: { message: string }[] } };
}
