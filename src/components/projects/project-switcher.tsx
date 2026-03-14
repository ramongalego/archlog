'use client';

import { useEffect, useState, useRef, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Project } from '@/types/decisions';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 365}`;
}

export function ProjectSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'name'>[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      // Read active workspace from cookie
      const workspaceCookie = getCookie('active_workspace') ?? 'personal';

      let query = supabase
        .from('projects')
        .select('id, name')
        .eq('is_archived', false)
        .order('is_default', { ascending: false })
        .order('name');

      if (workspaceCookie.startsWith('team:')) {
        const teamId = workspaceCookie.slice(5);
        query = query.eq('team_id', teamId);
      } else {
        query = query.eq('user_id', user.id).is('team_id', null);
      }

      const { data } = (await query) as { data: Pick<Project, 'id' | 'name'>[] | null };

      if (cancelled) return;

      if (data && data.length > 0) {
        setProjects(data);

        const saved = getCookie('active_project');
        const valid = data.some((p) => p.id === saved);
        const nextId = valid && saved ? saved : data[0].id;
        setActiveId(nextId);
        if (!valid) {
          setCookie('active_project', nextId);
        }
      } else {
        setProjects([]);
        setActiveId('');
      }

      setLoading(false);
    }

    load();

    const workspaceHandler = () => {
      setLoading(true);
      load();
    };
    const projectHandler = () => load();
    window.addEventListener('workspace-changed', workspaceHandler);
    window.addEventListener('project-changed', projectHandler);

    return () => {
      cancelled = true;
      window.removeEventListener('workspace-changed', workspaceHandler);
      window.removeEventListener('project-changed', projectHandler);
    };
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(id: string) {
    setActiveId(id);
    setCookie('active_project', id);
    setOpen(false);
    window.dispatchEvent(new Event('project-changed'));
    startTransition(() => {
      router.refresh();
    });
  }

  if (loading) {
    return (
      <div className="w-full animate-pulse">
        <div className="h-[38px] rounded-lg bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (projects.length === 0) return null;

  const activeName = projects.find((p) => p.id === activeId)?.name ?? 'Select project';

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 px-3 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-800 transition-all"
      >
        <span className="truncate">{activeName}</span>
        {isPending ? (
          <svg
            className="ml-2 h-4 w-4 shrink-0 animate-spin text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
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
        ) : (
          <svg
            className={cn(
              'ml-2 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500 transition-transform',
              open && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-lg shadow-gray-200/50 dark:shadow-black/30">
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p.id)}
              className={cn(
                'flex w-full items-center px-3 py-2 text-left text-sm transition-colors',
                p.id === activeId
                  ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              {p.id === activeId && (
                <svg
                  className="mr-2 h-4 w-4 text-gray-900 dark:text-gray-100"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
              <span className={cn('truncate', p.id !== activeId && 'ml-6')}>{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
