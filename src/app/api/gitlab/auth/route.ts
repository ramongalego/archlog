import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { env } from '@/lib/env';
import { signOAuthState } from '@/lib/api/oauth-state';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = env().GITLAB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'GitLab OAuth not configured' }, { status: 500 });
  }

  const redirectUri = `${env().NEXT_PUBLIC_APP_URL}/api/auth/callback/gitlab`;
  const scope = 'read_api';
  const state = await signOAuthState(user.id, 'gitlab');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
    state,
  });

  return NextResponse.redirect(`https://gitlab.com/oauth/authorize?${params}`);
}
