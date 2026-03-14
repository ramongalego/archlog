import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.TEAM_INVITE_SECRET ?? 'default-invite-secret');

interface InvitePayload {
  team_id: string;
  email: string;
}

export async function signInviteToken(payload: InvitePayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyInviteToken(token: string): Promise<InvitePayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.team_id !== 'string' || typeof payload.email !== 'string') {
      return null;
    }
    return { team_id: payload.team_id, email: payload.email };
  } catch {
    return null;
  }
}
