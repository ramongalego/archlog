import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DecisionForm } from '@/components/decisions/decision-form';
import { PageHeader } from '@/components/ui/page-header';
import { createDecision } from '../actions';
import { getActiveProjectId } from '@/lib/active-project';

export default async function NewDecisionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Use active project from cookie, fall back to default project
  let projectId = await getActiveProjectId();

  if (!projectId) {
    const { data: defaultProject } = (await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single()) as { data: { id: string } | null };

    if (!defaultProject) redirect('/dashboard');
    projectId = defaultProject.id;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Log a Decision" />
      <DecisionForm action={createDecision} projectId={projectId} />
    </div>
  );
}
