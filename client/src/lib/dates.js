/** Today's date in the user's local timezone as YYYY-MM-DD. */
export function localToday() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formatDate(dateStr, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' });
}

export const shortDate = (s) => formatDate(s, { day: 'numeric', month: 'short' });

export const RATING_LABELS = {
  sleepQuality: ['Poor', 'Fair', 'Okay', 'Good', 'Great'],
  mood: ['Very low', 'Low', 'Neutral', 'Good', 'Very good'],
  energy: ['Very low', 'Low', 'Moderate', 'High', 'Very high'],
  stress: ['Very low', 'Low', 'Moderate', 'High', 'Very high'],
};

export const METRIC_NAMES = {
  sleepHours: 'Sleep (hours)',
  sleepQuality: 'Sleep quality',
  mood: 'Mood',
  energy: 'Energy',
  stress: 'Stress',
};
