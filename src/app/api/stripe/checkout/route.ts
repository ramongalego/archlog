import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import type { User } from '@/types/decisions';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 });
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('stripe_customer_id, subscription_tier, email')
    .eq('id', user.id)
    .single()) as { data: Pick<User, 'stripe_customer_id' | 'subscription_tier' | 'email'> | null };

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.subscription_tier === 'pro') {
    return NextResponse.json({ error: 'Already on Pro' }, { status: 409 });
  }

  // Create or reuse Stripe customer
  let customerId = profile.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: profile.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from('users')
      .update({ stripe_customer_id: customerId } as Partial<User>)
      .eq('id', user.id);
  }

  const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${request.headers.get('origin')}/dashboard/settings?billing=success`,
    cancel_url: `${request.headers.get('origin')}/dashboard/settings?billing=cancelled`,
  });

  return NextResponse.json({ checkout_url: session.url });
}
