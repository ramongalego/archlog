'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';

interface UpgradeModalProps {
  open: boolean;
  currentTier: 'free' | 'pro' | 'team';
  onUpgrade: (plan: 'pro' | 'team') => void;
  onClose: () => void;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

export function UpgradeModal({ open, currentTier, onUpgrade, onClose }: UpgradeModalProps) {
  const [annual, setAnnual] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const plans = [
    {
      id: 'free' as const,
      name: 'Free',
      monthly: 0,
      annual: 0,
      annualTotal: null,
      description: 'Genuinely useful, not crippled. No credit card required.',
      features: ['1 project', '50 decisions', 'AI-assisted drafting', 'Weekly digest emails'],
      featured: false,
    },
    {
      id: 'pro' as const,
      name: 'Solo',
      monthly: 12,
      annual: 8,
      annualTotal: 99,
      description: 'No-brainer for anyone making real decisions.',
      features: [
        'Unlimited projects',
        'Unlimited decisions',
        'AI search across decisions',
        'Cross-project search',
      ],
      featured: true,
    },
    {
      id: 'team' as const,
      name: 'Team',
      monthly: 29,
      annual: 20,
      annualTotal: 240,
      description: 'For teams up to 5 people. Shared decision history.',
      features: [
        'Everything in Solo',
        'Up to 5 users',
        'Shared projects',
        'Collaborative decision logging',
      ],
      featured: false,
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-xl border border-gray-200/80 dark:border-gray-800 bg-white dark:bg-gray-950 px-6 py-6 shadow-lg overflow-y-auto max-h-[90vh]">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Choose your plan
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Start where you are. Scale when you&apos;re ready.
          </p>

          {/* Billing toggle */}
          <div className="mt-4 flex items-center justify-center">
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-all ${!annual ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`cursor-pointer rounded-md px-4 py-1.5 text-sm font-medium transition-all ${annual ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                Yearly
                <span className="ml-1.5 rounded-full bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 text-[11px] font-medium text-green-600 dark:text-green-400">
                  -31%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentTier;
            const price = annual ? plan.annual : plan.monthly;

            return (
              <div
                key={plan.id}
                className={`rounded-xl px-5 py-5 ${
                  plan.featured
                    ? 'border-2 border-gray-900 dark:border-white relative'
                    : 'border border-gray-200/80 dark:border-gray-800'
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 left-5">
                    <span className="inline-flex items-center rounded-full bg-gray-900 dark:bg-white px-3 py-0.5 text-xs font-semibold text-white dark:text-gray-900">
                      Popular
                    </span>
                  </div>
                )}

                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {plan.name}
                </p>
                <p className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                    ${price}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/month</span>
                  {annual && plan.annualTotal && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ${plan.annualTotal}/yr
                    </span>
                  )}
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{plan.description}</p>

                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <CheckIcon
                        className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${
                          plan.id === 'free'
                            ? 'text-gray-400 dark:text-gray-500'
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="mt-5">
                  {isCurrent ? (
                    <Button variant="secondary" size="sm" className="w-full" disabled>
                      Current plan
                    </Button>
                  ) : plan.id === 'free' ? (
                    <div className="h-[38px]" />
                  ) : (
                    <Button
                      size="sm"
                      variant={plan.featured ? 'primary' : 'secondary'}
                      className="w-full"
                      onClick={() => onUpgrade(plan.id)}
                    >
                      Upgrade
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}
