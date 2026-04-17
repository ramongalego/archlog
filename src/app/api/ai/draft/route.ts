import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDraftSuggestion } from '@/lib/ai/draft';
import { aiDraftSchema } from '@/lib/validation';
import { checkRateLimit, rateLimits } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = checkRateLimit(`ai:draft:${user.id}`, rateLimits.aiDraft);
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

  const parsed = aiDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const suggestion = await generateDraftSuggestion(parsed.data.raw_note);
    return NextResponse.json({ suggestion });
  } catch (err) {
    logger.error('AI draft generation failed', err, { userId: user.id });
    return NextResponse.json(
      { error: 'Failed to generate draft. Please try again.' },
      { status: 500 }
    );
  }
}
