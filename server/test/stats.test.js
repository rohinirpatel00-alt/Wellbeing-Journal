import { describe, expect, it } from 'vitest';
import { addDays, averages, correlations, pearson, routineComparisons } from '../src/lib/stats.js';

const e = (date, over = {}) => ({
  date, sleepHours: 7, sleepQuality: 3, mood: 3, energy: 3, stress: 3, routines: [], ...over,
});

describe('stats', () => {
  it('averages entries', () => {
    expect(averages([e('2026-01-01', { mood: 2 }), e('2026-01-02', { mood: 4 })]).mood).toBe(3);
  });

  it('returns null averages for no data', () => {
    expect(averages([]).mood).toBeNull();
  });

  it('pearson needs enough data and variation', () => {
    expect(pearson([1, 2, 3], [1, 2, 3])).toBeNull();
    expect(pearson([1, 1, 1, 1, 1], [1, 2, 3, 4, 5])).toBeNull();
    expect(pearson([1, 2, 3, 4, 5], [2, 4, 6, 8, 10])).toBeCloseTo(1);
    expect(pearson([1, 2, 3, 4, 5], [5, 4, 3, 2, 1])).toBeCloseTo(-1);
  });

  it('describes correlations without causal or diagnostic language', () => {
    const entries = [4, 5, 6, 7, 8, 9].map((h, i) =>
      e(`2026-01-0${i + 1}`, { sleepHours: h, mood: Math.min(5, Math.max(1, h - 4)) }));
    const out = correlations(entries);
    const text = out.map((c) => c.summary).join(' ').toLowerCase();
    expect(out.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/cause|diagnos|depress|anxi|disorder/);
  });

  it('compares routines only with enough days in both groups', () => {
    const entries = [
      ...[1, 2, 3, 4].map((d) => e(`2026-01-0${d}`, { routines: ['Walk'], mood: 4 })),
      ...[5, 6, 7].map((d) => e(`2026-01-0${d}`, { mood: 3 })),
      e('2026-01-08', { routines: ['Rare'], mood: 5 }),
    ];
    const out = routineComparisons(entries);
    expect(out.map((r) => r.routine)).toEqual(['Walk']);
    expect(out[0].difference.mood).toBeGreaterThan(0);
  });

  it('adds days across month boundaries', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});
