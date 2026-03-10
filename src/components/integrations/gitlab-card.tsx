'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/dropdown';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatRelativeDate } from '@/lib/utils';

interface GitLabProject {
  path_with_namespace: string;
  name: string;
  visibility: string;
  description: string | null;
}

interface GitLabCardProps {
  connection: {
    id: string;
    gitlab_username: string;
    selected_project: string | null;
    last_scan_at: string | null;
    last_scan_count: number | null;
  } | null;
  projectId: string;
  pendingCount: number;
}

export function GitLabCard({ connection, projectId, pendingCount }: GitLabCardProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<GitLabProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState(connection?.selected_project ?? '');
  const [scanning, setScanning] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Fetch projects when connected
  useEffect(() => {
    if (connection) {
      setLoadingProjects(true);
      fetch('/api/gitlab/projects')
        .then((res) => res.json())
        .then((data) => {
          if (data.projects) setProjects(data.projects);
        })
        .catch(() => toast.error('Failed to load projects'))
        .finally(() => setLoadingProjects(false));
    }
  }, [connection]);

  async function handleSelectProject(project: string) {
    setSelectedProject(project);
    const res = await fetch('/api/gitlab/select-project', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project }),
    });
    if (!res.ok) toast.error('Failed to select project');
  }

  async function handleScan() {
    if (!selectedProject) {
      toast.warning('Select a project first');
      return;
    }
    setScanning(true);
    try {
      const res = await fetch('/api/gitlab/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.found === 0) {
        toast.info('Nothing stood out from your recent MRs', {
          description: 'Try again after more MRs are merged',
        });
      } else {
        toast.success(
          `${data.found} decision${data.found !== 1 ? 's' : ''} found from ${data.scanned} MR${data.scanned !== 1 ? 's' : ''}`
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
      await fetch('/api/gitlab/disconnect', { method: 'POST' });
      toast.info('GitLab disconnected');
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
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FC6D26]">
            <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.955 13.587l-1.342-4.135-2.664-8.189a.455.455 0 00-.867 0L16.418 9.45H7.582L4.918 1.263a.455.455 0 00-.867 0L1.386 9.452.044 13.587a.924.924 0 00.331 1.023L12 23.054l11.625-8.443a.92.92 0 00.33-1.024" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">GitLab</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Scan merged MRs for architectural decisions
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
        <a href="/api/gitlab/auth">
          <Button variant="secondary" size="sm">
            Connect GitLab
          </Button>
        </a>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Signed in as{' '}
            <span className="font-medium text-gray-700 dark:text-gray-300">
              @{connection.gitlab_username}
            </span>
          </p>

          {/* Project selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Project
            </label>
            <Dropdown
              value={selectedProject}
              onChange={handleSelectProject}
              placeholder={loadingProjects ? 'Loading projects...' : 'Select a project'}
              disabled={loadingProjects}
              options={projects.map((p) => ({
                value: p.path_with_namespace,
                label: `${p.path_with_namespace}${p.visibility === 'private' ? ' (private)' : ''}`,
              }))}
            />
          </div>

          {/* Scan button */}
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleScan}
              disabled={scanning || !selectedProject}
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
