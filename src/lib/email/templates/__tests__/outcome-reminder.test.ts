import { buildOutcomeReminderHtml, buildOutcomeReminderText } from '../outcome-reminder';

const baseParams = {
  displayName: 'Ramon',
  decisions: [
    { id: 'dec-1', title: 'Move to Supabase', outcome_due_date: '2026-03-01T00:00:00Z' },
    { id: 'dec-2', title: 'Drop feature X', outcome_due_date: '2026-03-05T00:00:00Z' },
  ],
  baseUrl: 'https://archlog.app',
};

describe('buildOutcomeReminderHtml', () => {
  it('includes personalized greeting', () => {
    const html = buildOutcomeReminderHtml(baseParams);
    expect(html).toContain('Hi Ramon');
  });

  it('falls back to generic greeting when no name', () => {
    const html = buildOutcomeReminderHtml({ ...baseParams, displayName: null });
    expect(html).toContain('Hi there');
  });

  it('uses correct plural for multiple decisions', () => {
    const html = buildOutcomeReminderHtml(baseParams);
    expect(html).toContain('2 decisions are');
  });

  it('uses correct singular for one decision', () => {
    const html = buildOutcomeReminderHtml({
      ...baseParams,
      decisions: [baseParams.decisions[0]],
    });
    expect(html).toContain('1 decision is');
  });

  it('includes links to each decision', () => {
    const html = buildOutcomeReminderHtml(baseParams);
    expect(html).toContain('https://archlog.app/dashboard/decisions/dec-1');
    expect(html).toContain('https://archlog.app/dashboard/decisions/dec-2');
  });

  it('includes decision titles', () => {
    const html = buildOutcomeReminderHtml(baseParams);
    expect(html).toContain('Move to Supabase');
    expect(html).toContain('Drop feature X');
  });
});

describe('buildOutcomeReminderText', () => {
  it('includes personalized greeting', () => {
    const text = buildOutcomeReminderText(baseParams);
    expect(text).toContain('Hi Ramon');
  });

  it('lists decisions with links', () => {
    const text = buildOutcomeReminderText(baseParams);
    expect(text).toContain('- Move to Supabase');
    expect(text).toContain('https://archlog.app/dashboard/decisions/dec-1');
  });

  it('includes the outcome prompt question', () => {
    const text = buildOutcomeReminderText(baseParams);
    expect(text).toContain('Was the call right');
  });
});
