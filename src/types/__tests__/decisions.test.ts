import { getOutcomeDisplay } from '../decisions';

describe('getOutcomeDisplay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-10T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "Overdue" for pending decisions past their due date', () => {
    const result = getOutcomeDisplay('pending', '2026-03-09T00:00:00Z');
    expect(result.label).toBe('Overdue');
    expect(result.color).toContain('amber');
  });

  it('returns "Overdue" when due date is exactly now', () => {
    const result = getOutcomeDisplay('pending', '2026-03-10T12:00:00Z');
    expect(result.label).toBe('Overdue');
  });

  it('returns "Pending" for pending decisions not yet due', () => {
    const result = getOutcomeDisplay('pending', '2026-06-10T00:00:00Z');
    expect(result.label).toBe('Pending');
    expect(result.color).toContain('gray');
  });

  it('returns "Validated" regardless of due date', () => {
    const result = getOutcomeDisplay('vindicated', '2026-01-01T00:00:00Z');
    expect(result.label).toBe('Validated');
    expect(result.color).toContain('emerald');
  });

  it('returns "Reversed" regardless of due date', () => {
    const result = getOutcomeDisplay('reversed', '2026-01-01T00:00:00Z');
    expect(result.label).toBe('Reversed');
    expect(result.color).toContain('red');
  });

  it('returns "Ongoing" when not yet due', () => {
    const result = getOutcomeDisplay('still_playing_out', '2026-06-10T00:00:00Z');
    expect(result.label).toBe('Ongoing');
    expect(result.color).toContain('blue');
  });

  it('returns "Overdue" for still_playing_out past due date', () => {
    const result = getOutcomeDisplay('still_playing_out', '2026-01-01T00:00:00Z');
    expect(result.label).toBe('Overdue');
    expect(result.color).toContain('amber');
  });

  it('does not show overdue for resolved statuses even if past due', () => {
    const pastDue = '2025-01-01T00:00:00Z';
    expect(getOutcomeDisplay('vindicated', pastDue).label).toBe('Validated');
    expect(getOutcomeDisplay('reversed', pastDue).label).toBe('Reversed');
  });
});
