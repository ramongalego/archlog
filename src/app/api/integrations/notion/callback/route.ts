import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/notion/crypto';
import { env } from '@/lib/env';
import { verifyOAuthState } from '@/lib/api/oauth-state';
import { logger } from '@/lib/logger';

function redirectWithError(error: string): NextResponse {
  return NextResponse.redirect(
    `${env().NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=${encodeURIComponent(error)}`
  );
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  if (!code) return redirectWithError('no_code');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${env().NEXT_PUBLIC_APP_URL}/login`);
  }

  const stateUserId = await verifyOAuthState(state, 'notion');
  if (!stateUserId || stateUserId !== user.id) {
    logger.warn('OAuth state mismatch', { provider: 'notion', userId: user.id });
    return redirectWithError('invalid_state');
  }

  const credentials = Buffer.from(
    `${env().NOTION_CLIENT_ID}:${env().NOTION_CLIENT_SECRET}`
  ).toString('base64');

  const redirectUri =
    env().NOTION_REDIRECT_URI ?? `${env().NEXT_PUBLIC_APP_URL}/api/integrations/notion/callback`;

  const tokenRes = await fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${credentials}`,
    },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error || !tokenData.access_token) {
    logger.warn('Notion OAuth token exchange failed', {
      userId: user.id,
      tokenError: tokenData.error,
    });
    return redirectWithError('oauth_failed');
  }

  const accessToken = tokenData.access_token as string;
  const workspaceName = (tokenData.workspace_name as string) ?? 'Notion workspace';

  const { error } = await supabase.from('notion_connections').upsert(
    {
      user_id: user.id,
      access_token_encrypted: encrypt(accessToken),
      notion_workspace_name: workspaceName,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    logger.error('Failed to save Notion connection', error, { userId: user.id });
    return redirectWithError('save_failed');
  }

  return NextResponse.redirect(
    `${env().NEXT_PUBLIC_APP_URL}/dashboard/integrations?connected=true`
  );
}
