'use server';

import { createClient } from '@/lib/supabase/server';
import { friendlyError } from '@/lib/supabase/errors';
import { daysFromNow } from '@/lib/utils';
import { canCreateDecision } from '@/lib/stripe/plans';
import { triggerEmbeddingGeneration } from '@/lib/ai/embeddings';
import type {
  OutcomeStatus,
  DecisionCategory,
  ConfidenceLevel,
  User,
  Decision,
} from '@/types/decisions';

export async function createDecision(formData: FormData): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

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

  const projectId = formData.get('project_id') as string;
  const title = formData.get('title') as string;
  const whyStr = formData.get('why') as string;
  const context = formData.get('context') as string;
  const confidence = formData.get('confidence') as ConfidenceLevel;
  const category = formData.get('category') as DecisionCategory;
  const customCategory = formData.get('custom_category') as string | null;

  if (!title?.trim()) return { error: 'Title is required' };

  const { data, error } = (await supabase
    .from('decisions')
    .insert({
      project_id: projectId,
      user_id: user.id,
      title: title.trim(),
      why: whyStr ? JSON.parse(whyStr) : null,
      context: context || null,
      confidence: confidence || 'medium',
      category: category || 'product',
      custom_category: category === 'other' ? customCategory : null,
      outcome_due_date: daysFromNow(profile.default_review_days),
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
  category?: DecisionCategory;
  outcomeStatus?: OutcomeStatus;
  confidence?: ConfidenceLevel;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { decisions: [], total: 0 };

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('decisions')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (params.projectId) {
    query = query.eq('project_id', params.projectId);
  }
  if (params.category) {
    query = query.eq('category', params.category);
  }
  if (params.outcomeStatus) {
    query = query.eq('outcome_status', params.outcomeStatus);
  }
  if (params.confidence) {
    query = query.eq('confidence', params.confidence);
  }
  if (params.dateFrom) {
    query = query.gte('created_at', params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte('created_at', params.dateTo);
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

  const decisionId = formData.get('decision_id') as string;
  const outcomeStatus = formData.get('outcome_status') as OutcomeStatus;
  const outcomeNotes = formData.get('outcome_notes') as string;

  if (!decisionId || !outcomeStatus) return { error: 'Missing required fields' };

  const updateData: Record<string, unknown> = {
    outcome_status: outcomeStatus,
    outcome_notes: outcomeNotes || null,
    outcome_recorded_at: new Date().toISOString(),
  };

  // If "still playing out", reset the review cycle
  if (outcomeStatus === 'still_playing_out') {
    const { data: profile } = (await supabase
      .from('users')
      .select('default_review_days')
      .eq('id', user.id)
      .single()) as { data: Pick<User, 'default_review_days'> | null };

    updateData.outcome_due_date = daysFromNow(profile?.default_review_days ?? 90);
  }

  const { error } = (await supabase
    .from('decisions')
    .update(updateData as Partial<Decision>)
    .eq('id', decisionId)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };

  // Regenerate embedding to include outcome context
  triggerEmbeddingGeneration(decisionId).catch(() => {});

  return {};
}

export async function updateDecision(formData: FormData): Promise<{ id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const id = formData.get('id') as string;
  const projectId = formData.get('project_id') as string;
  const title = formData.get('title') as string;
  const whyStr = formData.get('why') as string;
  const context = formData.get('context') as string;
  const confidence = formData.get('confidence') as ConfidenceLevel;
  const category = formData.get('category') as DecisionCategory;
  const customCategory = formData.get('custom_category') as string | null;

  if (!title?.trim()) return { error: 'Title is required' };

  const updateData: Partial<Decision> = {
    title: title.trim(),
    why: whyStr ? JSON.parse(whyStr) : null,
    context: context || null,
    confidence: confidence || 'medium',
    category: category || 'product',
    custom_category: category === 'other' ? customCategory : null,
  };

  if (projectId) {
    updateData.project_id = projectId;
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = (await supabase
    .from('decisions')
    .update({ is_archived: true } as Partial<Decision>)
    .eq('id', id)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}

export async function restoreDecision(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { error } = (await supabase
    .from('decisions')
    .update({ is_archived: false } as Partial<Decision>)
    .eq('id', id)
    .eq('user_id', user.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}
