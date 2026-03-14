'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { updateSettings } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dropdown } from '@/components/ui/dropdown';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { UpgradeModal } from '@/components/ui/upgrade-modal';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import type { User, Team } from '@/types/decisions';
import {
  createTeam,
  renameTeam,
  inviteTeamMember,
  removeTeamMember,
  leaveTeam,
  dissolveTeam,
  getTeamsForUser,
  getPendingInvites,
  acceptInviteById,
  type TeamMemberWithName,
} from './team-actions';

function resetWorkspaceCookie() {
  document.cookie = 'active_workspace=personal;path=/;max-age=31536000';
}

const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: 'Pacific/Midway', label: 'UTC-11:00 - American Samoa' },
  { value: 'Pacific/Honolulu', label: 'UTC-10:00 - Hawaii' },
  { value: 'America/Anchorage', label: 'UTC-09:00 - Alaska' },
  { value: 'America/Los_Angeles', label: 'UTC-08:00 - Pacific Time (US & Canada)' },
  { value: 'America/Denver', label: 'UTC-07:00 - Mountain Time (US & Canada)' },
  { value: 'America/Chicago', label: 'UTC-06:00 - Central Time (US & Canada)' },
  { value: 'America/New_York', label: 'UTC-05:00 - Eastern Time (US & Canada)' },
  { value: 'America/Halifax', label: 'UTC-04:00 - Atlantic Time' },
  { value: 'America/Sao_Paulo', label: 'UTC-03:00 - Buenos Aires / Sao Paulo' },
  { value: 'Atlantic/Azores', label: 'UTC-01:00 - Azores' },
  { value: 'Europe/London', label: 'UTC+00:00 - London / Lisbon / Dublin' },
  { value: 'Europe/Paris', label: 'UTC+01:00 - Paris / Berlin / Madrid / Rome' },
  { value: 'Europe/Helsinki', label: 'UTC+02:00 - Cairo / Johannesburg / Helsinki' },
  { value: 'Europe/Moscow', label: 'UTC+03:00 - Moscow / Istanbul / Nairobi' },
  { value: 'Asia/Dubai', label: 'UTC+04:00 - Dubai / Baku' },
  { value: 'Asia/Karachi', label: 'UTC+05:00 - Karachi / Tashkent' },
  { value: 'Asia/Kolkata', label: 'UTC+05:30 - India' },
  { value: 'Asia/Dhaka', label: 'UTC+06:00 - Dhaka / Almaty' },
  { value: 'Asia/Bangkok', label: 'UTC+07:00 - Bangkok / Jakarta' },
  { value: 'Asia/Singapore', label: 'UTC+08:00 - Singapore / Hong Kong / Perth' },
  { value: 'Asia/Tokyo', label: 'UTC+09:00 - Tokyo / Seoul' },
  { value: 'Australia/Adelaide', label: 'UTC+09:30 - Adelaide / Darwin' },
  { value: 'Australia/Sydney', label: 'UTC+10:00 - Sydney / Brisbane' },
  { value: 'Pacific/Auckland', label: 'UTC+12:00 - Auckland' },
];

function getTimezoneLabel(tz: string): string {
  return COMMON_TIMEZONES.find((t) => t.value === tz)?.label ?? tz;
}

