import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { SuggestionsList } from '@/components/integrations/suggestions-list';
import { getActiveProjectId } from '@/lib/active-project';
import type { SuggestedDecision } from '@/types/decisions';

export const metadata: Metadata = { title: 'Suggestions' };

const PAGE_SIZE = 50;

async function resolveProjectId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  activeProjectId: string | null
): Promise<string> {
  if (activeProjectId) return activeProjectId;
  const { data } = (await supabase
    .from('projects')
    .select('id')
    .eq('user_id', userId)
    .eq('is_default', true)
    .single()) as { data: { id: string } | null };
  return data?.id ?? '';
}

export default async function SuggestionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const activeProjectId = await getActiveProjectId();

  let query = supabase
    .from('suggested_decisions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE);

  if (activeProjectId) {
    query = query.eq('project_id', activeProjectId);
  }

  const [suggestionsRes, projectIdForAccept] = await Promise.all([
    query,
    resolveProjectId(supabase, user.id, activeProjectId),
  ]);

  const suggestions = (suggestionsRes.data ?? []) as SuggestedDecision[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Suggested Decisions" />

      {suggestions.length > 0 ? (
        <SuggestionsList suggestions={suggestions} projectId={projectIdForAccept} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No pending suggestions.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Use integrations or paste text to extract decisions automatically.
          </p>
        </div>
      )}
    </div>
  );
}
