import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

export type AuthedContext = {
  user: User;
  supabase: SupabaseClient<Database>;
};

type Handler<Ctx extends Record<string, unknown> = Record<string, never>> = (
  request: Request,
  auth: AuthedContext,
  ctx: Ctx
) => Promise<Response>;

/**
 * Wrap an API route handler with Supabase session validation.
 *
 * Returns 401 if no session is present. On success, passes the authenticated
 * user and a Supabase server client into the handler.
 */
export function withAuth<Ctx extends Record<string, unknown> = Record<string, never>>(
  handler: Handler<Ctx>
) {
  return async (request: Request, ctx: Ctx = {} as Ctx): Promise<Response> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(request, { user, supabase }, ctx);
  };
}
