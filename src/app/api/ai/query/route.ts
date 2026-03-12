import { createClient } from '@/lib/supabase/server';
import { canUseAiQuery, canSearchCrossProject } from '@/lib/stripe/plans';
import { queryDecisions } from '@/lib/ai/query';
import { aiQuerySchema } from '@/lib/validation';
import type { User } from '@/types/decisions';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check subscription tier
  const { data: profile } = (await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()) as { data: Pick<User, 'subscription_tier'> | null };

  if (!profile || !canUseAiQuery(profile.subscription_tier)) {
    return new Response(
      JSON.stringify({ error: 'AI query requires a paid plan. Upgrade to unlock.' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const body = await request.json();
  const parsed = aiQuerySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues[0].message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { question, project_id } = parsed.data;

  // Cross-project query (no project_id) requires a paid plan with cross-project search
  if (!project_id && !canSearchCrossProject(profile.subscription_tier)) {
    return new Response(
      JSON.stringify({ error: 'Cross-project search requires a paid plan. Upgrade to unlock.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Stream the response as SSE
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const generator = queryDecisions({
          question: question.trim(),
          projectId: project_id || undefined,
          userId: user.id,
        });

        for await (const event of generator) {
          const data = JSON.stringify(event);
          controller.enqueue(encoder.encode(`data: ${data}\n\n`));
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Something went wrong';
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: errorMsg })}\n\n`)
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
