import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TiptapReadOnly } from '@/components/decisions/tiptap-editor';
import { OutcomeSection } from '@/components/decisions/outcome-section';
import { ArchiveButton } from './archive-button';
import {
  CONFIDENCE_LABELS,
  CATEGORY_LABELS,
  getOutcomeDisplay,
  type Decision,
  type DecisionEdit,
} from '@/types/decisions';
import { formatDate } from '@/lib/utils';
import { validateRouteId } from '@/lib/validation';
import Link from 'next/link';
import type { JSONContent } from '@tiptap/react';

export default async function DecisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = validateRouteId(rawId);
  if (!id) notFound();

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {decision.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formatDate(decision.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          {!decision.is_archived && (
            <Link href={`/dashboard/decisions/${decision.id}/edit`}>
              <Button variant="secondary" size="sm">
                Edit
              </Button>
            </Link>
          )}
          <ArchiveButton decisionId={decision.id} isArchived={decision.is_archived} />
        </div>
      </div>

      {decision.is_archived && (
        <div className="rounded-lg bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-200/60 dark:border-yellow-800/30 px-3 py-2">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">This decision is archived.</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {(() => {
          const outcome = getOutcomeDisplay(decision.outcome_status, decision.outcome_due_date);
          return <Badge className={outcome.color}>{outcome.label}</Badge>;
        })()}
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {decision.category === 'other' && decision.custom_category
            ? decision.custom_category
            : CATEGORY_LABELS[decision.category]}{' '}
          &middot; {CONFIDENCE_LABELS[decision.confidence]} confidence
        </span>
      </div>

      {decision.context && (
        <Card>
          <h2 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Context</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {decision.context}
          </p>
        </Card>
      )}

      {decision.why && (
        <Card>
          <h2 className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">Why</h2>
          <TiptapReadOnly content={decision.why as JSONContent} />
        </Card>
      )}

      {/* Outcome section */}
      <OutcomeSection
        decisionId={decision.id}
        outcomeStatus={decision.outcome_status}
        outcomeNotes={decision.outcome_notes}
        outcomeRecordedAt={decision.outcome_recorded_at}
        createdAt={decision.created_at}
      />

      {/* Edit History */}
      <Suspense
        fallback={<p className="text-sm text-gray-400 dark:text-gray-500">Loading history...</p>}
      >
        <EditHistory decisionId={decision.id} userId={user.id} />
      </Suspense>
    </div>
  );
}

async function EditHistory({ decisionId, userId }: { decisionId: string; userId: string }) {
  const supabase = await createClient();

  const { data: edits } = (await supabase
    .from('decision_edits')
    .select(
      'id, previous_title, previous_context, previous_confidence, previous_category, edited_at'
    )
    .eq('decision_id', decisionId)
    .order('edited_at', { ascending: false })
    .limit(10)) as { data: DecisionEdit[] | null };

  if (!edits || edits.length === 0) return null;

  void userId;

  return (
    <details className="group">
      <summary className="cursor-pointer text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
        Edit history ({edits.length})
      </summary>
      <div className="mt-2 space-y-2">
        {edits.map((edit) => {
          const changed: string[] = [];
          if (edit.previous_title !== null) changed.push('title');
          if (edit.previous_context !== null) changed.push('context');
          if (edit.previous_confidence !== null) changed.push('confidence');
          if (edit.previous_category !== null) changed.push('category');
          if (changed.length === 0) changed.push('content');

          return (
            <Card key={edit.id} className="text-xs">
              <p className="text-gray-500 dark:text-gray-400">{formatDate(edit.edited_at)}</p>
              <p className="mt-1 text-gray-700 dark:text-gray-300">Changed: {changed.join(', ')}</p>
            </Card>
          );
        })}
      </div>
    </details>
  );
}
