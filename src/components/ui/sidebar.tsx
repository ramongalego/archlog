'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef, useTransition } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { ProjectSwitcher } from '@/components/projects/project-switcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  {
    href: '/dashboard/decisions',
    label: 'Decisions',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    href: '/dashboard/ask',
    label: 'Ask',
    icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
  },
  {
    href: '/dashboard/analytics',
    label: 'Analytics',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  {
    href: '/dashboard/projects',
    label: 'Projects',
    icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  },
  {
    href: '/dashboard/integrations',
    label: 'Integrations',
    icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
  },
];

interface WorkspaceOption {
  id: string;
  label: string;
  type: 'personal' | 'team';
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${60 * 60 * 24 * 365}`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=;path=/;max-age=0`;
}

function WorkspaceSwitcher() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceOption[]>([]);
  const [activeValue, setActiveValue] = useState('personal');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get teams user belongs to
      const { data: memberships } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      const options: WorkspaceOption[] = [
        { id: 'personal', label: 'Personal', type: 'personal' },
      ];

      if (memberships && memberships.length > 0) {
        const teamIds = memberships.map((m) => m.team_id);
        const { data: teams } = await supabase
          .from('teams')
          .select('id, name')
          .in('id', teamIds);

        for (const team of teams ?? []) {
          options.push({ id: `team:${team.id}`, label: team.name, type: 'team' });
        }
      }

      setWorkspaces(options);

      const saved = getCookie('active_workspace') ?? 'personal';
      const valid = options.some((w) => w.id === saved);
      const nextValue = valid ? saved : 'personal';
      setActiveValue(nextValue);
      if (!valid && saved !== 'personal') {
        setCookie('active_workspace', 'personal');
      }

      setLoading(false);
    }

    load();

    const handler = () => {
      setLoading(true);
      load();
    };
    // teams-changed: re-fetch without skeleton flash (avoids pop-in on create)
    const teamsHandler = () => load();
    window.addEventListener('workspace-changed', handler);
    window.addEventListener('teams-changed', teamsHandler);
    return () => {
      window.removeEventListener('workspace-changed', handler);
      window.removeEventListener('teams-changed', teamsHandler);
    };
  }, []);

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
    setActiveValue(id);
    setCookie('active_workspace', id);
    // Clear stale project — new workspace has different projects
    clearCookie('active_project');
    setOpen(false);
    window.dispatchEvent(new Event('workspace-changed'));
    window.dispatchEvent(new Event('project-changed'));
    startTransition(() => {
      router.refresh();
    });
  }

  if (loading || workspaces.length <= 1) return null;

  const activeLabel = workspaces.find((w) => w.id === activeValue)?.label ?? 'Personal';
  const activeType = workspaces.find((w) => w.id === activeValue)?.type ?? 'personal';

  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center mb-1">Team</p>
      <div ref={containerRef} className="relative w-full mb-2">
        <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200/80 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900 px-3 py-2 text-left text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100/80 dark:hover:bg-gray-800 transition-all"
      >
        <span className="flex items-center gap-2 truncate">
          {activeType === 'team' ? (
            <svg className="h-3.5 w-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )}
          {activeLabel}
        </span>
        {isPending ? (
          <svg className="ml-2 h-4 w-4 shrink-0 animate-spin text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg
            className={cn('ml-2 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500 transition-transform', open && 'rotate-180')}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-lg shadow-gray-200/50 dark:shadow-black/30">
          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => handleSelect(w.id)}
              className={cn(
                'flex w-full items-center px-3 py-2 text-left text-sm transition-colors',
                w.id === activeValue
                  ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
              )}
            >
              {w.id === activeValue && (
                <svg className="mr-2 h-4 w-4 text-gray-900 dark:text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span className={cn('flex items-center gap-2 truncate', w.id !== activeValue && 'ml-6')}>
                {w.type === 'team' ? (
                  <svg className="h-3.5 w-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
                {w.label}
              </span>
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [overdueCount, setOverdueCount] = useState(0);
  const [pendingInviteCount, setPendingInviteCount] = useState(0);

  const [projectVersion, setProjectVersion] = useState(0);

  useEffect(() => {
    const handler = () => setProjectVersion((v) => v + 1);
    window.addEventListener('project-changed', handler);
    window.addEventListener('workspace-changed', handler);
    return () => {
      window.removeEventListener('project-changed', handler);
      window.removeEventListener('workspace-changed', handler);
    };
  }, []);

  useEffect(() => {
    async function fetchOverdue() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Read active project from cookie
      const activeProject =
        document.cookie
          .split('; ')
          .find((c) => c.startsWith('active_project='))
          ?.split('=')[1] ?? null;

      let query = supabase
        .from('decisions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .in('outcome_status', ['pending', 'still_playing_out'])
        .lte('outcome_due_date', new Date().toISOString());

      if (activeProject) {
        query = query.eq('project_id', activeProject);
      }

      const { count } = await query;
      setOverdueCount(count ?? 0);
    }

    async function fetchPendingInvites() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { count } = await supabase
        .from('team_members')
        .select('*', { count: 'exact', head: true })
        .eq('email', user.email.toLowerCase())
        .eq('status', 'pending');

      setPendingInviteCount(count ?? 0);
    }

    fetchOverdue();
    fetchPendingInvites();
  }, [pathname, projectVersion]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearCookie('active_workspace');
    clearCookie('active_project');
    router.push('/login');
  }

  const navContent = (
    <>
      <div className="px-4 py-5 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
            ArchLog
          </span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="px-3 pb-4 space-y-3">
        <WorkspaceSwitcher />
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 text-center mb-1">Project</p>
          <ProjectSwitcher />
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                isActive
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d={item.icon}
                />
              </svg>
              {item.label}
              {item.href === '/dashboard/decisions' && overdueCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">
                  {overdueCount}
                </span>
              )}
              {item.href === '/dashboard/settings' && pendingInviteCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-purple-500 px-1.5 text-[11px] font-semibold text-white">
                  {pendingInviteCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={handleSignOut}
          className="cursor-pointer flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-150"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="cursor-pointer fixed left-3 top-3 z-40 rounded-lg border border-gray-200/80 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-2 text-gray-600 dark:text-gray-400 shadow-sm md:hidden"
        aria-label="Open menu"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex h-full w-60 flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="cursor-pointer absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            {navContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-full w-60 flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        {navContent}
      </aside>
    </>
  );
}
