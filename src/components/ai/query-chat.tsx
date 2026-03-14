'use client';

import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import Link from 'next/link';

interface Citation {
  id: string;
  title: string;
  created_at: string;
  project_name?: string;
}

export function QueryChat({
  isPro,
  activeProjectId,
  activeProjectName,
  teamName,
}: {
  isPro: boolean;
  activeProjectId?: string | null;
  activeProjectName?: string;
  teamName?: string;
}) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<'project' | 'all'>('project');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  if (!isPro) {
    return (
      <>
        <Card className="text-center py-8">
          <p className="text-gray-700 dark:text-gray-300 font-medium">AI Query is a paid feature</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upgrade to ask questions about your past decisions and get AI-powered insights.
          </p>
          <Button className="mt-4" onClick={() => setShowUpgrade(true)}>
            Upgrade
          </Button>
        </Card>
        <UpgradeModal
          open={showUpgrade}
          currentTier="free"
          onUpgrade={() => {}}
          onClose={() => setShowUpgrade(false)}
        />
      </>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setResponse('');
    setCitations([]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          project_id: scope === 'project' ? (activeProjectId ?? undefined) : undefined,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const body = await res.json();
        toast.error(body.error || 'Something went wrong.');
        setLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        toast.error('Failed to read response stream.');
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from the buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6);
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            if (event.type === 'chunk') {
              setResponse((prev) => prev + event.content);
            } else if (event.type === 'citations') {
              setCitations(event.decisions);
              // Strip the REFS: line from the displayed response
              setResponse((prev) => prev.replace(/\n?REFS:\s*.+$/i, '').trimEnd());
            } else if (event.type === 'error') {
              toast.error(event.message);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled
      } else {
        toast.error('Failed to connect. Please try again.');
      }
    } finally {
      // Always strip REFS line (including "REFS: none") from displayed response
      setResponse((prev) => prev.replace(/\n?REFS:\s*.+$/i, '').trimEnd());
      setLoading(false);
    }
  }

  const projectLabel = activeProjectName || 'This project';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. 'Why did we rebuild the onboarding flow?'"
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-base md:text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-gray-100/10 transition-colors"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? 'Thinking...' : 'Ask'}
          </Button>
        </form>
        <div className="flex items-center justify-between">
          {isPro ? (
            <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
              <button
                type="button"
                onClick={() => setScope('project')}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  scope === 'project'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {projectLabel}
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                  scope === 'all'
                    ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                All projects
              </button>
            </div>
          ) : (
            <span />
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {scope === 'project'
              ? `Searching in ${projectLabel}${teamName ? ` (${teamName})` : ''}`
              : `Searching across all ${teamName ? `${teamName} ` : ''}projects`}
          </p>
        </div>
      </div>

      {(response || loading) && (
        <Card>
          <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {response}
            {loading && !response && (
              <div className="flex justify-center py-4">
                <svg
                  className="h-6 w-6 animate-pulse text-gray-300 dark:text-gray-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            )}
          </div>

          {citations.length > 0 && (
            <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-3">
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Referenced decisions
              </p>
              <ul className="mt-1 space-y-1">
                {citations.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/decisions/${c.id}`}
                      className="text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 underline"
                    >
                      {c.title}
                    </Link>
                    <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">
                      {c.project_name && scope === 'all' ? `${c.project_name} · ` : ''}
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
