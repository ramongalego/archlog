import { cn, formatRelativeDate, formatDate, daysFromNow, daysUntil } from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('px-2', false && 'hidden')).toBe('px-2');
  });

  it('resolves tailwind conflicts by keeping the last one', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles undefined and null inputs', () => {
    expect(cn('px-2', undefined, null, 'py-1')).toBe('px-2 py-1');
  });
});

describe('formatRelativeDate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-09T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns "Today" for today', () => {
    expect(formatRelativeDate('2026-03-09T10:00:00Z')).toBe('Today');
  });

  it('returns "Yesterday" for one day ago', () => {
    expect(formatRelativeDate('2026-03-08T10:00:00Z')).toBe('Yesterday');
  });

  it('returns days ago for 2-6 days', () => {
    expect(formatRelativeDate('2026-03-06T10:00:00Z')).toBe('3 days ago');
  });

  it('returns weeks ago for 7-29 days', () => {
    expect(formatRelativeDate('2026-02-23T10:00:00Z')).toBe('2 weeks ago');
  });

  it('returns months ago for 30-364 days', () => {
    expect(formatRelativeDate('2025-12-09T10:00:00Z')).toBe('3 months ago');
  });

  it('returns years ago for 365+ days', () => {
    expect(formatRelativeDate('2024-03-09T10:00:00Z')).toBe('2 years ago');
  });
});

describe('formatDate', () => {
  it('formats date in US locale', () => {
    const result = formatDate('2026-03-09T12:00:00Z');
    expect(result).toContain('Mar');
    expect(result).toContain('2026');
  });
});

describe('daysFromNow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-09T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns a date N days in the future', () => {
    const result = daysFromNow(90);
    const date = new Date(result);
    expect(date.getMonth()).toBe(5); // June (0-indexed)
    expect(date.getDate()).toBe(7);
  });

  it('returns today for 0 days', () => {
    const result = daysFromNow(0);
    const date = new Date(result);
    expect(date.getDate()).toBe(9);
    expect(date.getMonth()).toBe(2); // March
  });
});

describe('daysUntil', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-09T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns positive days for future dates', () => {
    expect(daysUntil('2026-03-19T12:00:00Z')).toBe(10);
  });

  it('returns negative days for past dates', () => {
    expect(daysUntil('2026-02-27T12:00:00Z')).toBe(-10);
  });

  it('returns 0 for today', () => {
    expect(daysUntil('2026-03-09T12:00:00Z')).toBe(0);
  });
});
