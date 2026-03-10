import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/github/crypto';
import { getRepos } from '@/lib/github/client';
import type { GitHubConnection } from '@/types/decisions';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: connection } = (await supabase
    .from('github_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()) as { data: GitHubConnection | null };

  if (!connection) {
    return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
  }

  const token = decrypt(connection.access_token_encrypted);
  const repos = await getRepos(token);

  return NextResponse.json({
    repos: repos.map((r) => ({
      full_name: r.full_name,
      name: r.name,
      private: r.private,
      description: r.description,
    })),
  });
}
