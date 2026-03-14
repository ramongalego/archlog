import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Project, User } from '@/types/decisions';
import { PageHeader } from '@/components/ui/page-header';
import { ProjectActions } from './project-actions';

export const metadata: Metadata = { title: 'Projects' };

type ProjectWithCount = Pick<
  Project,
  'id' | 'name' | 'description' | 'is_default' | 'is_archived' | 'team_id'
> & {
  decision_count: number;
  team_name?: string;
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = (await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()) as { data: Pick<User, 'subscription_tier'> | null };

  const tier = profile?.subscription_tier ?? 'free';

  // Get personal projects
  const { data: personalProjects } = (await supabase
    .from('projects')
    .select('id, name, description, is_default, is_archived, team_id')
    .eq('user_id', user.id)
    .is('team_id', null)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })) as {
    data:
      | Pick<Project, 'id' | 'name' | 'description' | 'is_default' | 'is_archived' | 'team_id'>[]
      | null;
  };

  // Get teams the user belongs to
  const { data: memberships } = await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)
    .eq('status', 'accepted');

  const teamIds = (memberships ?? []).map((m) => m.team_id);

  // Get team projects (RLS ensures access)
  let teamProjects: Pick<
    Project,
    'id' | 'name' | 'description' | 'is_default' | 'is_archived' | 'team_id'
  >[] = [];
  const teamNames: Map<string, string> = new Map();

  if (teamIds.length > 0) {
    const { data: teams } = await supabase.from('teams').select('id, name').in('id', teamIds);

    for (const t of teams ?? []) {
      teamNames.set(t.id, t.name);
    }

    const { data: tp } = (await supabase
      .from('projects')
      .select('id, name, description, is_default, is_archived, team_id')
      .in('team_id', teamIds)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })) as {
      data:
        | Pick<Project, 'id' | 'name' | 'description' | 'is_default' | 'is_archived' | 'team_id'>[]
        | null;
    };

    teamProjects = tp ?? [];
  }

  // Get decision counts
  async function withCounts(
    projects: Pick<
      Project,
      'id' | 'name' | 'description' | 'is_default' | 'is_archived' | 'team_id'
    >[]
  ): Promise<ProjectWithCount[]> {
    const result: ProjectWithCount[] = [];
    for (const p of projects) {
      const { count } = await supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', p.id)
        .eq('is_archived', false);

      result.push({
        ...p,
        decision_count: count ?? 0,
        team_name: p.team_id ? teamNames.get(p.team_id) : undefined,
      });
    }
    return result;
  }

  const personalWithCounts = await withCounts(personalProjects ?? []);
  const teamWithCounts = await withCounts(teamProjects);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Projects" />

      <ProjectActions
        personalProjects={personalWithCounts}
        teamProjects={teamWithCounts}
        tier={tier}
      />
    </div>
  );
}
