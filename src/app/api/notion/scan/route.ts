import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/notion/crypto';
import { getPageContent, getChildPages } from '@/lib/notion/client';
import { extractDecisionsFromText } from '@/lib/ai/suggestion-pipeline';
import { storeSuggestions } from '@/lib/ai/suggestion-pipeline';
import { notionScanSchema } from '@/lib/validation';
import { checkRateLimit, rateLimits } from '@/lib/api/rate-limit';
import { logger } from '@/lib/logger';
import type { NotionConnection } from '@/types/decisions';

export const maxDuration = 120;

const MAX_CHARS_PER_PAGE = 8000;
const BATCH_CHAR_LIMIT = 5000; // Match extractDecisionsFromText's internal cap

interface ScanItem {
  id: string;
  object: 'page';
  title?: string;
}

/**
 * Combine multiple text chunks into batches that fit within the char limit.
 * Each batch is a single string sent to one Claude call.
 */
function batchChunks(chunks: string[]): string[] {
  const batches: string[] = [];
  let current = '';

  for (const chunk of chunks) {
    const separator = current ? '\n\n---\n\n' : '';
    if (current && current.length + separator.length + chunk.length > BATCH_CHAR_LIMIT) {
      batches.push(current);
      current = chunk.slice(0, BATCH_CHAR_LIMIT);
    } else {
      current += separator + chunk;
    }
  }

  if (current) batches.push(current);
  return batches;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rl = checkRateLimit(`scan:notion:${user.id}`, rateLimits.integrationScan);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': Math.ceil((rl.resetAt - Date.now()) / 1000).toString() },
      }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  const parsed = notionScanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { project_id: projectId, pages } = parsed.data;

  const { data: connection } = (await supabase
    .from('notion_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()) as { data: NotionConnection | null };

  if (!connection) {
    return NextResponse.json({ error: 'Notion not connected' }, { status: 400 });
  }

  let token: string;
  try {
    token = decrypt(connection.access_token_encrypted);
  } catch {
    return NextResponse.json({ error: 'Notion token invalid. Please reconnect.' }, { status: 401 });
  }

  const userId = user.id;
  const warnings: string[] = [];
  const notes: string[] = [];
  let found = 0;

  // Phase 1: Fetch all content from Notion in parallel
  const contentChunks: string[] = [];
  const item = (pages as ScanItem[])[0]; // Client sends one page at a time for progress

  if (!item) {
    return NextResponse.json({ scanned: 0, found: 0 });
  }

  try {
    const content = await getPageContent(token, item.id);

    if (content.trim().length >= 200) {
      contentChunks.push(content.slice(0, MAX_CHARS_PER_PAGE));
    } else {
      // Container page — fetch child pages in parallel
      try {
        const children = await getChildPages(token, item.id);
        if (children.length > 0) {
          const pageName = item.title ?? 'This page';
          notes.push(`${pageName} had no direct content - scanned its sub-pages instead`);

          const childResults = await Promise.allSettled(
            children.map(async (child) => {
              const childContent = await getPageContent(token, child.id);
              if (childContent.trim()) {
                return `# ${child.title}\n${childContent}`.slice(0, MAX_CHARS_PER_PAGE);
              }
              return null;
            })
          );

          for (const result of childResults) {
            if (result.status === 'fulfilled' && result.value) {
              contentChunks.push(result.value);
            } else if (result.status === 'rejected') {
              const status = (result.reason as Error & { status?: number })?.status;
              if (status === 403) {
                warnings.push('Some pages were inaccessible - check your Notion permissions');
              }
            }
          }
        }
      } catch (err) {
        logger.warn('Notion child-page fetch failed', {
          pageId: item.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch (err) {
    const status = (err as Error & { status?: number }).status;
    if (status === 401) {
      return NextResponse.json(
        { error: 'Notion token expired. Please reconnect.' },
        { status: 401 }
      );
    }
    if (status === 403) {
      warnings.push('Some pages were inaccessible - check your Notion permissions');
    }
  }

  // Phase 2: Batch content into combined chunks and extract decisions
  const batches = batchChunks(contentChunks);

  for (const batch of batches) {
    const decisions = await extractDecisionsFromText(batch);
    if (decisions.length > 0) {
      try {
        const count = await storeSuggestions(supabase, {
          userId,
          projectId,
          source: 'notion',
          decisions,
        });
        found += count;
      } catch (err) {
        logger.warn('Failed to store Notion suggestions', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // Update scan metadata
  await supabase
    .from('notion_connections')
    .update({
      last_scan_at: new Date().toISOString(),
      last_scan_count: found,
    })
    .eq('id', connection.id);

  const uniqueWarnings = [...new Set(warnings)];

  return NextResponse.json({
    scanned: contentChunks.length,
    found,
    warnings: uniqueWarnings.length > 0 ? uniqueWarnings : undefined,
    notes: notes.length > 0 ? notes : undefined,
  });
}
