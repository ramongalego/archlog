import type { Database } from './database';

// Row types from database
export type User = Database['public']['Tables']['users']['Row'];
export type Project = Database['public']['Tables']['projects']['Row'];
export type Decision = Database['public']['Tables']['decisions']['Row'];
export type DecisionEdit = Database['public']['Tables']['decision_edits']['Row'];
export type Subscription = Database['public']['Tables']['subscriptions']['Row'];
export type GitHubConnection = Database['public']['Tables']['github_connections']['Row'];
export type GitLabConnection = Database['public']['Tables']['gitlab_connections']['Row'];
export type SuggestedDecision = Database['public']['Tables']['suggested_decisions']['Row'];
export type SuggestionStatus = Database['public']['Enums']['suggestion_status'];

// Enum types
export type ConfidenceLevel = Database['public']['Enums']['confidence_level'];
export type DecisionCategory = Database['public']['Enums']['decision_category'];
export type OutcomeStatus = Database['public']['Enums']['outcome_status'];
export type SubscriptionTier = Database['public']['Enums']['subscription_tier'];

// Insert types
export type DecisionInsert = Database['public']['Tables']['decisions']['Insert'];
export type DecisionUpdate = Database['public']['Tables']['decisions']['Update'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];

// Display labels
export const CONFIDENCE_LABELS: Record<ConfidenceLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  product: 'Product',
  pricing: 'Pricing',
  technical: 'Technical',
  hiring: 'Hiring',
  marketing: 'Marketing',
  other: 'Other',
};

export const OUTCOME_LABELS: Record<OutcomeStatus, string> = {
  pending: 'Pending',
  vindicated: 'Validated',
  reversed: 'Reversed',
  still_playing_out: 'Ongoing',
};

export const OUTCOME_COLORS: Record<OutcomeStatus, string> = {
  pending: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300',
  vindicated: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  reversed: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  still_playing_out: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
};

export const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  low: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  medium: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  high: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
};

// Computed display helpers for outcome status
export function getOutcomeDisplay(
  outcomeStatus: OutcomeStatus,
  outcomeDueDate: string
): { label: string; color: string } {
  if (
    (outcomeStatus === 'pending' || outcomeStatus === 'still_playing_out') &&
    new Date(outcomeDueDate) <= new Date()
  ) {
    return {
      label: 'Overdue',
      color: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    };
  }
  return {
    label: OUTCOME_LABELS[outcomeStatus],
    color: OUTCOME_COLORS[outcomeStatus],
  };
}

// AI draft suggestion shape
export interface DraftSuggestion {
  title: string;
  why: string;
  context: string;
  confidence: ConfidenceLevel;
  category: DecisionCategory;
}
