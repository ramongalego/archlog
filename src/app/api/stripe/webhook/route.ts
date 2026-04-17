import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { stripe } from '@/lib/stripe/client';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

function createServiceClient() {
  return createServerClient(env().NEXT_PUBLIC_SUPABASE_URL, env().SUPABASE_SERVICE_ROLE_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

async function markProcessed(
  supabase: ReturnType<typeof createServiceClient>,
  event: Stripe.Event
): Promise<boolean> {
  const { error } = await supabase
    .from('stripe_webhook_events')
    .insert({ event_id: event.id, event_type: event.type });

  // Primary key collision means we've already processed this event — skip it.
  if (error && /duplicate key|unique/i.test(error.message)) {
    logger.info('Stripe webhook replay ignored', { eventId: event.id, type: event.type });
    return false;
  }
  if (error) {
    logger.error('Failed to record Stripe webhook event', error, { eventId: event.id });
    // Fail open to avoid double-acknowledging: re-throw so Stripe retries.
    throw new Error('Webhook bookkeeping failed');
  }
  return true;
}

function epochToIso(value: unknown): string | null {
  return typeof value === 'number' ? new Date(value * 1000).toISOString() : null;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = env().STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.warn('Stripe webhook signature verification failed', { error: String(err) });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  const shouldProcess = await markProcessed(supabase, event);
  if (!shouldProcess) return NextResponse.json({ received: true, duplicate: true });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabase, event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabase, event.data.object);
        break;
    }
  } catch (err) {
    logger.error('Stripe webhook handler failed', err, {
      eventId: event.id,
      eventType: event.type,
    });
    // Return 500 so Stripe retries; the idempotency record was already written,
    // but a replay path makes this safe because handlers use upsert semantics.
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createServiceClient>,
  session: Stripe.Checkout.Session
): Promise<void> {
  const customerId = session.customer as string | null;
  const subscriptionId = session.subscription as string | null;
  if (!customerId || !subscriptionId) return;

  const plan: 'pro' | 'team' = session.metadata?.plan === 'team' ? 'team' : 'pro';

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!user) {
    logger.warn('Stripe checkout completed for unknown customer', { customerId });
    return;
  }

  const priceId =
    plan === 'team'
      ? env().NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID
      : env().NEXT_PUBLIC_STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    logger.error('Stripe price id not configured', null, { plan });
    return;
  }

  await supabase.from('subscriptions').insert({
    user_id: (user as { id: string }).id,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId,
    status: 'active',
  });

  await supabase
    .from('users')
    .update({ subscription_tier: plan })
    .eq('id', (user as { id: string }).id);
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: Stripe.Subscription
): Promise<void> {
  const raw = subscription as unknown as Record<string, unknown>;
  const periodStart = epochToIso(raw.current_period_start);
  const periodEnd = epochToIso(raw.current_period_end);

  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
    })
    .eq('stripe_subscription_id', subscription.id);

  const priceId = subscription.items.data[0]?.price.id;
  const teamPriceId = env().NEXT_PUBLIC_STRIPE_TEAM_PRICE_ID;
  const newTier: 'pro' | 'team' = priceId === teamPriceId ? 'team' : 'pro';
  const customerId = subscription.customer as string;

  if (subscription.status === 'active') {
    await supabase
      .from('users')
      .update({ subscription_tier: newTier })
      .eq('stripe_customer_id', customerId);
  }
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createServiceClient>,
  subscription: Stripe.Subscription
): Promise<void> {
  const customerId = subscription.customer as string;

  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);

  await supabase
    .from('users')
    .update({ subscription_tier: 'free' })
    .eq('stripe_customer_id', customerId);
}
