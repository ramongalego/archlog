import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/notion/crypto';
import { searchPages, getChildPages } from '@/lib/notion/client';
import type { NotionSearchResult } from '@/lib/notion/client';
import type { NotionConnection } from '@/types/decisions';

const MAX_SELECTOR_ITEMS = 30;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: connection } = (await supabase
    .from('notion_connections')
    .select('*')
    .eq('user_id', user.id)
    .single()) as { data: NotionConnection | null };

  if (!connection) {
    return NextResponse.json({ error: 'Notion not connected' }, { status: 400 });
  }

  try {
    const token = decrypt(connection.access_token_encrypted);
    const topLevel = await searchPages(token);

    const allPages: NotionSearchResult[] = [];
    const seenIds = new Set<string>();
    const MAX_DEPTH = 3;

    // Recursively collect child pages with breadcrumb paths, fetching siblings in parallel
    async function collectChildren(pageId: string, pathPrefix: string, depth: number) {
      if (depth >= MAX_DEPTH || allPages.length >= MAX_SELECTOR_ITEMS) return;

      let children: Array<{ id: string; title: string }>;
      try {
        children = await getChildPages(token, pageId);
      } catch {
        return;
      }

      // Add all children at this level first
      const addedChildren: Array<{ id: string; title: string; fullTitle: string }> = [];
      for (const child of children) {
        if (allPages.length >= MAX_SELECTOR_ITEMS) break;
        if (seenIds.has(child.id)) continue;
        seenIds.add(child.id);
        const fullTitle = `${pathPrefix}  /  ${child.title}`;
        allPages.push({ id: child.id, object: 'page', title: fullTitle });
        addedChildren.push({ ...child, fullTitle });
      }

      // Then recurse into each child in parallel
      if (depth + 1 < MAX_DEPTH && allPages.length < MAX_SELECTOR_ITEMS) {
        await Promise.allSettled(
          addedChildren.map((child) => collectChildren(child.id, child.fullTitle, depth + 1))
        );
      }
    }

    for (const item of topLevel) {
      if (allPages.length >= MAX_SELECTOR_ITEMS) break;
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      allPages.push(item);

      await collectChildren(item.id, item.title, 0);
    }

    return NextResponse.json({ pages: allPages });
  } catch (err) {
    const status = (err as Error & { status?: number }).status;
    if (status === 401) {
      return NextResponse.json(
        { error: 'Notion token expired. Please reconnect.' },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: 'Failed to fetch Notion pages' }, { status: 500 });
  }
}
