import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/github/crypto';
import { getGitHubUser } from '@/lib/github/client';
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

  const stateUserId = await verifyOAuthState(state, 'github');
  if (!stateUserId || stateUserId !== user.id) {
    logger.warn('OAuth state mismatch', { provider: 'github', userId: user.id });
    return redirectWithError('invalid_state');
  }

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: env().GITHUB_CLIENT_ID,
      client_secret: env().GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error || !tokenData.access_token) {
    logger.warn('GitHub OAuth token exchange failed', {
      userId: user.id,
      tokenError: tokenData.error,
    });
    return redirectWithError('oauth_failed');
  }

  const accessToken = tokenData.access_token as string;

  const ghUser = await getGitHubUser(accessToken);

  const { error } = await supabase.from('github_connections').upsert(
    {
      user_id: user.id,
      access_token_encrypted: encrypt(accessToken),
      github_username: ghUser.login,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    logger.error('Failed to save GitHub connection', error, { userId: user.id });
    return redirectWithError('save_failed');
  }

  return NextResponse.redirect(
    `${env().NEXT_PUBLIC_APP_URL}/dashboard/integrations?connected=true`
  );
}
