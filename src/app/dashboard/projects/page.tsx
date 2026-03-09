import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Project } from '@/types/decisions';
import { PageHeader } from '@/components/ui/page-header';
import { ProjectActions } from './project-actions';

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
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Projects" />

      <ProjectActions projects={projectsWithCounts} />
    </div>
  );
}
