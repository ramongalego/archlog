import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractDecisionsFromText, storeSuggestions } from '@/lib/ai/suggestion-pipeline';
import { extractTextSchema } from '@/lib/validation';
import { checkRateLimit, rateLimits } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = checkRateLimit(`extract:${user.id}`, rateLimits.extract);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': Math.ceil((rl.resetAt - Date.now()) / 1000).toString() },
      }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = extractTextSchema.safeParse({
    text: body.text,
    projectId: body.project_id,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Explicit project-ownership check (defence in depth alongside RLS) so suggestions
  // can never be written under a project the caller doesn't own.
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', parsed.data.projectId)
    .single();

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  try {
    const decisions = await extractDecisionsFromText(parsed.data.text);
    const found = await storeSuggestions(supabase, {
      userId: user.id,
      projectId: parsed.data.projectId,
      source: 'text',
      decisions,
    });
    return NextResponse.json({ found });
  } catch (err) {
    logger.error('Text extraction failed', err, { userId: user.id });
    return NextResponse.json({ error: 'Failed to extract decisions' }, { status: 500 });
  }
}
