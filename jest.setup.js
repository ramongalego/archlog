/* eslint-disable @typescript-eslint/no-require-imports */
const { TextEncoder, TextDecoder } = require('util');

Object.assign(global, { TextEncoder, TextDecoder });

if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

// Provide minimally-valid env values so src/lib/env.ts validation passes in tests.
// Individual tests that need different values can override via `process.env.FOO = '...'`.
process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000';
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key';
process.env.TEAM_INVITE_SECRET ??= 'test-team-invite-secret-thirty-two-chars-min';
process.env.OAUTH_STATE_SECRET ??= 'test-oauth-state-secret-thirty-two-chars-min';
