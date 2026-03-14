import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Decision' };
import { Button } from '@/components/ui/button';
import { TiptapReadOnly } from '@/components/decisions/tiptap-editor';
import { OutcomeSection } from '@/components/decisions/outcome-section';
import { ArchiveButton } from './archive-button';
import { DeleteButton } from '@/components/decisions/delete-button';
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

  // RLS ensures only accessible decisions are returned (own + team)
  const { data: decision } = (await supabase
    .from('decisions')
    .select('*')
    .eq('id', id)
    .single()) as { data: Decision | null };

  if (!decision) notFound();

  // Check if this is a team project and get author info
  const { data: project } = await supabase
    .from('projects')
    .select('team_id')
    .eq('id', decision.project_id)
    .single();

  const isTeamProject = project?.team_id != null;
  let authorName: string | null = null;

  if (isTeamProject) {
    const { data: author } = await supabase
      .from('users')
      .select('display_name, email')
      .eq('id', decision.user_id)
      .single();

    authorName = author?.display_name ?? author?.email ?? null;
  }

  // Determine if current user can edit/delete (own decision or team owner)
  const isOwn = decision.user_id === user.id;
  const isTeamOwner = isTeamProject
    ? (await supabase.from('teams').select('owner_id').eq('id', project!.team_id!).single()).data?.owner_id === user.id
    : false;
  const canModify = isOwn || isTeamOwner;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {decision.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formatDate(decision.created_at)}
            {authorName && (
              <span> &middot; by {authorName}</span>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          {!decision.is_archived && canModify && (
            <Link href={`/dashboard/decisions/${decision.id}/edit`}>
              <Button variant="secondary" size="sm">
                <span className="flex items-center gap-1">
                  <svg
                    className="h-3 w-3"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 2l3 3L5 14H2v-3z" />
                  </svg>
                  Edit
                </span>
              </Button>
            </Link>
          )}
          {canModify && (
            <ArchiveButton decisionId={decision.id} isArchived={decision.is_archived} />
          )}
          {decision.is_archived && canModify && (
            <DeleteButton decisionId={decision.id} variant="ghost" />
          )}
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
