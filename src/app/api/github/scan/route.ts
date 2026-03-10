import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/github/crypto';
import { getMergedPRs } from '@/lib/github/client';
import { isCandidate, extractDecisionFromPR } from '@/lib/ai/extract-decisions';
import type { GitHubConnection, SuggestedDecision } from '@/types/decisions';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const projectId = body.project_id as string;

  if (!projectId) {
    return NextResponse.json({ error: 'project_id is required' }, { status: 400 });
  }

  const { data: connection } = (await supabase
    .from('github_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()) as { data: GitHubConnection | null };

  if (!connection || !connection.selected_repo) {
    return NextResponse.json({ error: 'GitHub not connected or no repo selected' }, { status: 400 });
  }

  const token = decrypt(connection.access_token_encrypted);

  // 1. Fetch last 50 merged PRs
  const prs = await getMergedPRs(token, connection.selected_repo, 50);

  // 2. Get already-processed PR URLs to skip duplicates
  const { data: existingSuggestions } = (await supabase
    .from('suggested_decisions')
    .select('pr_url')
    .eq('user_id', user.id)) as { data: Pick<SuggestedDecision, 'pr_url'>[] | null };

  const processedUrls = new Set((existingSuggestions ?? []).map((s) => s.pr_url));

  // 3. Filter candidates
  const candidates = prs.filter((pr) => !processedUrls.has(pr.html_url) && isCandidate(pr));

  // 4. Extract decisions via Claude (sequential to avoid rate limits)
  const suggestions: Array<{
    user_id: string;
    project_id: string;
    github_connection_id: string;
    pr_url: string;
    pr_number: number;
    pr_title: string;
    pr_author: string | null;
    pr_body: string | null;
    extracted_title: string;
    extracted_reasoning: string;
    extracted_alternatives: string | null;
    confidence: string;
  }> = [];

  for (const pr of candidates) {
    try {
      const result = await extractDecisionFromPR(pr);
      if (result) {
        suggestions.push({
          user_id: user.id,
          project_id: projectId,
          github_connection_id: connection.id,
          pr_url: pr.html_url,
          pr_number: pr.number,
          pr_title: pr.title,
          pr_author: pr.user?.login ?? null,
          pr_body: (pr.body || '').slice(0, 2000),
          extracted_title: result.title,
          extracted_reasoning: result.reasoning,
          extracted_alternatives: result.alternatives,
          confidence: result.confidence,
        });
      }
    } catch {
      // Skip individual PR failures
    }
  }

  // 5. Insert suggestions
  if (suggestions.length > 0) {
    await supabase.from('suggested_decisions').insert(suggestions);
  }

  // 6. Update scan metadata
  await supabase
    .from('github_connections')
    .update({
      last_scan_at: new Date().toISOString(),
      last_scan_count: suggestions.length,
    })
    .eq('id', connection.id);

  return NextResponse.json({
    scanned: candidates.length,
    found: suggestions.length,
  });
}
