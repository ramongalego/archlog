import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { repo } = await request.json();

  if (!repo || typeof repo !== 'string') {
    return NextResponse.json({ error: 'repo is required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('github_connections')
    .update({ selected_repo: repo })
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to update repo' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
