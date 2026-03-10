import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/github/crypto';
import { getGitHubUser } from '@/lib/github/client';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=no_code`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`);
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error || !tokenData.access_token) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=oauth_failed`
    );
  }

  const accessToken = tokenData.access_token as string;

  // Get GitHub username
  const ghUser = await getGitHubUser(accessToken);

  // Store encrypted token — upsert in case user reconnects
  const { error } = await supabase.from('github_connections').upsert(
    {
      user_id: user.id,
      access_token_encrypted: encrypt(accessToken),
      github_username: ghUser.login,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?error=save_failed`
    );
  }

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/integrations?connected=true`);
}
