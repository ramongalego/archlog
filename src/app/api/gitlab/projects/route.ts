import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/gitlab/crypto';
import { getProjects } from '@/lib/gitlab/client';
import type { GitLabConnection } from '@/types/decisions';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: connection } = (await supabase
    .from('gitlab_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()) as { data: GitLabConnection | null };

  if (!connection) {
    return NextResponse.json({ error: 'GitLab not connected' }, { status: 400 });
  }

  const token = decrypt(connection.access_token_encrypted);
  const projects = await getProjects(token);

  return NextResponse.json({
    projects: projects.map((p) => ({
      path_with_namespace: p.path_with_namespace,
      name: p.name,
      visibility: p.visibility,
      description: p.description,
    })),
  });
}
