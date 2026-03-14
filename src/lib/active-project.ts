import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getActiveWorkspace } from '@/lib/active-workspace';

/**
 * Read the active project ID from the cookie set by ProjectSwitcher.
 * Validates the project belongs to the current workspace.
 * Falls back to the first project in the current workspace if the cookie
 * is missing, stale, or points to a project in a different workspace.
 */
export async function getActiveProjectId(): Promise<string | null> {
  const cookieStore = await cookies();
  const saved = cookieStore.get('active_project')?.value ?? null;
  const workspace = await getActiveWorkspace();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Validate saved cookie points to a non-archived project in the current workspace
  if (saved) {
    let validQuery = supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('id', saved)
      .eq('is_archived', false);

    if (workspace.type === 'team') {
      validQuery = validQuery.eq('team_id', workspace.teamId);
    } else {
      validQuery = validQuery.eq('user_id', user.id).is('team_id', null);
    }

    const { count } = await validQuery;
    if (count && count > 0) return saved;
  }

  // Cookie missing or invalid for this workspace — fall back to first project
  let fallbackQuery = supabase
    .from('projects')
    .select('id')
    .eq('is_archived', false)
    .order('is_default', { ascending: false })
    .order('name')
    .limit(1);

  if (workspace.type === 'team') {
    fallbackQuery = fallbackQuery.eq('team_id', workspace.teamId);
  } else {
    fallbackQuery = fallbackQuery.eq('user_id', user.id).is('team_id', null);
  }

  const { data: fallback } = await fallbackQuery;
  return fallback?.[0]?.id ?? null;
}
