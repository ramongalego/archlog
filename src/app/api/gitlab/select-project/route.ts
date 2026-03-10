import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { selectGitLabProjectSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = selectGitLabProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { error } = await supabase
    .from('gitlab_connections')
    .update({ selected_project: parsed.data.project })
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
