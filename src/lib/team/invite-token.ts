import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/lib/env';

interface InvitePayload {
  team_id: string;
  email: string;
}

function getSecret(): Uint8Array {
  return new TextEncoder().encode(env().TEAM_INVITE_SECRET);
}

export async function signInviteToken(payload: InvitePayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getSecret());
}

export async function verifyInviteToken(token: string): Promise<InvitePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.team_id !== 'string' || typeof payload.email !== 'string') {
      return null;
    }
    return { team_id: payload.team_id, email: payload.email };
  } catch {
    return null;
  }
}
