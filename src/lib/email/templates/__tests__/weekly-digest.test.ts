import { buildWeeklyDigestHtml, buildWeeklyDigestText } from '../weekly-digest';

const baseParams = {
  displayName: 'Ramon',
  recentDecisions: [
    {
      id: '1',
      title: 'Switch to Postgres',
      category: 'technical',
      created_at: '2026-03-05T10:00:00Z',
    },
    {
      id: '2',
      title: 'Raise price to $29',
      category: 'pricing',
      created_at: '2026-03-06T10:00:00Z',
    },
  ],
  pendingReviews: [
    { id: '3', title: 'Firebase migration', outcome_due_date: '2026-03-09T00:00:00Z' },
  ],
  randomDecision: {
    id: '4',
    title: 'Chose Tailwind over styled-components',
    outcome_status: 'vindicated',
  },
  unsubscribeUrl: 'https://archlog.app/unsubscribe?token=abc',
};

describe('buildWeeklyDigestHtml', () => {
  it('includes personalized greeting', () => {
    const html = buildWeeklyDigestHtml(baseParams);
    expect(html).toContain('Hi Ramon');
  });

  it('falls back to generic greeting when no name', () => {
    const html = buildWeeklyDigestHtml({ ...baseParams, displayName: null });
    expect(html).toContain('Hi there');
    expect(html).not.toContain('Hi null');
  });

  it('lists recent decisions', () => {
    const html = buildWeeklyDigestHtml(baseParams);
    expect(html).toContain('Switch to Postgres');
    expect(html).toContain('Raise price to $29');
  });

  it('shows pending reviews', () => {
    const html = buildWeeklyDigestHtml(baseParams);
    expect(html).toContain('Firebase migration');
  });

  it('shows random archived decision', () => {
    const html = buildWeeklyDigestHtml(baseParams);
    expect(html).toContain('Chose Tailwind over styled-components');
    expect(html).toContain('vindicated');
  });

  it('includes unsubscribe link', () => {
    const html = buildWeeklyDigestHtml(baseParams);
    expect(html).toContain('https://archlog.app/unsubscribe?token=abc');
  });

  it('shows fallback when no recent decisions', () => {
    const html = buildWeeklyDigestHtml({ ...baseParams, recentDecisions: [] });
    expect(html).toContain('No new decisions this week');
  });

  it('omits review section when no pending reviews', () => {
    const html = buildWeeklyDigestHtml({ ...baseParams, pendingReviews: [] });
    expect(html).not.toContain('Outcomes due for review');
  });

  it('omits archive section when no random decision', () => {
    const html = buildWeeklyDigestHtml({ ...baseParams, randomDecision: null });
    expect(html).not.toContain('From the archive');
  });
});

describe('buildWeeklyDigestText', () => {
  it('includes personalized greeting', () => {
    const text = buildWeeklyDigestText(baseParams);
    expect(text).toContain('Hi Ramon');
  });

  it('lists recent decisions', () => {
    const text = buildWeeklyDigestText(baseParams);
    expect(text).toContain('- Switch to Postgres');
    expect(text).toContain('- Raise price to $29');
  });

  it('lists pending reviews', () => {
    const text = buildWeeklyDigestText(baseParams);
    expect(text).toContain('- Firebase migration');
  });

  it('shows random decision from archive', () => {
    const text = buildWeeklyDigestText(baseParams);
    expect(text).toContain('Chose Tailwind over styled-components');
  });

  it('shows no-decisions message when empty', () => {
    const text = buildWeeklyDigestText({ ...baseParams, recentDecisions: [] });
    expect(text).toContain('No new decisions this week');
  });
});
