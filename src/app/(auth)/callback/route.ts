import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Persist auto-detected timezone from signup metadata
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const tz = user?.user_metadata?.timezone;
      if (user && typeof tz === 'string' && tz) {
        await supabase.from('users').update({ timezone: tz }).eq('id', user.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
