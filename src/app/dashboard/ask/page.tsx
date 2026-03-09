import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { QueryChat } from '@/components/ai/query-chat';
import { PageHeader } from '@/components/ui/page-header';
import { getActiveProjectId } from '@/lib/active-project';
import type { User } from '@/types/decisions';

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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <PageHeader title="Ask your decisions" />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Ask questions about your past decisions and get answers grounded in what you actually
          logged.
        </p>
      </div>

      <QueryChat isPro={isPro} activeProjectId={activeProjectId} />
    </div>
  );
}
