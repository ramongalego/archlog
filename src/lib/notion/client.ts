const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export interface NotionSearchResult {
  id: string;
  object: 'page';
  title: string;
}

interface NotionRichText {
  plain_text: string;
}

interface NotionBlock {
  id: string;
  type: string;
  has_children: boolean;
  [key: string]: unknown;
}

interface NotionUser {
  name: string | null;
  avatar_url: string | null;
}

async function notionFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${NOTION_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    const error = new Error(`Notion API error ${res.status}: ${text}`);
    (error as Error & { status: number }).status = res.status;
    throw error;
  }

  return res.json() as Promise<T>;
}

export async function getNotionUser(token: string): Promise<{ name: string }> {
  const data = await notionFetch<{ bot: { owner: { user?: NotionUser } } }>('/users/me', token);
  return { name: data.bot?.owner?.user?.name ?? 'Notion workspace' };
}

export async function searchPages(token: string): Promise<NotionSearchResult[]> {
  const results: NotionSearchResult[] = [];

  const pageData = await notionFetch<{
    results: Array<{
      id: string;
      object: string;
      properties?: Record<string, { title?: NotionRichText[] }>;
    }>;
  }>('/search', token, {
    method: 'POST',
    body: JSON.stringify({
      filter: { value: 'page', property: 'object' },
      page_size: 50,
    }),
  });

  for (const page of pageData.results) {
    const title = extractPageTitle(page.properties);
    if (title) {
      results.push({ id: page.id, object: 'page', title });
    }
  }

  return results;
}

function extractPageTitle(
  properties?: Record<string, { title?: NotionRichText[] }>
): string | null {
  if (!properties) return null;
  for (const prop of Object.values(properties)) {
    if (prop.title && prop.title.length > 0) {
      return prop.title.map((t) => t.plain_text).join('');
    }
  }
  return null;
}

// Block types we extract text from
const TEXT_BLOCK_TYPES = new Set([
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'bulleted_list_item',
  'numbered_list_item',
  'toggle',
  'quote',
  'callout',
]);

function extractBlockText(block: NotionBlock): string {
  if (!TEXT_BLOCK_TYPES.has(block.type)) return '';

  const blockData = block[block.type] as { rich_text?: NotionRichText[] } | undefined;
  if (!blockData?.rich_text) return '';

  return blockData.rich_text.map((t) => t.plain_text).join('');
}

export async function getPageContent(token: string, pageId: string, depth = 0): Promise<string> {
  const maxDepth = 2;

  // Collect all blocks first (may need pagination)
  const allBlocks: NotionBlock[] = [];
  let cursor: string | undefined;
  do {
    const params = cursor ? `?start_cursor=${cursor}` : '';
    const data = await notionFetch<{
      results: NotionBlock[];
      has_more: boolean;
      next_cursor: string | null;
    }>(`/blocks/${pageId}/children${params}`, token);

    allBlocks.push(...data.results);
    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);

  // Fetch all child block content in parallel
  const childContentMap = new Map<number, string>();
  if (depth < maxDepth) {
    const childBlocks = allBlocks
      .map((block, i) => ({ block, index: i }))
      .filter(({ block }) => block.has_children);

    const results = await Promise.allSettled(
      childBlocks.map(async ({ block, index }) => {
        const content = await getPageContent(token, block.id, depth + 1);
        return { index, content };
      })
    );

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.content) {
        childContentMap.set(result.value.index, result.value.content);
      }
    }
  }

  // Assemble text in order
  const lines: string[] = [];
  for (let i = 0; i < allBlocks.length; i++) {
    const block = allBlocks[i];
    const text = extractBlockText(block);
    if (text) {
      const prefix = block.type.startsWith('heading') ? '\n' : '';
      lines.push(`${prefix}${text}`);
    }
    const childContent = childContentMap.get(i);
    if (childContent) lines.push(childContent);
  }

  return lines.join('\n');
}

/**
 * Fetch direct child pages of a given page/block.
 * Returns child_page blocks only (one level deep, no recursion).
 */
export async function getChildPages(
  token: string,
  pageId: string
): Promise<Array<{ id: string; title: string }>> {
  const children: Array<{ id: string; title: string }> = [];

  let cursor: string | undefined;
  do {
    const params = cursor ? `?start_cursor=${cursor}` : '';
    const data = await notionFetch<{
      results: NotionBlock[];
      has_more: boolean;
      next_cursor: string | null;
    }>(`/blocks/${pageId}/children${params}`, token);

    for (const block of data.results) {
      if (block.type === 'child_page') {
        const blockData = block.child_page as { title?: string } | undefined;
        if (blockData?.title) {
          children.push({ id: block.id, title: blockData.title });
        }
      }
    }

    cursor = data.has_more ? (data.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return children;
}
