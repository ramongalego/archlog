import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { SuggestionsList } from '@/components/integrations/suggestions-list';
import { getActiveProjectId } from '@/lib/active-project';
import type { SuggestedDecision } from '@/types/decisions';

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
    .order('created_at', { ascending: false });

  if (activeProjectId) {
    query = query.eq('project_id', activeProjectId);
  }

  const { data: suggestions } = (await query) as { data: SuggestedDecision[] | null };

  // Get project ID for accepting suggestions
  let projectId = activeProjectId;
  if (!projectId) {
    const { data: defaultProject } = (await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()) as { data: { id: string } | null };
    projectId = defaultProject?.id ?? '';
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="Suggested Decisions" />

      {suggestions && suggestions.length > 0 ? (
        <SuggestionsList suggestions={suggestions} projectId={projectId} />
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No pending suggestions.</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Connect GitHub and scan a repo to find decisions in your merged PRs.
          </p>
        </div>
      )}
    </div>
  );
}
