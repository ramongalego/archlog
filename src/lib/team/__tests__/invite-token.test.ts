/**
 * @jest-environment node
 */
import { signInviteToken, verifyInviteToken } from '../invite-token';

describe('invite tokens', () => {
  const payload = { team_id: '550e8400-e29b-41d4-a716-446655440000', email: 'alice@example.com' };

  it('round-trips a valid token', async () => {
    const token = await signInviteToken(payload);
    const result = await verifyInviteToken(token);

    expect(result).toEqual(payload);
  });

  it('rejects a tampered token', async () => {
    const token = await signInviteToken(payload);
    const tampered = token.slice(0, -5) + 'XXXXX';
    const result = await verifyInviteToken(tampered);

    expect(result).toBeNull();
  });

  it('rejects a completely invalid string', async () => {
    const result = await verifyInviteToken('not-a-jwt');

    expect(result).toBeNull();
  });

  it('rejects an expired token', async () => {
    const { SignJWT } = await import('jose');
    const secret = new TextEncoder().encode(
      process.env.TEAM_INVITE_SECRET ?? 'default-invite-secret'
    );

    const expiredToken = await new SignJWT(payload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(secret);

    const result = await verifyInviteToken(expiredToken);
    expect(result).toBeNull();
  });

  it('rejects a token with missing email field', async () => {
    const { SignJWT } = await import('jose');
    const secret = new TextEncoder().encode(
      process.env.TEAM_INVITE_SECRET ?? 'default-invite-secret'
    );

    const incomplete = await new SignJWT({ team_id: payload.team_id } as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    const result = await verifyInviteToken(incomplete);
    expect(result).toBeNull();
  });

  it('rejects a token signed with a different secret', async () => {
    const { SignJWT } = await import('jose');
    const wrongSecret = new TextEncoder().encode('wrong-secret-key');

    const token = await new SignJWT(payload as unknown as Record<string, unknown>)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(wrongSecret);

    const result = await verifyInviteToken(token);
    expect(result).toBeNull();
  });
});
