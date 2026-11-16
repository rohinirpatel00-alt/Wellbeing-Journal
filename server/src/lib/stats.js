/**
 * Descriptive statistics for the journal. Everything here describes the user's own entries;
 * nothing diagnoses, scores or labels a person's health.
 */

export const METRICS = ['sleepHours', 'sleepQuality', 'mood', 'energy', 'stress'];

export const LABELS = {
  sleepHours: 'sleep hours',
  sleepQuality: 'sleep quality',
  mood: 'mood',
  energy: 'energy',
  stress: 'stress',
};

const round = (n, dp = 2) => (n == null || Number.isNaN(n) ? null : Math.round(n * 10 ** dp) / 10 ** dp);

export function mean(values) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

export function averages(entries) {
  const out = {};
  for (const m of METRICS) out[m] = round(mean(entries.map((e) => e[m])));
  return out;
}

export function changeBetween(current, previous) {
  const out = {};
  for (const m of METRICS) {
    out[m] = current[m] == null || previous[m] == null ? null : round(current[m] - previous[m]);
  }
  return out;
}

/** Pearson correlation; null when there is too little data or no variation. */
export function pearson(xs, ys) {
  const n = xs.length;
  if (n < 5 || n !== ys.length) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  return sxy / Math.sqrt(sxx * syy);
}

export function describeCorrelation(a, b, r, n) {
  const A = LABELS[a];
  const B = LABELS[b];
  const abs = Math.abs(r);
  if (abs < 0.2) return `Across ${n} days, ${A} and ${B} show little relationship in your entries.`;
  const strength = abs < 0.4 ? 'a slight' : abs < 0.6 ? 'a moderate' : 'a fairly strong';
  const direction = r > 0 ? 'tend to go up and down together' : 'tend to move in opposite directions';
  return `Across ${n} days, there is ${strength} pattern: ${A} and ${B} ${direction}.`;
}

const PAIRS = [
  ['sleepHours', 'mood'],
  ['sleepHours', 'energy'],
  ['sleepHours', 'stress'],
  ['sleepQuality', 'mood'],
  ['stress', 'mood'],
];

export function correlations(entries) {
  const out = [];
  for (const [a, b] of PAIRS) {
    const r = pearson(entries.map((e) => e[a]), entries.map((e) => e[b]));
    if (r == null) continue;
    out.push({ a, b, r: round(r), n: entries.length, summary: describeCorrelation(a, b, r, entries.length) });
  }
  return out;
}

const MIN_DAYS_PER_GROUP = 3;

/** For each routine, compare average mood/energy/stress on days it was logged vs days it was not. */
export function routineComparisons(entries) {
  const names = new Map(); // lowercase -> display name
  for (const e of entries) for (const r of e.routines) if (!names.has(r.toLowerCase())) names.set(r.toLowerCase(), r);

  const out = [];
  for (const [key, display] of names) {
    const withDays = entries.filter((e) => e.routines.some((r) => r.toLowerCase() === key));
    const withoutDays = entries.filter((e) => !withDays.includes(e));
    if (withDays.length < MIN_DAYS_PER_GROUP || withoutDays.length < MIN_DAYS_PER_GROUP) continue;

    const withAvg = averages(withDays);
    const withoutAvg = averages(withoutDays);
    out.push({
      routine: display,
      daysWith: withDays.length,
      daysWithout: withoutDays.length,
      with: withAvg,
      without: withoutAvg,
      difference: changeBetween(withAvg, withoutAvg),
      summary:
        `On the ${withDays.length} days you logged "${display}", mood averaged ${withAvg.mood} ` +
        `compared with ${withoutAvg.mood} on the other ${withoutDays.length} days.`,
    });
  }
  return out.sort((x, y) => Math.abs(y.difference.mood ?? 0) - Math.abs(x.difference.mood ?? 0)).slice(0, 8);
}

// ---- date helpers (UTC string arithmetic, no timezone surprises) ----
export function addDays(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}
