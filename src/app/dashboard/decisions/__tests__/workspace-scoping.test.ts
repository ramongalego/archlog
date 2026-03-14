/**
 * Tests that listDecisions scopes queries by workspace:
 * - Personal workspace → only decisions in personal projects
 * - Team workspace → only decisions in that team's projects
 * - No cross-workspace leaking
 */

import { listDecisions } from '../actions';

// --- Test data ---

const USER_ID = 'user-111';
const TEAM_ID = 'team-222';
const PERSONAL_PROJECT_ID = 'proj-personal';
const TEAM_PROJECT_ID = 'proj-team';

const personalDecision = {
  id: 'dec-personal',
  title: 'Personal decision',
  project_id: PERSONAL_PROJECT_ID,
  user_id: USER_ID,
  is_archived: false,
  created_at: '2026-03-10T00:00:00Z',
};

const teamDecision = {
  id: 'dec-team',
  title: 'Team decision',
  project_id: TEAM_PROJECT_ID,
  user_id: USER_ID,
  is_archived: false,
  created_at: '2026-03-10T00:00:00Z',
};

const allDecisions = [personalDecision, teamDecision];

// --- Mocks ---

let mockWorkspace: { type: 'personal' } | { type: 'team'; teamId: string } = { type: 'personal' };

jest.mock('@/lib/active-workspace', () => ({
  getActiveWorkspace: jest.fn(() => Promise.resolve(mockWorkspace)),
}));

/**
 * Chainable mock that records filter calls and resolves with
 * data filtered by the recorded project_id constraints.
 */
function createMockQueryBuilder(table: string) {
  const filters: { method: string; args: unknown[] }[] = [];

  const builder: Record<string, unknown> = {};

  const chainMethods = [
    'select', 'eq', 'in', 'is', 'or', 'gte', 'lte',
    'order', 'range', 'limit', 'single', 'maybeSingle',
  ];

  for (const method of chainMethods) {
    builder[method] = jest.fn((...args: unknown[]) => {
      filters.push({ method, args });
      return builder;
    });
  }

  // When the builder is awaited (thenable), resolve with filtered data
  builder.then = (resolve: (value: unknown) => void) => {
    if (table === 'projects') {
      // Return project IDs based on filters
      const eqFilters = filters.filter((f) => f.method === 'eq');
      const isFilters = filters.filter((f) => f.method === 'is');

      const hasTeamId = eqFilters.some(
        (f) => f.args[0] === 'team_id' && f.args[1] === TEAM_ID
      );
      const hasUserId = eqFilters.some(
        (f) => f.args[0] === 'user_id' && f.args[1] === USER_ID
      );
      const hasTeamNull = isFilters.some(
        (f) => f.args[0] === 'team_id' && f.args[1] === null
      );

      if (hasTeamId) {
        resolve({ data: [{ id: TEAM_PROJECT_ID }], error: null });
      } else if (hasUserId && hasTeamNull) {
        resolve({ data: [{ id: PERSONAL_PROJECT_ID }], error: null });
      } else {
        resolve({ data: [], error: null });
      }
    } else if (table === 'decisions') {
      // Filter decisions based on `.in('project_id', [...])` call
      const inFilter = filters.find(
        (f) => f.method === 'in' && f.args[0] === 'project_id'
      );
      const allowedProjectIds = inFilter ? (inFilter.args[1] as string[]) : null;

      let results = allDecisions;
      if (allowedProjectIds) {
        results = results.filter((d) => allowedProjectIds.includes(d.project_id));
      }

      resolve({ data: results, count: results.length, error: null });
    } else {
      resolve({ data: null, error: null });
    }
    return builder;
  };

  return builder;
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: {
        getUser: jest.fn(() =>
          Promise.resolve({ data: { user: { id: USER_ID } } })
        ),
      },
      from: jest.fn((table: string) => createMockQueryBuilder(table)),
    })
  ),
}));

// --- Tests ---

describe('listDecisions workspace scoping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('personal workspace returns only personal project decisions', async () => {
    mockWorkspace = { type: 'personal' };

    const result = await listDecisions({ page: 1, pageSize: 20 });

    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0]).toMatchObject({
      id: 'dec-personal',
      project_id: PERSONAL_PROJECT_ID,
    });
  });

  it('team workspace returns only team project decisions', async () => {
    mockWorkspace = { type: 'team', teamId: TEAM_ID };

    const result = await listDecisions({ page: 1, pageSize: 20 });

    expect(result.decisions).toHaveLength(1);
    expect(result.decisions[0]).toMatchObject({
      id: 'dec-team',
      project_id: TEAM_PROJECT_ID,
    });
  });

  it('personal workspace never includes team decisions', async () => {
    mockWorkspace = { type: 'personal' };

    const result = await listDecisions({ page: 1, pageSize: 20 });

    const teamDecisions = result.decisions.filter(
      (d: { project_id: string }) => d.project_id === TEAM_PROJECT_ID
    );
    expect(teamDecisions).toHaveLength(0);
  });

  it('team workspace never includes personal decisions', async () => {
    mockWorkspace = { type: 'team', teamId: TEAM_ID };

    const result = await listDecisions({ page: 1, pageSize: 20 });

    const personal = result.decisions.filter(
      (d: { project_id: string }) => d.project_id === PERSONAL_PROJECT_ID
    );
    expect(personal).toHaveLength(0);
  });

  it('returns empty when team has no projects', async () => {
    mockWorkspace = { type: 'team', teamId: 'nonexistent-team' };

    const result = await listDecisions({ page: 1, pageSize: 20 });

    expect(result.decisions).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
