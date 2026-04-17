import Stripe from 'stripe';
import { env } from '@/lib/env';

const secretKey = env().STRIPE_SECRET_KEY;
if (!secretKey) {
  throw new Error('STRIPE_SECRET_KEY is not configured');
}

export const stripe = new Stripe(secretKey, { typescript: true });
