import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { DecisionForm } from '@/components/decisions/decision-form';
import { PageHeader } from '@/components/ui/page-header';
import { updateDecision } from '../../actions';
import { validateRouteId } from '@/lib/validation';
import type { Decision, Project } from '@/types/decisions';
import type { JSONContent } from '@tiptap/react';

export default async function EditDecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const validId = validateRouteId(rawId);
  if (!validId) notFound();
  const id = validId;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: decision } = (await supabase
    .from('decisions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()) as { data: Decision | null };

  if (!decision) notFound();

  const { data: projects } = (await supabase
    .from('projects')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('is_archived', false)
    .order('name')) as { data: Pick<Project, 'id' | 'name'>[] | null };

  async function handleUpdate(formData: FormData): Promise<{ id?: string; error?: string }> {
    'use server';
    formData.set('id', id);
    return updateDecision(formData);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Edit Decision" />
      <DecisionForm
        action={handleUpdate}
        projectId={decision.project_id}
        projects={projects ?? []}
        initialData={{
          title: decision.title,
          why: decision.why as JSONContent | null,
          context: decision.context ?? '',
          confidence: decision.confidence,
          category: decision.category,
          custom_category: decision.custom_category ?? '',
        }}
      />
    </div>
  );
}
