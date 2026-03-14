'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatRelativeDate } from '@/lib/utils';

interface NotionPage {
  id: string;
  object: 'page';
  title: string;
}

interface NotionCardProps {
  connection: {
    id: string;
    notion_workspace_name: string;
    last_scan_at: string | null;
    last_scan_count: number | null;
  } | null;
  projectId: string;
  pendingCount: number;
}

export function NotionCard({ connection, projectId, pendingCount }: NotionCardProps) {
  const router = useRouter();
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectedPages, setSelectedPages] = useState<NotionPage[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [disconnecting, setDisconnecting] = useState(false);
  const [search, setSearch] = useState('');
  const [showFallback, setShowFallback] = useState(false);
  const pagesCacheRef = useRef<NotionPage[] | null>(null);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  // Clean up fallback timer on unmount
  useEffect(() => clearFallbackTimer, [clearFallbackTimer]);

  // Fetch pages when connected, using cache if available
  useEffect(() => {
    if (!connection) return;

    if (pagesCacheRef.current) {
      setPages(pagesCacheRef.current);
      return;
    }

    setLoadingPages(true);
    fetch('/api/notion/pages')
      .then((res) => {
        if (res.status === 401) {
          toast.error('Notion token expired. Please reconnect.');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.pages) {
          pagesCacheRef.current = data.pages;
          setPages(data.pages);
        }
      })
      .catch(() => toast.error('Failed to load Notion pages'))
      .finally(() => setLoadingPages(false));
  }, [connection]);

  function togglePage(page: NotionPage) {
    const exists = selectedPages.find((p) => p.id === page.id);
    if (exists) {
      setSelectedPages(selectedPages.filter((p) => p.id !== page.id));
      return;
    }
    if (selectedPages.length >= 5) {
      toast.warning('You can select up to 5 pages at a time');
      return;
    }
    setSelectedPages([...selectedPages, page]);
  }

  async function handleScan() {
    if (selectedPages.length === 0) {
      toast.warning('Select at least one page');
      return;
    }
    setScanning(true);
    setShowFallback(false);
    clearFallbackTimer();
    fallbackTimerRef.current = setTimeout(() => setShowFallback(true), 10_000);
    const total = selectedPages.length;
    setScanProgress({ current: 0, total });

    let totalFound = 0;
    let totalScanned = 0;

    try {
      for (let i = 0; i < selectedPages.length; i++) {
        setScanProgress({ current: i + 1, total });
        const page = selectedPages[i];

        const res = await fetch('/api/notion/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: projectId,
            pages: [{ id: page.id, object: page.object, title: page.title }],
          }),
        });
        const data = await res.json();

        if (res.status === 401) {
          toast.error(data.error || 'Notion token expired. Please reconnect.');
          clearFallbackTimer();
          setScanning(false);
          setShowFallback(false);
          setScanProgress({ current: 0, total: 0 });
          return;
        }
        if (!res.ok) throw new Error(data.error);

        if (data.warnings) {
          for (const w of data.warnings) toast.warning(w);
        }
        if (data.notes) {
          for (const n of data.notes) toast.info(n);
        }

        totalFound += data.found ?? 0;
        totalScanned += data.scanned ?? 0;
      }

      if (totalFound === 0) {
        toast.info('No decisions found in the selected pages', {
          description: 'Try selecting different pages',
        });
      } else {
        toast.success(
          `${totalFound} decision${totalFound !== 1 ? 's' : ''} found from ${totalScanned} page${totalScanned !== 1 ? 's' : ''}`
        );
      }
      setSelectedPages([]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      clearFallbackTimer();
      setScanning(false);
      setShowFallback(false);
      setScanProgress({ current: 0, total: 0 });
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch('/api/notion/disconnect', { method: 'POST' });
      pagesCacheRef.current = null;
      toast.info('Notion disconnected');
      router.refresh();
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  }

  const filteredPages = search
    ? pages.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()))
    : pages;

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900 dark:bg-white">
            <svg
              className="h-5 w-5 text-white dark:text-gray-900"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notion</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Scan pages for decisions</p>
          </div>
        </div>
        {connection && (
          <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            Connected
          </Badge>
        )}
      </div>

      {!connection ? (
        <a href="/api/notion/auth">
          <Button variant="secondary" size="sm">
            Connect Notion
          </Button>
        </a>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Connected to{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {connection.notion_workspace_name}
            </span>
          </p>

          {/* Page selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Pages{' '}
              <span className="font-normal text-gray-400 dark:text-gray-500">(select up to 5)</span>
            </label>
            <div className="relative">
              {loadingPages && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg
                    className="h-3.5 w-3.5 animate-spin text-gray-400 dark:text-gray-500"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
              )}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={loadingPages ? 'Loading...' : 'Search pages...'}
                disabled={loadingPages}
                className={`w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1.5 text-base md:text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 ${loadingPages ? 'pl-8 pr-3' : 'px-3'}`}
              />
            </div>
            {!loadingPages && filteredPages.length > 0 && (
              <div className="mt-1 max-h-40 overflow-auto rounded-lg border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900">
                {filteredPages.map((page) => {
                  const isSelected = selectedPages.some((p) => p.id === page.id);
                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => togglePage(page)}
                      className={`cursor-pointer flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                      }`}
                    >
                      <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                          />
                        </svg>
                      </span>
                      <span className="truncate">{page.title}</span>
                      {isSelected && (
                        <span className="ml-auto flex-shrink-0 text-xs text-gray-500">
                          &#10003;
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {selectedPages.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedPages.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300"
                  >
                    {p.title.slice(0, 30)}
                    {p.title.length > 30 && '...'}
                    <button
                      type="button"
                      onClick={() => togglePage(p)}
                      className="cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Scan button */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleScan}
              disabled={scanning || selectedPages.length === 0}
            >
              {scanning
                ? `Scanning ${scanProgress.current} of ${scanProgress.total}...`
                : 'Scan for decisions'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnecting || scanning}
            >
              Disconnect
            </Button>
          </div>

          {/* Delayed fallback message during long scans */}
          {scanning && (
            <p
              className="text-xs text-gray-400 dark:text-gray-500 transition-opacity duration-500"
              style={{ opacity: showFallback ? 1 : 0 }}
            >
              This is taking a while. If you&apos;d prefer, you can{' '}
              <Link
                href="/dashboard/decisions/extract"
                className="underline text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                paste your content as text
              </Link>{' '}
              instead.
            </p>
          )}

          {/* Last scan info */}
          {connection.last_scan_at && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Last scan: {formatRelativeDate(connection.last_scan_at)}
              {pendingCount > 0 && (
                <>
                  {' '}
                  &middot; {pendingCount} pending &middot;{' '}
                  <a
                    href="/dashboard/suggestions"
                    className="underline hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    review them
                  </a>
                </>
              )}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
