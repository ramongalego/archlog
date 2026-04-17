import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/gitlab/crypto';
import { getGitLabUser } from '@/lib/gitlab/client';
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

  const stateUserId = await verifyOAuthState(state, 'gitlab');
  if (!stateUserId || stateUserId !== user.id) {
    logger.warn('OAuth state mismatch', { provider: 'gitlab', userId: user.id });
    return redirectWithError('invalid_state');
  }

  const tokenRes = await fetch('https://gitlab.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env().GITLAB_CLIENT_ID,
      client_secret: env().GITLAB_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${env().NEXT_PUBLIC_APP_URL}/api/auth/callback/gitlab`,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error || !tokenData.access_token) {
    logger.warn('GitLab OAuth token exchange failed', {
      userId: user.id,
      tokenError: tokenData.error,
    });
    return redirectWithError('oauth_failed');
  }

  const accessToken = tokenData.access_token as string;

  const glUser = await getGitLabUser(accessToken);

  const { error } = await supabase.from('gitlab_connections').upsert(
    {
      user_id: user.id,
      access_token_encrypted: encrypt(accessToken),
      gitlab_username: glUser.username,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    logger.error('Failed to save GitLab connection', error, { userId: user.id });
    return redirectWithError('save_failed');
  }

  return NextResponse.redirect(
    `${env().NEXT_PUBLIC_APP_URL}/dashboard/integrations?connected=true`
  );
}
