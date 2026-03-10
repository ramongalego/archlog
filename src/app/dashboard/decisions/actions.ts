'use server';

import { createClient } from '@/lib/supabase/server';
import { friendlyError } from '@/lib/supabase/errors';
import { daysFromNow } from '@/lib/utils';
import { canCreateDecision } from '@/lib/stripe/plans';
import { triggerEmbeddingGeneration } from '@/lib/ai/embeddings';
import {
  createDecisionSchema,
  updateDecisionSchema,
  recordOutcomeSchema,
  listDecisionsSchema,
  decisionIdSchema,
  parseFormData,
  parseTiptapJson,
} from '@/lib/validation';
import type { User, Decision } from '@/types/decisions';

export async function createDecision(formData: FormData): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const parsed = parseFormData(createDecisionSchema, formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const {
    project_id,
    title,
    why,
    context,
    confidence,
    category,
    custom_category,
    review_period_days,
  } = parsed.data;

  // Get user profile for plan limits and review days
  const { data: profile } = (await supabase
    .from('users')
    .select('subscription_tier, default_review_days')
    .eq('id', user.id)
    .single()) as { data: Pick<User, 'subscription_tier' | 'default_review_days'> | null };

  if (!profile) return { error: 'User profile not found' };

  // Check plan limits
  const { count } = await supabase
    .from('decisions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_archived', false);

  if (!canCreateDecision(profile.subscription_tier, count ?? 0)) {
    return {
      error:
        'You have reached the decision limit for your plan. Upgrade to Pro for unlimited decisions.',
    };
  }

  const whyResult = parseTiptapJson(why);
  if (whyResult.error) return { error: whyResult.error };

  const { data, error } = (await supabase
    .from('decisions')
    .insert({
      project_id,
      user_id: user.id,
      title,
      why: whyResult.data,
      context: context || null,
      confidence,
      category,
      custom_category: category === 'other' ? custom_category : null,
      review_period_days: review_period_days ?? profile.default_review_days,
      outcome_due_date: daysFromNow(review_period_days ?? profile.default_review_days),
    } as Decision)
    .select('id')
    .single()) as { data: { id: string } | null; error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };

  // Trigger embedding generation asynchronously (non-blocking)
  triggerEmbeddingGeneration(data!.id).catch(() => {});

  return { id: data!.id };
}

export async function listDecisions(params: {
  projectId?: string;
  search?: string;
  category?: string;
  outcomeStatus?: string;
  confidence?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
  showArchived?: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { decisions: [], total: 0 };

  const parsed = listDecisionsSchema.safeParse(params);
  if (!parsed.success) return { decisions: [], total: 0 };
  const {
    page,
    pageSize,
    projectId,
    search,
    category,
    outcomeStatus,
    confidence,
    dateFrom,
    dateTo,
  } = parsed.data;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('decisions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (!params.showArchived) {
    query = query.eq('is_archived', false);
  }

  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  if (search) {
    const term = `%${search}%`;
    query = query.or(`title.ilike.${term},context.ilike.${term}`);
  }
  if (category) {
    query = query.eq('category', category);
  }
  if (outcomeStatus) {
    query = query.eq('outcome_status', outcomeStatus);
  }
  if (confidence) {
    query = query.eq('confidence', confidence);
  }
  if (dateFrom) {
    query = query.gte('created_at', dateFrom);
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo);
  }

  const { data, count, error } = (await query) as {
    data: Decision[] | null;
    count: number | null;
    error: { message: string } | null;
  };

  if (error) return { decisions: [], total: 0 };
  return { decisions: data ?? [], total: count ?? 0 };
}

export async function recordOutcome(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const parsed = parseFormData(recordOutcomeSchema, formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { decision_id, outcome_status, outcome_notes } = parsed.data;

  const updateData: Record<string, unknown> = {
    outcome_status,
    outcome_notes: outcome_notes || null,
    outcome_recorded_at: new Date().toISOString(),
  };

  // If "still playing out", reset the review cycle using the decision's own period
  if (outcome_status === 'still_playing_out') {
    const { data: decision } = (await supabase
      .from('decisions')
      .select('review_period_days')
      .eq('id', decision_id)
      .eq('user_id', user.id)
      .single()) as { data: Pick<Decision, 'review_period_days'> | null };

    updateData.outcome_due_date = daysFromNow(decision?.review_period_days ?? 90);
  }

  const { error } = (await supabase
    .from('decisions')
    .update(updateData as Partial<Decision>)
    .eq('id', decision_id)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };

  // Regenerate embedding to include outcome context
  triggerEmbeddingGeneration(decision_id).catch(() => {});

  return {};
}

export async function updateDecision(formData: FormData): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const parsed = parseFormData(updateDecisionSchema, formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const {
    id,
    project_id,
    title,
    why,
    context,
    confidence,
    category,
    custom_category,
    review_period_days,
  } = parsed.data;

  const whyResult = parseTiptapJson(why);
  if (whyResult.error) return { error: whyResult.error };

  const updateData: Partial<Decision> = {
    title,
    why: whyResult.data,
    context: context || null,
    confidence,
    category,
    custom_category: category === 'other' ? custom_category : null,
  };

  if (project_id) {
    updateData.project_id = project_id;
  }

  if (review_period_days) {
    updateData.review_period_days = review_period_days;
    updateData.outcome_due_date = daysFromNow(review_period_days);
  }

  const { error } = (await supabase
    .from('decisions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };

  // Regenerate embedding with updated content
  triggerEmbeddingGeneration(id).catch(() => {});

  return { id };
}

export async function archiveDecision(id: string): Promise<{ error?: string }> {
  const parsed = decisionIdSchema.safeParse({ id });
  if (!parsed.success) return { error: 'Invalid decision ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = (await supabase
    .from('decisions')
    .update({ is_archived: true } as Partial<Decision>)
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}

export async function restoreDecision(id: string): Promise<{ error?: string }> {
  const parsed = decisionIdSchema.safeParse({ id });
  if (!parsed.success) return { error: 'Invalid decision ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = (await supabase
    .from('decisions')
    .update({ is_archived: false } as Partial<Decision>)
    .eq('id', parsed.data.id)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}
