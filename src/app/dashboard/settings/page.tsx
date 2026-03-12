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
import type { User } from '@/types/decisions';

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

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tier, setTier] = useState('free');

  const [displayName, setDisplayName] = useState('');
  const [defaultReviewDays, setDefaultReviewDays] = useState(90);
  const [digestOptedIn, setDigestOptedIn] = useState(true);
  const [timezone, setTimezone] = useState('UTC');

  useEffect(() => {
    async function loadSettings() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = (await supabase
        .from('users')
        .select('display_name, default_review_days, digest_opted_in, timezone, subscription_tier')
        .eq('id', user.id)
        .single()) as { data: User | null };

      if (profile) {
        setDisplayName(profile.display_name ?? '');
        setDefaultReviewDays(profile.default_review_days);
        setDigestOptedIn(profile.digest_opted_in);
        setTimezone(profile.timezone);
        setTier(profile.subscription_tier);
      }

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
