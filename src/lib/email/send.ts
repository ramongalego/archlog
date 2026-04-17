import { Resend } from 'resend';
import { env } from '@/lib/env';
import { logger } from '@/lib/logger';

let client: Resend | null = null;

function getClient(): Resend {
  if (!client) {
    const apiKey = env().RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY is not configured');
    client = new Resend(apiKey);
  }
  return client;
}

const DEFAULT_FROM = 'ArchLog <notifications@archlog.app>';

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const { error } = await getClient().emails.send({
    from: env().RESEND_FROM_EMAIL ?? DEFAULT_FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    logger.error('Resend email send failed', error, { subject: params.subject });
    throw new Error(`Email send failed: ${error.message}`);
  }
}
