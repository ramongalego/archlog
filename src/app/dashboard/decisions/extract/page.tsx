import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { ExtractForm } from '@/components/decisions/extract-form';
import { getActiveProjectId } from '@/lib/active-project';

export const metadata: Metadata = { title: 'Extract Decisions' };

export default async function ExtractPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <PageHeader title="Extract decisions from text" />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Paste meeting notes, Notion pages, documents, or any text. AI will find decisions in it
          for you to review.
        </p>
      </div>
      <ExtractForm projectId={projectId} />
    </div>
  );
}
