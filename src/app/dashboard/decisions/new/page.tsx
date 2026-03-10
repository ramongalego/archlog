import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DecisionForm } from '@/components/decisions/decision-form';
import { PageHeader } from '@/components/ui/page-header';
import { createDecision } from '../actions';
import { getActiveProjectId } from '@/lib/active-project';
import { acceptSuggestion } from '@/app/dashboard/suggestions/actions';

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function NewDecisionPage({ searchParams }: Props) {
  const params = await searchParams;
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

  // Pre-fill from a GitHub suggestion if coming from the suggestions page
  const fromSuggestion = params.from_suggestion;
  const prefilled = fromSuggestion
    ? {
        title: params.title ?? '',
        why: null,
        context: [params.context, params.alternatives ? `Alternatives: ${params.alternatives}` : '']
          .filter(Boolean)
          .join('\n\n'),
        confidence: 'medium' as const,
        category: 'technical' as const,
        custom_category: '',
      }
    : undefined;

  // Wrap createDecision to also mark the suggestion as accepted
  async function createFromSuggestion(formData: FormData) {
    'use server';
    const result = await createDecision(formData);
    if (!result.error && fromSuggestion) {
      await acceptSuggestion(fromSuggestion);
    }
    return result;
  }

  const isFromSuggestion = !!fromSuggestion;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={isFromSuggestion ? 'Review Suggested Decision' : 'Log a Decision'} />
      {isFromSuggestion && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Review and edit the details below before saving. This was extracted from a GitHub PR.
        </p>
      )}
      <DecisionForm
        action={isFromSuggestion ? createFromSuggestion : createDecision}
        projectId={projectId}
        initialData={prefilled}
      />
    </div>
  );
}
