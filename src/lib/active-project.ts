import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

/**
 * Read the active project ID from the cookie set by ProjectSwitcher.
 * Validates it still exists; falls back to the user's default project if not.
 */
export async function getActiveProjectId(): Promise<string | null> {
  const cookieStore = await cookies();
  const saved = cookieStore.get('active_project')?.value ?? null;

  if (!saved) return null;

  const supabase = await createClient();
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('id', saved)
    .eq('is_archived', false);

  if (count && count > 0) return saved;

  // Cookie points to a deleted/archived project, fall back to default
  const { data: defaultProject } = await supabase
    .from('projects')
    .select('id')
    .eq('is_default', true)
    .single();

  return defaultProject?.id ?? null;
}
