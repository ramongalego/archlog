'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-100 dark:border-gray-800/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
            ArchLog
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gray-900 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 mb-8">
            Decision memory for teams that move fast
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl lg:text-6xl leading-[1.1]">
            Remember why
            <br />
            <span className="text-gray-400 dark:text-gray-500">you made that call</span>
          </h1>
          <p className="mt-6 text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg mx-auto">
            Log decisions as they happen. Track what worked and what didn&apos;t. Query your history
            when you need to remember why.
          </p>
          <div className="mt-10 flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-gray-900 dark:bg-white px-6 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
            >
              Start logging decisions
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-gray-200 dark:border-gray-800 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400 dark:text-gray-600">
            Free plan includes 50 decisions and AI drafting.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-gray-100 dark:border-gray-800/60 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
            Four steps to decision clarity
          </h2>
          <p className="mt-4 text-center text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
            Log it, add context, check back later, search when you need it.
          </p>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '1',
                title: 'Capture',
                description:
                  'Log what you decided and why. Dump a rough note and let AI help structure it.',
                icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
              },
              {
                step: '2',
                title: 'Context',
                description:
                  'Record the situation, trade-offs, and your confidence level at the time.',
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
              },
              {
                step: '3',
                title: 'Outcome',
                description:
                  'Get prompted to review decisions after 30, 60, or 90 days. Track what worked.',
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
              },
              {
                step: '4',
                title: 'Query',
                description:
                  'Ask questions in plain English. Get answers grounded in your actual decisions.',
                icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-900">
                  <svg
                    className="h-5 w-5 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={item.icon}
                    />
                  </svg>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Step {item.step}
                </p>
                <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/30 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
            Built for how teams actually work
          </h2>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'AI-assisted entry',
                description:
                  'Paste a rough note and let AI structure it into a proper decision record. You review and edit before saving.',
                icon: 'M13 10V3L4 14h7v7l9-11h-7z',
              },
              {
                title: 'Outcome tracking',
                description:
                  'Get reminded to review past decisions. Mark them as vindicated, reversed, or still playing out.',
                icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
              },
              {
                title: 'Natural language query',
                description:
                  'Ask "Why did we change pricing?" and get answers grounded in your actual logged decisions.',
                icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
              },
              {
                title: 'Projects',
                description:
                  'Organize decisions by product or initiative. Query within a project or across all of them.',
                icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
              },
              {
                title: 'Weekly digest',
                description:
                  'A short email each Monday with recent decisions, upcoming reviews, and a past decision to reflect on.',
                icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
              },
              {
                title: 'Rich text editor',
                description:
                  'Write decisions with formatting, bullet lists, and callout blocks for key trade-offs.',
                icon: 'M4 6h16M4 12h8m-8 6h16',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950 px-5 py-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900">
                  <svg
                    className="h-4 w-4 text-gray-600 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d={feature.icon}
                    />
                  </svg>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t border-gray-100 dark:border-gray-800/60 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
            Simple pricing
          </h2>
          <p className="mt-4 text-center text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Start free. Upgrade when you need more projects and AI search.
          </p>

          {/* Billing toggle */}
          <div className="mt-10 flex items-center justify-center gap-2">
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${!annual ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${annual ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Yearly
                <span className="ml-1.5 rounded-full bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                  -31%
                </span>
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3 max-w-5xl mx-auto">
            {/* Free */}
            <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-6">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Free</p>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  $0
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
              </p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Genuinely useful, not crippled.
              </p>
              <ul className="mt-6 space-y-3">
                {['1 project', '50 decisions', 'AI-assisted drafting', 'Weekly digest emails'].map(
                  (item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500"
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
                      {item}
                    </li>
                  )
                )}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-2.5 text-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* Founder */}
            <div className="rounded-xl border-2 border-gray-900 dark:border-white bg-white dark:bg-gray-950 px-6 py-6 relative">
              <div className="absolute -top-3 left-6">
                <span className="inline-flex items-center rounded-full bg-gray-900 dark:bg-white px-3 py-0.5 text-xs font-semibold text-white dark:text-gray-900">
                  Popular
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Founder</p>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  ${annual ? '8' : '12'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                {annual && <span className="text-xs text-gray-400 dark:text-gray-500">$99/yr</span>}
              </p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                No-brainer for anyone making real decisions.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Unlimited projects',
                  'Unlimited decisions',
                  'AI search across decisions',
                  'Cross-project search',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-gray-900 dark:text-gray-100"
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
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full rounded-lg bg-gray-900 dark:bg-white px-4 py-2.5 text-center text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
              >
                Get started
              </Link>
            </div>

            {/* Team */}
            <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-6">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Team</p>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  ${annual ? '24' : '29'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                {annual && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">$290/yr</span>
                )}
              </p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                For teams up to 5 people. Shared decision history.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Everything in Founder',
                  'Up to 5 users',
                  'Shared projects',
                  'Collaborative decision logging',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-gray-900 dark:text-gray-100"
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
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-2.5 text-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/30 px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
            Stop forgetting why you made that call
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Two minutes to log a decision now saves hours of re-debating later.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-gray-900 dark:bg-white px-6 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
            >
              Start logging decisions
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800/60 py-6 text-center text-sm text-gray-400 dark:text-gray-600">
        ArchLog. Remember why you made that call.
      </footer>
    </div>
  );
}
