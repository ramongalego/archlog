'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatRelativeDate } from '@/lib/utils';

interface GitHubRepo {
  full_name: string;
  name: string;
  private: boolean;
  description: string | null;
}

interface GitHubCardProps {
  connection: {
    id: string;
    github_username: string;
    selected_repo: string | null;
    last_scan_at: string | null;
    last_scan_count: number | null;
  } | null;
  projectId: string;
  pendingCount: number;
}

export function GitHubCard({ connection, projectId, pendingCount }: GitHubCardProps) {
  const router = useRouter();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(connection?.selected_repo ?? '');
  const [scanning, setScanning] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Fetch repos when connected
  useEffect(() => {
    if (connection) {
      setLoadingRepos(true);
      fetch('/api/github/repos')
        .then((res) => res.json())
        .then((data) => {
          if (data.repos) setRepos(data.repos);
        })
        .catch(() => toast.error('Failed to load repositories'))
        .finally(() => setLoadingRepos(false));
    }
  }, [connection]);

  async function handleSelectRepo(repo: string) {
    setSelectedRepo(repo);
    const res = await fetch('/api/github/select-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo }),
    });
    if (!res.ok) toast.error('Failed to select repo');
  }

  async function handleScan() {
    if (!selectedRepo) {
      toast.warning('Select a repository first');
      return;
    }
    setScanning(true);
    try {
      const res = await fetch('/api/github/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.found === 0) {
        toast.info('Nothing stood out from your recent PRs', {
          description: 'Try again after more PRs are merged',
        });
      } else {
        toast.success(
          `${data.found} decision${data.found !== 1 ? 's' : ''} found from ${data.scanned} PR${data.scanned !== 1 ? 's' : ''}`
        );
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await fetch('/api/github/disconnect', { method: 'POST' });
      toast.info('GitHub disconnected');
      router.refresh();
    } catch {
      toast.error('Failed to disconnect');
    } finally {
      setDisconnecting(false);
    }
  }

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
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">GitHub</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Scan merged PRs for architectural decisions
            </p>
          </div>
        </div>
        {connection && (
          <Badge className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            Connected
          </Badge>
        )}
      </div>

      {!connection ? (
        <a href="/api/github/auth">
          <Button variant="secondary" size="sm">
            Connect GitHub
          </Button>
        </a>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Signed in as{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              @{connection.github_username}
            </span>
          </p>

          {/* Repo selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Repository
            </label>
            <Dropdown
              value={selectedRepo}
              onChange={handleSelectRepo}
              placeholder={loadingRepos ? 'Loading repos...' : 'Select a repository'}
              disabled={loadingRepos}
              loading={loadingRepos}
              options={repos.map((r) => ({
                value: r.full_name,
                label: `${r.full_name}${r.private ? ' (private)' : ''}`,
              }))}
            />
          </div>

          {/* Scan button */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleScan}
              disabled={scanning || !selectedRepo}
            >
              {scanning ? 'Scanning...' : 'Scan for decisions'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleDisconnect} disabled={disconnecting}>
              Disconnect
            </Button>
          </div>

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
