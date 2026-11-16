import { z } from 'zod';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isRealDate(s) {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/** Latest date we accept: tomorrow in UTC, so users ahead of UTC (e.g. India) can log "today". */
export function maxAllowedDate() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export const dateString = z
  .string({ required_error: 'Date is required' })
  .refine(isRealDate, 'Date must be a real date in YYYY-MM-DD format');

const rating = (label) =>
  z
    .number({ required_error: `${label} is required`, invalid_type_error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(1, `${label} must be between 1 and 5`)
    .max(5, `${label} must be between 1 and 5`);

const routine = z
  .string()
  .trim()
  .min(1, 'Routine names cannot be empty')
  .max(30, 'Routine names can be at most 30 characters');

export const entrySchema = z
  .object({
    date: dateString.refine((d) => d <= maxAllowedDate(), 'Date cannot be in the future'),
    sleepHours: z
      .number({ required_error: 'Sleep hours is required', invalid_type_error: 'Sleep hours must be a number' })
      .min(0, 'Sleep hours must be between 0 and 24')
      .max(24, 'Sleep hours must be between 0 and 24'),
    sleepQuality: rating('Sleep quality'),
    mood: rating('Mood'),
    energy: rating('Energy'),
    stress: rating('Stress'),
    routines: z
      .array(routine)
      .max(10, 'At most 10 routines per entry')
      .default([])
      .transform((list) => {
        const seen = new Set();
        return list.filter((r) => {
          const k = r.toLowerCase();
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      }),
    note: z.string().trim().max(1000, 'Note can be at most 1000 characters').default(''),
  })
  .strict('Unknown field in request body');

export const listQuerySchema = z
  .object({
    from: dateString.optional(),
    to: dateString.optional(),
    limit: z.coerce.number().int().min(1).max(366).default(100),
    page: z.coerce.number().int().min(1).default(1),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: '"from" must not be after "to"', path: ['from'] });

export const insightsQuerySchema = z.object({
  days: z.coerce.number().int().min(7, 'days must be at least 7').max(365, 'days must be at most 365').default(30),
  to: dateString.optional(),
});
