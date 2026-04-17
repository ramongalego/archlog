import { createClient } from '@/lib/supabase/server';
import { canUseAiQuery, canSearchCrossProject } from '@/lib/stripe/plans';
import { queryDecisions } from '@/lib/ai/query';
import { aiQuerySchema } from '@/lib/validation';
import { getActiveWorkspace } from '@/lib/active-workspace';
import { checkRateLimit, rateLimits } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';
import type { User } from '@/types/decisions';

function jsonResponse(body: unknown, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return jsonResponse({ error: 'Unauthorized' }, 401);

  const rl = checkRateLimit(`ai:query:${user.id}`, rateLimits.aiQuery);
  if (!rl.allowed) {
    return jsonResponse({ error: 'Rate limit exceeded. Please try again later.' }, 429, {
      'Retry-After': Math.ceil((rl.resetAt - Date.now()) / 1000).toString(),
    });
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()) as { data: Pick<User, 'subscription_tier'> | null };

  const workspace = await getActiveWorkspace();
  const isInTeamWorkspace = workspace.type === 'team';

  if (!profile || (!canUseAiQuery(profile.subscription_tier) && !isInTeamWorkspace)) {
    return jsonResponse({ error: 'AI query requires a paid plan. Upgrade to unlock.' }, 403);
  }

  const body = await request.json().catch(() => null);
  if (!body) return jsonResponse({ error: 'Invalid JSON' }, 400);

  const parsed = aiQuerySchema.safeParse(body);
  if (!parsed.success) return jsonResponse({ error: parsed.error.issues[0].message }, 400);

  const { question, project_id } = parsed.data;

  if (!project_id && !canSearchCrossProject(profile.subscription_tier) && !isInTeamWorkspace) {
    return jsonResponse(
      { error: 'Cross-project search requires a paid plan. Upgrade to unlock.' },
      403
    );
  }

  let workspaceProjectIds: string[] = [];
  if (workspace.type === 'team') {
    const { data: teamProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('team_id', workspace.teamId)
      .eq('is_archived', false);
    workspaceProjectIds = (teamProjects ?? []).map((p) => p.id);
  } else {
    const { data: personalProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .is('team_id', null)
      .eq('is_archived', false);
    workspaceProjectIds = (personalProjects ?? []).map((p) => p.id);
  }

  // Enforce that a caller-supplied project id belongs to the active workspace.
  if (project_id && !workspaceProjectIds.includes(project_id)) {
    return jsonResponse({ error: 'Project not found' }, 404);
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const generator = queryDecisions({
          question: question.trim(),
          projectId: project_id || undefined,
          userId: user.id,
          workspaceProjectIds,
        });

        for await (const event of generator) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err) {
        logger.error('AI query stream failed', err, { userId: user.id });
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'error', message: 'Something went wrong' })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
