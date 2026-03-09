import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateDraftSuggestion } from '@/lib/ai/draft';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const rawNote = body.raw_note;

  if (!rawNote || typeof rawNote !== 'string' || rawNote.trim().length === 0) {
    return NextResponse.json({ error: 'raw_note is required' }, { status: 400 });
  }

  if (rawNote.length > 5000) {
    return NextResponse.json({ error: 'raw_note must be under 5000 characters' }, { status: 400 });
  }

  try {
    const suggestion = await generateDraftSuggestion(rawNote);
    return NextResponse.json({ suggestion });
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate draft. Please try again.' },
      { status: 500 }
    );
  }
}
