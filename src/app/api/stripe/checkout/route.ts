import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';
import { env } from '@/lib/env';
import type { User } from '@/types/decisions';

const bodySchema = z.object({
  plan: z.enum(['pro', 'team']).default('pro'),
});

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

  let parsedBody;
  try {
    parsedBody = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  const plan = parsedBody.plan;

  if (profile.subscription_tier === plan) {
    return NextResponse.json(
      { error: `Already on ${plan === 'team' ? 'Team' : 'Solo'} plan` },
      { status: 409 }
    );
  }

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

  const priceId =
    plan === 'team'
      ? env().NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID
      : env().NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: 'Stripe price not configured' }, { status: 500 });
  }

  const appUrl = env().NEXT_PUBLIC_APP_URL;
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { plan },
    success_url: `${appUrl}/dashboard/settings?billing=success`,
    cancel_url: `${appUrl}/dashboard/settings?billing=cancelled`,
  });

  return NextResponse.json({ checkout_url: session.url });
}
