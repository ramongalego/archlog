import { createClient } from '@/lib/supabase/server';
import { canUseAiQuery, canSearchCrossProject } from '@/lib/stripe/plans';
import { queryDecisions } from '@/lib/ai/query';
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
    return new Response(JSON.stringify({ error: 'AI query is available on the Pro plan.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await request.json();
  const question = body.question;
  const projectId = body.project_id;

  // Cross-project query (no project_id) requires Pro with cross-project search
  if (!projectId && !canSearchCrossProject(profile.subscription_tier)) {
    return new Response(
      JSON.stringify({ error: 'Cross-project search is available on the Pro plan.' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return new Response(JSON.stringify({ error: 'question is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (question.length > 2000) {
    return new Response(JSON.stringify({ error: 'Question must be under 2000 characters' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Stream the response as SSE
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const generator = queryDecisions({
          question: question.trim(),
          projectId: projectId || undefined,
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
