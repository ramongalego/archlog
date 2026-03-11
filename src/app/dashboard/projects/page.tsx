import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Project, User } from '@/types/decisions';
import { PageHeader } from '@/components/ui/page-header';
import { ProjectActions } from './project-actions';

export const metadata: Metadata = { title: 'Projects' };

type ProjectWithCount = Pick<
  Project,
  'id' | 'name' | 'description' | 'is_default' | 'is_archived'
> & {
  decision_count: number;
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

  // Get all projects (including archived so user can see them)
  const { data: projects } = (await supabase
    .from('projects')
    .select('id, name, description, is_default, is_archived')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })) as {
    data: Pick<Project, 'id' | 'name' | 'description' | 'is_default' | 'is_archived'>[] | null;
  };

  // Get decision counts per project
  const projectsWithCounts: ProjectWithCount[] = [];

  if (projects) {
    for (const p of projects) {
      const { count } = await supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', p.id)
        .eq('is_archived', false);

      projectsWithCounts.push({
        ...p,
        decision_count: count ?? 0,
      });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Projects" />

      <ProjectActions projects={projectsWithCounts} tier={tier} />
    </div>
  );
}
