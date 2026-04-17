import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Project, User } from '@/types/decisions';
import { PageHeader } from '@/components/ui/page-header';
import { ProjectActions } from './project-actions';

export const metadata: Metadata = { title: 'Projects' };

type ProjectBase = Pick<
  Project,
  'id' | 'name' | 'description' | 'is_default' | 'is_archived' | 'team_id'
>;

type ProjectWithCount = ProjectBase & {
  decision_count: number;
  team_name?: string;
};

async function countDecisionsByProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (projectIds.length === 0) return counts;

  const { data } = await supabase
    .from('decisions')
    .select('project_id')
    .in('project_id', projectIds)
    .eq('is_archived', false);

  for (const row of data ?? []) {
    counts.set(row.project_id, (counts.get(row.project_id) ?? 0) + 1);
  }
  return counts;
}

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const [profileRes, personalRes, membershipsRes] = await Promise.all([
    supabase.from('users').select('subscription_tier').eq('id', user.id).single(),
    supabase
      .from('projects')
      .select('id, name, description, is_default, is_archived, team_id')
      .eq('user_id', user.id)
      .is('team_id', null)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true }),
    supabase.from('team_members').select('team_id').eq('user_id', user.id).eq('status', 'accepted'),
  ]);

  const profile = profileRes.data as Pick<User, 'subscription_tier'> | null;
  const personalProjects = (personalRes.data ?? []) as ProjectBase[];
  const tier = profile?.subscription_tier ?? 'free';
  const teamIds = (membershipsRes.data ?? []).map((m) => m.team_id);

  let teamProjects: ProjectBase[] = [];
  const teamNames = new Map<string, string>();

  if (teamIds.length > 0) {
    const [teamsResult, teamProjectsResult] = await Promise.all([
      supabase.from('teams').select('id, name').in('id', teamIds),
      supabase
        .from('projects')
        .select('id, name, description, is_default, is_archived, team_id')
        .in('team_id', teamIds)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true }),
    ]);

    for (const t of teamsResult.data ?? []) {
      teamNames.set(t.id, t.name);
    }
    teamProjects = (teamProjectsResult.data ?? []) as ProjectBase[];
  }

  const allProjectIds = [...personalProjects, ...teamProjects].map((p) => p.id);
  const decisionCounts = await countDecisionsByProject(supabase, allProjectIds);

  function withCounts(projects: ProjectBase[]): ProjectWithCount[] {
    return projects.map((p) => ({
      ...p,
      decision_count: decisionCounts.get(p.id) ?? 0,
      team_name: p.team_id ? teamNames.get(p.team_id) : undefined,
    }));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Projects" />

      <ProjectActions
        personalProjects={withCounts(personalProjects)}
        teamProjects={withCounts(teamProjects)}
        tier={tier}
      />
    </div>
  );
}
