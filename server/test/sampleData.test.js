import { describe, expect, it } from 'vitest';
import { generateSampleEntries } from '../src/lib/sampleData.js';
import { entrySchema } from '../src/lib/validation.js';
import { averages, correlations, routineComparisons } from '../src/lib/stats.js';

const end = new Date().toISOString().slice(0, 10);

describe('demo data', () => {
  const entries = generateSampleEntries(end);

  it('produces 45 unique consecutive days that all pass the real validation schema', () => {
    expect(entries).toHaveLength(45);
    expect(new Set(entries.map((e) => e.date)).size).toBe(45);
    for (const e of entries) expect(() => entrySchema.parse(e)).not.toThrow();
  });

  it('is deterministic', () => {
    expect(generateSampleEntries(end)).toEqual(entries);
  });

  it('is rich enough to show patterns in the UI', () => {
    const parsed = entries.map((e) => entrySchema.parse(e));
    expect(averages(parsed).mood).not.toBeNull();
    expect(correlations(parsed).length).toBeGreaterThanOrEqual(3);
    expect(routineComparisons(parsed).length).toBeGreaterThanOrEqual(2);
  });
});
