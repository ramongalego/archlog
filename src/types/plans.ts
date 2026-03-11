import type { SubscriptionTier } from './decisions';

export interface PlanLimits {
  maxProjects: number;
  maxDecisions: number;
  aiQuery: boolean;
  aiDrafting: boolean;
  crossProjectSearch: boolean;
  weeklyDigest: boolean;
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  free: {
    maxProjects: 1,
    maxDecisions: 50,
    aiQuery: false,
    aiDrafting: true,
    crossProjectSearch: false,
    weeklyDigest: true,
  },
  pro: {
    maxProjects: Infinity,
    maxDecisions: Infinity,
    aiQuery: true,
    aiDrafting: true,
    crossProjectSearch: true,
    weeklyDigest: true,
  },
  team: {
    maxProjects: Infinity,
    maxDecisions: Infinity,
    aiQuery: true,
    aiDrafting: true,
    crossProjectSearch: true,
    weeklyDigest: true,
  },
};
