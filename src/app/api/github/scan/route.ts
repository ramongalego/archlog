import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/github/crypto';
import { getMergedPRs } from '@/lib/github/client';
import { isCandidate, extractDecisionsFromPRs } from '@/lib/ai/extract-decisions';
import { storeSuggestions } from '@/lib/ai/suggestion-pipeline';
import { githubScanSchema } from '@/lib/validation';
import type { GitHubConnection, SuggestedDecision } from '@/types/decisions';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = githubScanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { project_id: projectId } = parsed.data;

  const { data: connection } = (await supabase
    .from('github_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()) as { data: GitHubConnection | null };

  if (!connection || !connection.selected_repo) {
    return NextResponse.json(
      { error: 'GitHub not connected or no repo selected' },
      { status: 400 }
    );
  }

  const token = decrypt(connection.access_token_encrypted);

  // 1. Fetch last 50 merged PRs
  const prs = await getMergedPRs(token, connection.selected_repo, 50);

  // 2. Get already-processed PR URLs to skip duplicates
  const { data: existingSuggestions } = (await supabase
    .from('suggested_decisions')
    .select('pr_url')
    .eq('user_id', user.id)) as { data: Pick<SuggestedDecision, 'pr_url'>[] | null };

  const processedUrls = new Set((existingSuggestions ?? []).map((s) => s.pr_url).filter(Boolean));

  // 3. Filter candidates
  const candidates = prs.filter((pr) => !processedUrls.has(pr.html_url) && isCandidate(pr));

  // 4. Extract decisions via Claude in batches and store results
  const results = await extractDecisionsFromPRs(candidates);

  // Build a lookup from PR number to PR object for metadata
  const prByNumber = new Map(candidates.map((pr) => [pr.number, pr]));

  let found = 0;
  for (const result of results) {
    if (!result.decision) continue;

    const pr = prByNumber.get(result.pr_number);
    if (!pr) continue;

    try {
      await storeSuggestions(supabase, {
        userId: user.id,
        projectId,
        source: 'github',
        decisions: [result.decision],
        metadata: {
          githubConnectionId: connection.id,
          prUrl: pr.html_url,
          prNumber: pr.number,
          prTitle: pr.title,
          prAuthor: pr.user?.login ?? undefined,
          prBody: (pr.body || '').slice(0, 2000),
        },
      });
      found++;
    } catch {
      // Skip individual storage failures
    }
  }

  // 5. Update scan metadata
  await supabase
    .from('github_connections')
    .update({
      last_scan_at: new Date().toISOString(),
      last_scan_count: found,
    })
    .eq('id', connection.id);

  return NextResponse.json({
    scanned: candidates.length,
    found,
  });
}
