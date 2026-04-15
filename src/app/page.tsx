'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MarketingHeader } from '@/components/ui/marketing-header';
import { LandingJsonLd } from '@/components/seo/json-ld';

export default function LandingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-950">
      <LandingJsonLd />
      <MarketingHeader
        nav={
          <nav className="hidden sm:flex items-center gap-6">
            <a
              href="#how-it-works"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              How it works
            </a>
            <a
              href="#integrations"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Integrations
            </a>
            <a
              href="#pricing"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Pricing
            </a>
          </nav>
        }
      />

      {/* Hero — notebook/ledger aesthetic */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        {/* Horizontal ruled lines — like a legal pad */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_39px,rgba(0,0,0,0.04)_39px,rgba(0,0,0,0.04)_40px)] dark:bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_39px,rgba(255,255,255,0.04)_39px,rgba(255,255,255,0.04)_40px)]"
        />
        {/* Left margin rule — like a notebook margin */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-8 hidden w-0.5 bg-amber-500/50 md:block lg:left-16"
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 mb-8">
            Decision memory for teams that move fast
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-5xl lg:text-6xl leading-[1.1]">
            <span className="relative inline-block">
              <span className="relative z-10">Remember</span>
              {/* Hand-drawn oval — editorial pen-marking */}
              <svg
                aria-hidden="true"
                viewBox="0 0 220 80"
                preserveAspectRatio="none"
                className="absolute inset-[-0.25em_-0.4em_-0.2em_-0.4em] z-0 h-[calc(100%+0.45em)] w-[calc(100%+0.8em)] overflow-visible text-amber-500"
              >
                <path
                  d="M 12 42 C 22 10, 200 8, 212 38 C 215 70, 25 74, 10 44"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            why
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
              className="rounded-lg bg-gray-900 dark:bg-white px-6 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm hover:shadow-[0_0_0_4px_rgba(245,158,11,0.18)]"
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
      <section
        id="how-it-works"
        className="scroll-mt-14 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/30 px-6 py-24"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
            How it works
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
      <section className="border-t border-gray-100 dark:border-gray-800/60 px-6 py-24">
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
                  'Get reminded to review past decisions. Mark them as validated, reversed, or ongoing.',
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
                title: 'Connects to your tools',
                description:
                  'Pull decisions from GitHub PRs, Slack threads, and more. Log where you already work.',
                icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950 px-5 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-[0_10px_30px_-12px_rgba(245,158,11,0.22)]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900 transition-colors group-hover:bg-amber-500/10">
                  <svg
                    className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-colors group-hover:text-amber-600 dark:group-hover:text-amber-400"
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

      {/* Integrations */}
      <section
        id="integrations"
        className="scroll-mt-14 border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/30 px-6 py-24"
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
            Works where you already work
          </h2>
          <div className="mt-16 grid grid-cols-3 sm:grid-cols-6 gap-x-6 gap-y-10 sm:gap-10 md:gap-14 max-w-md sm:max-w-none mx-auto">
            {[
              {
                name: 'GitHub',
                hoverColor: 'group-hover:text-[#181717] dark:group-hover:text-white',
                path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
              },
              {
                name: 'GitLab',
                hoverColor: 'group-hover:text-[#FC6D26]',
                path: 'm23.6004 9.5927-.0337-.0862L20.3.9814a.851.851 0 0 0-.3362-.405.8748.8748 0 0 0-.9997.0539.8748.8748 0 0 0-.29.4399l-2.2055 6.748H7.5375l-2.2057-6.748a.8573.8573 0 0 0-.29-.4412.8748.8748 0 0 0-.9997-.0537.8585.8585 0 0 0-.3362.4049L.4332 9.5015l-.0325.0862a6.0657 6.0657 0 0 0 2.0119 7.0105l.0113.0087.03.0213 4.976 3.7264 2.462 1.8633 1.4995 1.1321a1.0085 1.0085 0 0 0 1.2197 0l1.4995-1.1321 2.4619-1.8633 5.006-3.7489.0125-.01a6.0682 6.0682 0 0 0 2.0094-7.003z',
              },
              {
                name: 'Slack',
                hoverColor: 'group-hover:text-[#4A154B] dark:group-hover:text-[#E01E5A]',
                path: 'M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.527 2.527 0 0 1 2.52-2.52h6.315A2.528 2.528 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z',
              },
              {
                name: 'Notion',
                hoverColor: 'group-hover:text-[#000000] dark:group-hover:text-white',
                path: 'M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z',
              },
              {
                name: 'Linear',
                hoverColor: 'group-hover:text-[#5E6AD2]',
                path: 'M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 0 1 .322-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z',
              },
              {
                name: 'Confluence',
                hoverColor: 'group-hover:text-[#1868DB] dark:group-hover:text-[#1868DB]',
                path: 'M.87 18.257c-.248.382-.53.875-.763 1.245a.764.764 0 0 0 .255 1.04l4.965 3.054a.764.764 0 0 0 1.058-.26c.199-.332.454-.763.733-1.221 1.967-3.247 3.945-2.853 7.508-1.146l4.957 2.337a.764.764 0 0 0 1.028-.382l2.364-5.346a.764.764 0 0 0-.382-1 599.851 599.851 0 0 1-4.965-2.361C10.911 10.97 5.224 11.185.87 18.257zM23.131 5.743c.249-.405.531-.875.764-1.25a.764.764 0 0 0-.256-1.034L18.675.404a.764.764 0 0 0-1.058.26c-.195.335-.451.763-.734 1.225-1.966 3.246-3.945 2.85-7.508 1.146L4.437.694a.764.764 0 0 0-1.027.382L1.046 6.422a.764.764 0 0 0 .382 1c1.039.49 3.105 1.467 4.965 2.361 6.698 3.246 12.392 3.029 16.738-4.04z',
              },
            ].map((tool) => (
              <div key={tool.name} className="group flex flex-col items-center gap-2 sm:gap-3">
                <div
                  className={`text-gray-400 dark:text-gray-500 transition-colors ${tool.hoverColor}`}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-9 w-9">
                    <path d={tool.path} />
                  </svg>
                </div>
                <span className="text-sm text-gray-400 dark:text-gray-500 transition-colors group-hover:text-gray-600 dark:group-hover:text-gray-300">
                  {tool.name}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Import your decision history from PRs, threads, and docs.
          </p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Capture the past, not just the future.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="scroll-mt-14 border-t border-gray-100 dark:border-gray-800/60 px-6 py-24"
      >
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
            Pricing
          </h2>
          <p className="mt-4 text-center text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Start where you are. Scale when you&apos;re ready.
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
            <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Free</p>
              <p className="mt-2 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  $0
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
              </p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Genuinely useful, not crippled. No credit card required.
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

            {/* Solo */}
            <div className="rounded-xl border-2 border-amber-500/60 bg-white dark:bg-gray-950 px-6 py-6 relative transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/80 hover:shadow-[0_20px_50px_-20px_rgba(245,158,11,0.35)]">
              <div className="absolute -top-3 left-6">
                <span className="inline-flex items-center rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-white shadow-sm">
                  Popular
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Solo</p>
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
                      className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
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
                className="mt-8 block w-full rounded-lg bg-gray-900 dark:bg-white px-4 py-2.5 text-center text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm hover:shadow-[0_0_0_4px_rgba(245,158,11,0.18)]"
              >
                Get started
              </Link>
            </div>

            {/* Team */}
            <div className="rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Team</p>
              <p className="mt-2 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                  ${annual ? '20' : '29'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                {annual && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">$240/yr</span>
                )}
              </p>
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                For teams up to 5 people. Shared decision history.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Everything in Solo',
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
          <a
            href="mailto:hello@archlog.com"
            className="mt-10 block cursor-pointer text-center text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            Need more than 5 seats? Contact us &rarr;
          </a>
        </div>
      </section>

      {/* CTA — notebook bookend to the hero */}
      <section className="relative overflow-hidden border-t border-gray-100 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/30 px-6 py-24">
        {/* Horizontal ruled lines */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_39px,rgba(0,0,0,0.04)_39px,rgba(0,0,0,0.04)_40px)] dark:bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_39px,rgba(255,255,255,0.04)_39px,rgba(255,255,255,0.04)_40px)]"
        />
        {/* Right margin rule — bookend variation of the hero's left rule */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-8 hidden w-0.5 bg-amber-500/50 md:block lg:right-16"
        />

        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
            Stop{' '}
            <span className="relative inline-block">
              <span className="relative z-10">forgetting</span>
              <svg
                aria-hidden="true"
                viewBox="0 0 220 80"
                preserveAspectRatio="none"
                className="absolute inset-[-0.25em_-0.4em_-0.2em_-0.4em] z-0 h-[calc(100%+0.45em)] w-[calc(100%+0.8em)] overflow-visible text-amber-500"
              >
                <path
                  d="M 12 42 C 22 10, 200 8, 212 38 C 215 70, 25 74, 10 44"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>{' '}
            why you made that call
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Two minutes to log a decision now saves hours of re-debating later.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-gray-900 dark:bg-white px-6 py-2.5 text-sm font-medium text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm hover:shadow-[0_0_0_4px_rgba(245,158,11,0.18)]"
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
