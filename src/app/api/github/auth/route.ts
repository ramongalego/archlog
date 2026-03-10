import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: 'GitHub OAuth not configured' }, { status: 500 });
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/github`;
  const scope = 'repo';
  const state = user.id; // Simple state param — in production, use a CSRF token

  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

  return NextResponse.redirect(url);
}
