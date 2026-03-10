import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { extractDecisionsFromText, storeSuggestions } from '@/lib/ai/suggestion-pipeline';
import { extractTextSchema } from '@/lib/validation';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = extractTextSchema.safeParse({
    text: body.text,
    projectId: body.project_id,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const decisions = await extractDecisionsFromText(parsed.data.text);

  const found = await storeSuggestions(supabase, {
    userId: user.id,
    projectId: parsed.data.projectId,
    source: 'text',
    decisions,
  });

  return NextResponse.json({ found });
}
