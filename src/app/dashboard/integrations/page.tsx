import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { GitHubCard } from '@/components/integrations/github-card';
import { GitLabCard } from '@/components/integrations/gitlab-card';
import { getActiveProjectId } from '@/lib/active-project';
import type { GitHubConnection, GitLabConnection } from '@/types/decisions';

export const metadata: Metadata = { title: 'Integrations' };

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const activeProjectId = await getActiveProjectId();

  // Get GitHub connection if it exists
  const { data: githubConnection } = (await supabase
    .from('github_connections')
    .select('id, github_username, selected_repo, last_scan_at, last_scan_count')
    .eq('user_id', user.id)
    .single()) as {
    data: Pick<
      GitHubConnection,
      'id' | 'github_username' | 'selected_repo' | 'last_scan_at' | 'last_scan_count'
    > | null;
  };

  // Get GitLab connection if it exists
  const { data: gitlabConnection } = (await supabase
    .from('gitlab_connections')
    .select('id, gitlab_username, selected_project, last_scan_at, last_scan_count')
    .eq('user_id', user.id)
    .single()) as {
    data: Pick<
      GitLabConnection,
      'id' | 'gitlab_username' | 'selected_project' | 'last_scan_at' | 'last_scan_count'
    > | null;
  };

  // Count pending suggestions from GitHub only
  const { count: githubPendingCount } = await supabase
    .from('suggested_decisions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .eq('source', 'github');

  // Count pending suggestions from GitLab only
  const { count: gitlabPendingCount } = await supabase
    .from('suggested_decisions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .eq('source', 'gitlab');

  // Fall back to default project if no active project
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
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Integrations" />

      <div className="grid gap-4">
        <GitHubCard
          connection={githubConnection}
          projectId={projectId}
          pendingCount={githubPendingCount ?? 0}
        />

        <GitLabCard
          connection={gitlabConnection}
          projectId={projectId}
          pendingCount={gitlabPendingCount ?? 0}
        />

        {/* Placeholder cards for future integrations */}
        <Card className="flex items-center gap-3 opacity-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <svg
              className="h-5 w-5 text-purple-600 dark:text-purple-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Slack</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Coming soon</p>
          </div>
        </Card>

        <Card className="flex items-center gap-3 opacity-50">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Linear</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Coming soon</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
