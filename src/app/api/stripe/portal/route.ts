import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { env } from '@/lib/env';
import type { User } from '@/types/decisions';

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()) as { data: Pick<User, 'stripe_customer_id'> | null };

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${env().NEXT_PUBLIC_APP_URL}/dashboard/settings`,
  });

  return NextResponse.json({ portal_url: session.url });
}
