import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QueryChat } from '@/components/ai/query-chat';
import { PageHeader } from '@/components/ui/page-header';
import { getActiveProjectId } from '@/lib/active-project';
import type { User } from '@/types/decisions';

export const metadata: Metadata = { title: 'Ask' };

export default async function AskPage() {
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

  const isPro = profile?.subscription_tier === 'pro';
  const activeProjectId = await getActiveProjectId();

  let activeProjectName = 'This project';
  if (activeProjectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', activeProjectId)
      .single();
    if (project) activeProjectName = project.name;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <PageHeader title="Ask about your decisions" />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ask questions about your past decisions and get answers grounded in what you actually
          logged.
        </p>
      </div>

      <QueryChat
        isPro={isPro}
        activeProjectId={activeProjectId}
        activeProjectName={activeProjectName}
      />
    </div>
  );
}