function TimezoneField({
  timezone,
  onChange,
}: {
  timezone: string;
  onChange: (tz: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search) return COMMON_TIMEZONES;
    const q = search.toLowerCase();
    return COMMON_TIMEZONES.filter(
      (tz) => tz.label.toLowerCase().includes(q) || tz.value.toLowerCase().includes(q)
    );
  }, [search]);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => {
    if (!editing) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setEditing(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [editing]);

  if (!editing) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Timezone: {getTimezoneLabel(timezone)} &middot;
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline underline-offset-2 transition-colors"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Timezone
      </label>
      <Input
        ref={inputRef}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search timezones..."
      />
      <div className="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-auto rounded-lg border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-lg shadow-gray-200/50 dark:shadow-black/30">
        {filtered.map((tz) => (
          <button
            key={tz.value}
            type="button"
            onClick={() => {
              onChange(tz.value);
              setEditing(false);
              setSearch('');
            }}
            className={`cursor-pointer flex w-full items-center px-3 py-1.5 text-left text-sm transition-colors ${
              tz.value === timezone
                ? 'bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tz.label}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No matches</p>
        )}
      </div>
    </div>
  );
}

function BillingSection({ tier }: { tier: string }) {
  const searchParams = useSearchParams();
  const [managing, setManaging] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const billingStatus = searchParams.get('billing');
  const isPaid = tier === 'pro' || tier === 'team';
  const tierLabel = tier === 'team' ? 'Team' : tier === 'pro' ? 'Solo' : 'Free';

  async function handleManage() {
    setManaging(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (data.portal_url) {
        window.location.href = data.portal_url;
      }
    } catch {
      setManaging(false);
    }
  }

  return (
    <>
      <Card>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Plan</h2>

        {billingStatus === 'success' && (
          <p className="mb-3 text-sm text-green-600">
            You are now on {tierLabel}. Thanks for upgrading.
          </p>
        )}
        {billingStatus === 'cancelled' && (
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Checkout was cancelled. No changes made.
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          <Badge
            className={
              tier === 'team'
                ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                : tier === 'pro'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }
          >
            {tierLabel}
          </Badge>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {tier === 'free' && '1 project, 50 decisions, AI drafting included'}
            {tier === 'pro' && 'Unlimited projects, unlimited decisions, AI query'}
            {tier === 'team' && 'Unlimited projects, unlimited decisions, AI query, up to 5 users'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {tier !== 'team' && (
            <Button size="sm" onClick={() => setShowUpgrade(true)}>
              Upgrade
            </Button>
          )}
          {isPaid && (
            <Button variant="secondary" size="sm" onClick={handleManage} disabled={managing}>
              {managing ? 'Opening...' : 'Manage subscription'}
            </Button>
          )}
        </div>
      </Card>

      <UpgradeModal
        open={showUpgrade}
        currentTier={tier as 'free' | 'pro' | 'team'}
        onUpgrade={() => {}}
        onClose={() => setShowUpgrade(false)}
      />
    </>
  );
}

function TeamSection({
  tier,
  initialOwned,
  initialMemberships,
}: {
  tier: string;
  initialOwned: (Team & { members: TeamMemberWithName[] })[];
  initialMemberships: (Team & { members: TeamMemberWithName[] })[];
}) {
  const [owned, setOwned] = useState(initialOwned);
  const [memberships, setMemberships] = useState(initialMemberships);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);

  async function loadTeams() {
    const result = await getTeamsForUser();
    setOwned(result.owned);
    setMemberships(result.memberships);
  }

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    setCreating(true);
    const result = await createTeam(newTeamName.trim());
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Team created.');
      setNewTeamName('');
      window.dispatchEvent(new Event('teams-changed'));
      await loadTeams();
    }
    setCreating(false);
  }

  async function handleInvite(teamId: string) {
    if (!inviteEmail.trim()) return;
    setInviting(teamId);
    const result = await inviteTeamMember(teamId, inviteEmail.trim());
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Invitation sent.');
      setInviteEmail('');
      await loadTeams();
    }
    setInviting(null);
  }

  const [removing, setRemoving] = useState<string | null>(null);

  async function handleRemove(teamId: string, memberId: string) {
    setRemoving(memberId);
    const result = await removeTeamMember(teamId, memberId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Member removed.');
      await loadTeams();
    }
    setRemoving(null);
  }

  async function handleLeave(teamId: string) {
    const result = await leaveTeam(teamId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('You left the team.');
      resetWorkspaceCookie();
      window.dispatchEvent(new Event('workspace-changed'));
      window.dispatchEvent(new Event('teams-changed'));
      await loadTeams();
    }
  }

  const [editingName, setEditingName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [dissolveTarget, setDissolveTarget] = useState<string | null>(null);

  async function handleRename(teamId: string) {
    if (!editNameValue.trim()) return;
    setSavingName(true);
    const result = await renameTeam(teamId, editNameValue.trim());
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Team renamed.');
      window.dispatchEvent(new Event('teams-changed'));
      await loadTeams();
    }
    setSavingName(false);
    setEditingName(null);
  }

  async function handleDissolve(teamId: string) {
    setDissolveTarget(null);
    const result = await dissolveTeam(teamId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Team dissolved.');
      resetWorkspaceCookie();
      window.dispatchEvent(new Event('workspace-changed'));
      window.dispatchEvent(new Event('teams-changed'));
      await loadTeams();
    }
  }

  return (
    <>
      {/* Teams you own */}
      {owned.map((team) => (
        <Card key={team.id}>
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Team
            </p>
            {editingName === team.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRename(team.id);
                }}
                className="flex items-center gap-2"
              >
                <Input
                  value={editNameValue}
                  onChange={(e) => setEditNameValue(e.target.value)}
                  className="text-lg font-semibold"
                  autoFocus
                  disabled={savingName}
                />
                <Button size="sm" type="submit" disabled={savingName || !editNameValue.trim()}>
                  {savingName ? 'Saving...' : 'Save'}
                </Button>
                <button
                  type="button"
                  onClick={() => setEditingName(null)}
                  className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {team.name}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingName(team.id);
                    setEditNameValue(team.name);
                  }}
                  className="cursor-pointer text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Members
              </p>
              <span
                className={`text-xs ${
                  team.members.length >= 5
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {team.members.length}/5
              </span>
            </div>
            {team.members.map((member) => (
              <div key={member.id} className="flex items-center justify-between py-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 dark:text-gray-300">
                    {member.status === 'accepted' && member.display_name
                      ? member.display_name
                      : member.email}
                  </span>
                  <Badge
                    className={
                      member.role === 'owner'
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                        : member.status === 'pending'
                          ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                    }
                  >
                    {member.role === 'owner'
                      ? 'Owner'
                      : member.status === 'pending'
                        ? 'Pending'
                        : 'Member'}
                  </Badge>
                </div>
                {member.role !== 'owner' && (
                  <button
                    type="button"
                    onClick={() => handleRemove(team.id, member.id)}
                    disabled={removing === member.id}
                    className="cursor-pointer text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                  >
                    {removing === member.id ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>
            ))}
          </div>

          {team.members.length < 5 ? (
            <div className="flex items-center gap-2 mb-4">
              <Input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => handleInvite(team.id)}
                disabled={inviting === team.id}
              >
                {inviting === team.id ? 'Sending...' : 'Invite'}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 my-6 text-center">
              Team is at the 5-member limit. Remove a member to invite someone new.
            </p>
          )}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setDissolveTarget(team.id)}
              className="cursor-pointer text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Dissolve team
            </button>
          </div>
          <ConfirmModal
            open={dissolveTarget === team.id}
            title="Dissolve this team?"
            description="This will permanently delete all team projects and their decisions. All members will be removed. This action cannot be undone."
            confirmLabel="Dissolve team"
            variant="danger"
            onConfirm={() => handleDissolve(team.id)}
            onCancel={() => setDissolveTarget(null)}
          />
        </Card>
      ))}

      {/* Teams you're a member of */}
      {memberships.map((team) => (
        <Card key={team.id}>
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Team
            </p>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{team.name}</h2>
          </div>

          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Members
            </p>
            {team.members
              .filter((m) => m.status === 'accepted')
              .map((member) => (
                <div key={member.id} className="flex items-center gap-2 py-1.5 text-sm">
                  <span className="text-gray-700 dark:text-gray-300">
                    {member.display_name || member.email}
                  </span>
                  {member.role === 'owner' && (
                    <Badge className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                      Owner
                    </Badge>
                  )}
                </div>
              ))}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => handleLeave(team.id)}
              className="cursor-pointer text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Leave team
            </button>
          </div>
        </Card>
      ))}

      {/* Create team form (show for team tier users who don't own a team yet) */}
      {owned.length === 0 && tier === 'team' && (
        <Card>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Team</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Create a team to share projects and collaborate on decisions.
          </p>
          <form onSubmit={handleCreateTeam} className="flex items-center gap-2">
            <Input
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="Team name"
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={creating}>
              {creating ? 'Creating...' : 'Create team'}
            </Button>
          </form>
        </Card>
      )}
    </>
  );
}

interface PendingInvite {
  id: string;
  team_id: string;
  team_name: string;
  invited_at: string;
}

function PendingInvitationsSection({ invites: initialInvites }: { invites: PendingInvite[] }) {
  const [invites, setInvites] = useState(initialInvites);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    setInvites(initialInvites);
  }, [initialInvites]);

  if (invites.length === 0) return null;

  async function handleAccept(invite: PendingInvite) {
    setAccepting(invite.id);
    const result = await acceptInviteById(invite.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(`You have joined ${invite.team_name}.`);
      setInvites((prev) => prev.filter((i) => i.id !== invite.id));
      window.dispatchEvent(new Event('workspace-changed'));
      window.dispatchEvent(new Event('teams-changed'));
    }
    setAccepting(null);
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Pending Invitations
      </h2>
      <div className="space-y-2">
        {invites.map((invite) => (
          <div key={invite.id} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {invite.team_name}
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => handleAccept(invite)}
              disabled={accepting === invite.id}
            >
              {accepting === invite.id ? 'Accepting...' : 'Accept'}
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tier, setTier] = useState('free');

  const [displayName, setDisplayName] = useState('');
  const [defaultReviewDays, setDefaultReviewDays] = useState(90);
  const [digestOptedIn, setDigestOptedIn] = useState(true);
  const [timezone, setTimezone] = useState('UTC');

  const [ownedTeams, setOwnedTeams] = useState<(Team & { members: TeamMemberWithName[] })[]>([]);
  const [memberTeams, setMemberTeams] = useState<(Team & { members: TeamMemberWithName[] })[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const profilePromise = supabase
        .from('users')
        .select('display_name, default_review_days, digest_opted_in, timezone, subscription_tier')
        .eq('id', user.id)
        .single();

      const [{ data: profile }, teams, pending] = await Promise.all([
        profilePromise as unknown as Promise<{ data: User | null }>,
        getTeamsForUser(),
        getPendingInvites(),
      ]);

      if (profile) {
        setDisplayName(profile.display_name ?? '');
        setDefaultReviewDays(profile.default_review_days);
        setDigestOptedIn(profile.digest_opted_in);
        setTimezone(profile.timezone);
        setTier(profile.subscription_tier);
      }

      setOwnedTeams(teams.owned);
      setMemberTeams(teams.memberships);
      setPendingInvites(pending.invites);

      setLoading(false);
    }

    loadSettings();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.set('display_name', displayName);
    formData.set('default_review_days', String(defaultReviewDays));
    if (digestOptedIn) formData.set('digest_opted_in', 'on');
    formData.set('timezone', timezone);

    const result = await updateSettings(formData);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Settings saved.');
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 animate-pulse">
        <div className="h-8 w-24 rounded bg-gray-200 dark:bg-gray-800" />
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 space-y-3">
          <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="flex items-center gap-2">
            <div className="h-5 w-12 rounded-md bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-48 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="h-8 w-36 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
        <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" />

      <BillingSection tier={tier} />

      <PendingInvitationsSection invites={pendingInvites} />

      {(tier === 'team' || memberTeams.length > 0) && (
        <TeamSection tier={tier} initialOwned={ownedTeams} initialMemberships={memberTeams} />
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="display_name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Display name
            </label>
            <Input
              id="display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default review period
            </label>
            <Dropdown
              value={String(defaultReviewDays)}
              onChange={(val) => setDefaultReviewDays(Number(val))}
              options={[
                { value: '30', label: '30 days' },
                { value: '60', label: '60 days' },
                { value: '90', label: '90 days' },
                { value: '180', label: '180 days' },
              ]}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Sets the initial review date when logging a new decision. Can be changed per decision.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="digest_opted_in"
              type="checkbox"
              checked={digestOptedIn}
              onChange={(e) => setDigestOptedIn(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-900/20 dark:focus:ring-gray-100/20"
            />
            <label
              htmlFor="digest_opted_in"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Receive weekly digest emails
            </label>
          </div>

          <TimezoneField timezone={timezone} onChange={setTimezone} />

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
