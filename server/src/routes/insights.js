import { Router } from 'express';
import { Entry } from '../models/Entry.js';
import { insightsQuerySchema } from '../lib/validation.js';
import { asyncHandler, validate } from '../middleware/errors.js';
import { addDays, averages, changeBetween, correlations, routineComparisons, todayUtc } from '../lib/stats.js';

const router = Router();

export const DISCLAIMER =
  'These are descriptive patterns in your own entries. They do not show cause and effect, ' +
  'and they are not a medical or psychological assessment.';

// GET /api/insights?days=30&to=YYYY-MM-DD
router.get(
  '/',
  validate(insightsQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { days, to = todayUtc() } = req.valid.query;
    const from = addDays(to, -(days - 1));
    const prevTo = addDays(from, -1);
    const prevFrom = addDays(prevTo, -(days - 1));

    const [current, previous] = await Promise.all([
      Entry.find({ date: { $gte: from, $lte: to } }).sort({ date: 1 }),
      Entry.find({ date: { $gte: prevFrom, $lte: prevTo } }).sort({ date: 1 }),
    ]);
    const cur = current.map((e) => e.toJSON());
    const prev = previous.map((e) => e.toJSON());

    const curAvg = averages(cur);
    const prevAvg = averages(prev);

    res.json({
      range: { from, to, days },
      count: cur.length,
      averages: curAvg,
      previous: { range: { from: prevFrom, to: prevTo }, count: prev.length, averages: prevAvg },
      change: changeBetween(curAvg, prevAvg),
      series: cur.map(({ date, sleepHours, sleepQuality, mood, energy, stress }) => ({
        date, sleepHours, sleepQuality, mood, energy, stress,
      })),
      correlations: correlations(cur),
      routines: routineComparisons(cur),
      disclaimer: DISCLAIMER,
    });
  }),
);

export default router;
