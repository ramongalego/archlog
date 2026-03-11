import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createServerClient } from '@supabase/ssr';
import type Stripe from 'stripe';

// Use service role client for webhook - no user session available
function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const plan = (session.metadata?.plan === 'team' ? 'team' : 'pro') as 'pro' | 'team';

      // Find user by stripe_customer_id
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (user) {
        const priceId =
          plan === 'team'
            ? process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID!
            : process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!;

        // Create subscription record
        await supabase.from('subscriptions').insert({
          user_id: (user as { id: string }).id,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          status: 'active',
        });

        // Upgrade user to the purchased tier
        await supabase
          .from('users')
          .update({ subscription_tier: plan })
          .eq('id', (user as { id: string }).id);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const periodStart = (subscription as unknown as Record<string, number>).current_period_start;
      const periodEnd = (subscription as unknown as Record<string, number>).current_period_end;
      await supabase
        .from('subscriptions')
        .update({
          status: subscription.status,
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        })
        .eq('stripe_subscription_id', subscription.id);

      // Detect plan changes (e.g. Founder <-> Team via billing portal)
      const priceId = subscription.items.data[0]?.price.id;
      const teamPriceId = process.env.NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID;
      const newTier = priceId === teamPriceId ? 'team' : 'pro';
      const subCustomerId = subscription.customer as string;

      if (subscription.status === 'active') {
        await supabase
          .from('users')
          .update({ subscription_tier: newTier })
          .eq('stripe_customer_id', subCustomerId);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Mark subscription as canceled
      await supabase
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', subscription.id);

      // Downgrade user to free
      await supabase
        .from('users')
        .update({ subscription_tier: 'free' })
        .eq('stripe_customer_id', customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
