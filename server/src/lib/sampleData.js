import { addDays } from './stats.js';

// Small deterministic PRNG so the demo data is the same every time.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
const NOTES = [
  'Busy day at work, managed a proper lunch break.',
  'Caught up with a friend in the evening.',
  'Slow start but the afternoon went well.',
  'Late night, trying to wind down earlier tomorrow.',
  'Felt calm after the walk.',
  '',
  '',
  '',
];

/** Builds `days` consecutive entries ending on `endDate` (YYYY-MM-DD). */
export function generateSampleEntries(endDate, days = 45, seed = 2026) {
  const rand = mulberry32(seed);
  const entries = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(endDate, -i);
    const walked = rand() < 0.45;
    const meditated = rand() < 0.35;
    const lateCaffeine = rand() < 0.25;

    const sleepHours = Math.round((6.8 + (rand() - 0.5) * 3 - (lateCaffeine ? 0.5 : 0)) * 4) / 4;
    const sleepQuality = clamp(Math.round(2.4 + (sleepHours - 6) * 0.6 + (rand() - 0.5) * 1.5), 1, 5);
    const mood = clamp(Math.round(2.6 + (sleepHours - 6) * 0.35 + (walked ? 0.8 : 0) + (rand() - 0.5) * 1.4), 1, 5);
    const energy = clamp(Math.round(2.4 + (sleepQuality - 3) * 0.5 + (walked ? 0.5 : 0) + (rand() - 0.5) * 1.3), 1, 5);
    const stress = clamp(Math.round(3.2 - (meditated ? 0.9 : 0) - (sleepHours - 6) * 0.2 + (rand() - 0.5) * 1.4), 1, 5);

    const routines = [];
    if (walked) routines.push('Walk outdoors');
    if (meditated) routines.push('Meditation');
    if (lateCaffeine) routines.push('Late caffeine');

    entries.push({
      date,
      sleepHours: clamp(sleepHours, 3, 10),
      sleepQuality,
      mood,
      energy,
      stress,
      routines,
      note: NOTES[Math.floor(rand() * NOTES.length)],
    });
  }
  return entries;
}
