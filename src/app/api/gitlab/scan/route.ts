import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/gitlab/crypto';
import { getMergedMRs } from '@/lib/gitlab/client';
import { isCandidate, extractDecisionsFromPRs } from '@/lib/ai/extract-decisions';
import { storeSuggestions } from '@/lib/ai/suggestion-pipeline';
import { gitlabScanSchema } from '@/lib/validation';
import type { GitLabConnection, SuggestedDecision } from '@/types/decisions';

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
  const parsed = gitlabScanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { project_id: projectId } = parsed.data;

  const { data: connection } = (await supabase
    .from('gitlab_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()) as { data: GitLabConnection | null };

  if (!connection || !connection.selected_project) {
    return NextResponse.json(
      { error: 'GitLab not connected or no project selected' },
      { status: 400 }
    );
  }

  const token = decrypt(connection.access_token_encrypted);

  // 1. Fetch last 50 merged MRs
  const mrs = await getMergedMRs(token, connection.selected_project, 50);

  // 2. Get already-processed MR URLs to skip duplicates
  const { data: existingSuggestions } = (await supabase
    .from('suggested_decisions')
    .select('pr_url')
    .eq('user_id', user.id)) as { data: Pick<SuggestedDecision, 'pr_url'>[] | null };

  const processedUrls = new Set((existingSuggestions ?? []).map((s) => s.pr_url).filter(Boolean));

  // 3. Filter candidates — adapt MRs to the GitHubPR shape that isCandidate expects
  const candidateMRs = mrs.filter((mr) => {
    if (processedUrls.has(mr.web_url)) return false;
    // Adapt to isCandidate's expected shape
    return isCandidate({
      number: mr.iid,
      title: mr.title,
      body: mr.description,
      html_url: mr.web_url,
      user: mr.author ? { login: mr.author.username } : null,
      merged_at: mr.merged_at,
    });
  });

  // 4. Adapt MRs to GitHubPR shape for the shared batch extractor
  const adapted = candidateMRs.map((mr) => ({
    number: mr.iid,
    title: mr.title,
    body: mr.description,
    html_url: mr.web_url,
    user: mr.author ? { login: mr.author.username } : null,
    merged_at: mr.merged_at,
  }));

  const results = await extractDecisionsFromPRs(adapted);

  // Build a lookup from MR iid to MR object for metadata
  const mrByNumber = new Map(candidateMRs.map((mr) => [mr.iid, mr]));

  let found = 0;
  for (const result of results) {
    if (!result.decision) continue;

    const mr = mrByNumber.get(result.pr_number);
    if (!mr) continue;

    try {
      await storeSuggestions(supabase, {
        userId: user.id,
        projectId,
        source: 'gitlab',
        decisions: [result.decision],
        metadata: {
          githubConnectionId: connection.id,
          prUrl: mr.web_url,
          prNumber: mr.iid,
          prTitle: mr.title,
          prAuthor: mr.author?.username ?? undefined,
          prBody: (mr.description || '').slice(0, 2000),
        },
      });
      found++;
    } catch {
      // Skip individual storage failures
    }
  }

  // 5. Update scan metadata
  await supabase
    .from('gitlab_connections')
    .update({
      last_scan_at: new Date().toISOString(),
      last_scan_count: found,
    })
    .eq('id', connection.id);

  return NextResponse.json({
    scanned: candidateMRs.length,
    found,
  });
}
