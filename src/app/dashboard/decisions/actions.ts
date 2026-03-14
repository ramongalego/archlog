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
import { getActiveWorkspace } from '@/lib/active-workspace';
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

  // Check plan limits — only enforce for personal projects (team projects are unlimited)
  const { data: projectRow } = await supabase
    .from('projects')
    .select('team_id')
    .eq('id', project_id)
    .single();

  if (!projectRow?.team_id) {
    // Personal project — count only decisions in personal projects
    const { data: personalProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .is('team_id', null);

    const personalProjectIds = (personalProjects ?? []).map((p) => p.id);
    let personalCount = 0;
    if (personalProjectIds.length > 0) {
      const { count } = await supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .in('project_id', personalProjectIds);
      personalCount = count ?? 0;
    }

    if (!canCreateDecision(profile.subscription_tier, personalCount)) {
      return {
        error:
          'You have reached the decision limit for your plan. Upgrade for unlimited decisions.',
      };
    }
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

  const workspace = await getActiveWorkspace();

  let query = supabase
    .from('decisions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  // In team workspace, show all decisions in team projects (RLS ensures access)
  // In personal workspace, only show own decisions
  if (workspace.type === 'team') {
    // Filter to decisions in projects belonging to this team
    const { data: teamProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('team_id', workspace.teamId);

    const teamProjectIds = (teamProjects ?? []).map((p) => p.id);
    if (teamProjectIds.length > 0) {
      query = query.in('project_id', teamProjectIds);
    } else {
      return { decisions: [], total: 0 };
    }
  } else {
    // Personal workspace: only decisions in personal projects (not team projects)
    const { data: personalProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .is('team_id', null);

    const personalProjectIds = (personalProjects ?? []).map((p) => p.id);
    if (personalProjectIds.length > 0) {
      query = query.in('project_id', personalProjectIds);
    } else {
      return { decisions: [], total: 0 };
    }
  }

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

  // Attach author names for team workspace decisions
  let decisions = data ?? [];
  if (workspace.type === 'team' && decisions.length > 0) {
    const userIds = [...new Set(decisions.map((d) => d.user_id))];
    const { data: users } = await supabase
      .from('users')
      .select('id, display_name')
      .in('id', userIds);

    const nameMap = new Map<string, string | null>();
    for (const u of users ?? []) {
      nameMap.set(u.id, u.display_name);
    }

    decisions = decisions.map((d) => ({
      ...d,
      author_name: nameMap.get(d.user_id) ?? null,
    }));
  }

  return { decisions, total: count ?? 0 };
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
    // RLS ensures only accessible decisions are returned (own + team)
    const { data: decision } = (await supabase
      .from('decisions')
      .select('review_period_days')
      .eq('id', decision_id)
      .single()) as { data: Pick<Decision, 'review_period_days'> | null };

    updateData.outcome_due_date = daysFromNow(decision?.review_period_days ?? 90);
  }

  // RLS allows: own decisions + team owner can update any decision in their team projects
  const { error } = (await supabase
    .from('decisions')
    .update(updateData as Partial<Decision>)
    .eq('id', decision_id)) as { error: { message: string } | null };

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

  // RLS allows: own decisions + team owner can update any decision in their team projects
  const { error } = (await supabase.from('decisions').update(updateData).eq('id', id)) as {
    error: { message: string } | null;
  };

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

  // RLS allows: own decisions + team owner can update any decision in their team projects
  const { error } = (await supabase
    .from('decisions')
    .update({ is_archived: true } as Partial<Decision>)
    .eq('id', parsed.data.id)) as { error: { message: string } | null };

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

  // RLS allows: own decisions + team owner can update any decision in their team projects
  const { error } = (await supabase
    .from('decisions')
    .update({ is_archived: false } as Partial<Decision>)
    .eq('id', parsed.data.id)) as { error: { message: string } | null };

  if (error) return { error: friendlyError(error.message) };
  return {};
}

export async function deleteDecision(id: string): Promise<{ error?: string }> {
  const parsed = decisionIdSchema.safeParse({ id });
  if (!parsed.success) return { error: 'Invalid decision ID' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // RLS ensures only accessible decisions are returned (own + team)
  // Only allow deleting archived decisions
  const { data: decision } = (await supabase
    .from('decisions')
    .select('is_archived')
    .eq('id', parsed.data.id)
    .single()) as { data: { is_archived: boolean } | null };

  if (!decision) return { error: 'Decision not found' };
  if (!decision.is_archived) return { error: 'Only archived decisions can be deleted' };

  // RLS allows: own decisions + team owner can delete any decision in their team projects
  const { error } = (await supabase.from('decisions').delete().eq('id', parsed.data.id)) as {
    error: { message: string } | null;
  };

  if (error) return { error: friendlyError(error.message) };
  return {};
}
