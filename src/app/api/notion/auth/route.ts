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

  const clientId = env().NOTION_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'Notion OAuth not configured' }, { status: 500 });
  }

  const redirectUri =
    env().NOTION_REDIRECT_URI ?? `${env().NEXT_PUBLIC_APP_URL}/api/integrations/notion/callback`;
  const state = await signOAuthState(user.id, 'notion');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    owner: 'user',
    state,
  });

  return NextResponse.redirect(`https://api.notion.com/v1/oauth/authorize?${params}`);
}
