import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';
import { env } from '@/lib/env';

interface StatePayload {
  user_id: string;
  nonce: string;
  provider: 'github' | 'gitlab' | 'notion';
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(env().OAUTH_STATE_SECRET);
}

/**
 * Generate a signed, single-use OAuth state token.
 *
 * Includes a cryptographically-random nonce so the state cannot be
 * predicted or enumerated by a user id alone (CSRF-resistant).
 * Short-lived: 15 minutes is long enough for a user to finish an
 * external OAuth handshake without leaving a usable token lying around.
 */
export async function signOAuthState(
  userId: string,
  provider: StatePayload['provider']
): Promise<string> {
  const nonce = randomBytes(16).toString('hex');
  return new SignJWT({ user_id: userId, nonce, provider })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(getSecret());
}

/**
 * Verify a state token and return the user id it was issued to.
 * Returns null for missing/invalid/expired/wrong-provider tokens.
 */
export async function verifyOAuthState(
  token: string | null,
  expectedProvider: StatePayload['provider']
): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.user_id !== 'string' ||
      typeof payload.nonce !== 'string' ||
      payload.provider !== expectedProvider
    ) {
      return null;
    }
    return payload.user_id;
  } catch {
    return null;
  }
}
