import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type Workspace =
  | { type: 'personal' }
  | { type: 'team'; teamId: string };

/**
 * Read the active workspace from the cookie.
 * Format: "personal" or "team:<uuid>"
 *
 * Validates that the user is still an accepted member of the team.
 * Falls back to personal workspace if the team no longer exists or
 * the user has been removed.
 */
export async function getActiveWorkspace(): Promise<Workspace> {
  const cookieStore = await cookies();
  const raw = cookieStore.get('active_workspace')?.value ?? 'personal';
  const value = decodeURIComponent(raw);

  if (value.startsWith('team:')) {
    const teamId = value.slice(5);
    if (!teamId) return { type: 'personal' };

    // Validate the user is still an accepted member of this team
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { type: 'personal' };

    const { count } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    if (count && count > 0) {
      return { type: 'team', teamId };
    }

    // User is no longer a member — fall back to personal
    return { type: 'personal' };
  }

  return { type: 'personal' };
}
