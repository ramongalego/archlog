import type { SubscriptionTier } from '@/types/decisions';
import { PLAN_LIMITS, type PlanLimits } from '@/types/plans';

export function getPlanLimits(tier: SubscriptionTier): PlanLimits {
  return PLAN_LIMITS[tier];
}

export function canCreateDecision(tier: SubscriptionTier, currentCount: number): boolean {
  const limits = getPlanLimits(tier);
  return currentCount < limits.maxDecisions;
}

export function canCreateProject(tier: SubscriptionTier, currentCount: number): boolean {
  const limits = getPlanLimits(tier);
  return currentCount < limits.maxProjects;
}

export function canUseAiQuery(tier: SubscriptionTier): boolean {
  return getPlanLimits(tier).aiQuery;
}

export function canSearchCrossProject(tier: SubscriptionTier): boolean {
  return getPlanLimits(tier).crossProjectSearch;
}

export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier !== 'free';
}
