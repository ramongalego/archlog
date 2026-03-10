'use client';

import { useEffect, useState } from 'react';
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
import type { User } from '@/types/decisions';

function BillingSection({ tier }: { tier: string }) {
  const searchParams = useSearchParams();
  const [upgrading, setUpgrading] = useState(false);
  const [managing, setManaging] = useState(false);

  const billingStatus = searchParams.get('billing');
  const isPro = tier === 'pro';

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch {
      setUpgrading(false);
    }
  }

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
    <Card>
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Plan</h2>

      {billingStatus === 'success' && (
        <p className="mb-3 text-sm text-green-600">You are now on Pro. Thanks for upgrading.</p>
      )}
      {billingStatus === 'cancelled' && (
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          Checkout was cancelled. No changes made.
        </p>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Badge
          className={
            isPro
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }
        >
          {isPro ? 'Pro' : 'Free'}
        </Badge>
        {!isPro && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            1 project, 50 decisions, AI drafting included
          </span>
        )}
        {isPro && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Unlimited projects, unlimited decisions, AI query
          </span>
        )}
      </div>

      {isPro ? (
        <Button variant="secondary" size="sm" onClick={handleManage} disabled={managing}>
          {managing ? 'Opening...' : 'Manage subscription'}
        </Button>
      ) : (
        <Button size="sm" onClick={handleUpgrade} disabled={upgrading}>
          {upgrading ? 'Redirecting...' : 'Upgrade to Pro'}
        </Button>
      )}
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
              ]}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              How long before you get reminded to review a decision.
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

          <div>
            <label
              htmlFor="timezone"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Timezone
            </label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="e.g. America/New_York"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Used for scheduling digests and reminders.
            </p>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
