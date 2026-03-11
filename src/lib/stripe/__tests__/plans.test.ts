import {
  getPlanLimits,
  canCreateDecision,
  canCreateProject,
  canUseAiQuery,
  canSearchCrossProject,
  isPaidTier,
} from '../plans';

describe('getPlanLimits', () => {
  it('returns free plan limits', () => {
    const limits = getPlanLimits('free');
    expect(limits.maxProjects).toBe(1);
    expect(limits.maxDecisions).toBe(50);
    expect(limits.aiQuery).toBe(false);
    expect(limits.aiDrafting).toBe(true);
    expect(limits.crossProjectSearch).toBe(false);
    expect(limits.weeklyDigest).toBe(true);
  });

  it('returns pro plan limits', () => {
    const limits = getPlanLimits('pro');
    expect(limits.maxProjects).toBe(Infinity);
    expect(limits.maxDecisions).toBe(Infinity);
    expect(limits.aiQuery).toBe(true);
    expect(limits.aiDrafting).toBe(true);
    expect(limits.crossProjectSearch).toBe(true);
    expect(limits.weeklyDigest).toBe(true);
  });

  it('returns team plan limits', () => {
    const limits = getPlanLimits('team');
    expect(limits.maxProjects).toBe(Infinity);
    expect(limits.maxDecisions).toBe(Infinity);
    expect(limits.aiQuery).toBe(true);
    expect(limits.aiDrafting).toBe(true);
    expect(limits.crossProjectSearch).toBe(true);
    expect(limits.weeklyDigest).toBe(true);
  });
});

describe('canCreateDecision', () => {
  it('allows free users under the limit', () => {
    expect(canCreateDecision('free', 0)).toBe(true);
    expect(canCreateDecision('free', 49)).toBe(true);
  });

  it('blocks free users at the limit', () => {
    expect(canCreateDecision('free', 50)).toBe(false);
    expect(canCreateDecision('free', 100)).toBe(false);
  });

  it('always allows pro users', () => {
    expect(canCreateDecision('pro', 0)).toBe(true);
    expect(canCreateDecision('pro', 10000)).toBe(true);
  });

  it('always allows team users', () => {
    expect(canCreateDecision('team', 0)).toBe(true);
    expect(canCreateDecision('team', 10000)).toBe(true);
  });
});

describe('canCreateProject', () => {
  it('allows free users with 0 projects', () => {
    expect(canCreateProject('free', 0)).toBe(true);
  });

  it('blocks free users at 1 project', () => {
    expect(canCreateProject('free', 1)).toBe(false);
  });

  it('always allows pro users', () => {
    expect(canCreateProject('pro', 100)).toBe(true);
  });

  it('always allows team users', () => {
    expect(canCreateProject('team', 100)).toBe(true);
  });
});

describe('canUseAiQuery', () => {
  it('blocks free users', () => {
    expect(canUseAiQuery('free')).toBe(false);
  });

  it('allows pro users', () => {
    expect(canUseAiQuery('pro')).toBe(true);
  });

  it('allows team users', () => {
    expect(canUseAiQuery('team')).toBe(true);
  });
});

describe('canSearchCrossProject', () => {
  it('blocks free users', () => {
    expect(canSearchCrossProject('free')).toBe(false);
  });

  it('allows pro users', () => {
    expect(canSearchCrossProject('pro')).toBe(true);
  });

  it('allows team users', () => {
    expect(canSearchCrossProject('team')).toBe(true);
  });
});

describe('isPaidTier', () => {
  it('returns false for free', () => {
    expect(isPaidTier('free')).toBe(false);
  });

  it('returns true for pro', () => {
    expect(isPaidTier('pro')).toBe(true);
  });

  it('returns true for team', () => {
    expect(isPaidTier('team')).toBe(true);
  });
});
