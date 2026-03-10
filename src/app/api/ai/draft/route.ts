import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDraftSuggestion } from '@/lib/ai/draft';
import { aiDraftSchema } from '@/lib/validation';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = aiDraftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const suggestion = await generateDraftSuggestion(parsed.data.raw_note);
    return NextResponse.json({ suggestion });
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate draft. Please try again.' },
      { status: 500 }
    );
  }
}
