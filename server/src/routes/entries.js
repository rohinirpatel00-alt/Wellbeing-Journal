import { Router } from 'express';
import { Entry } from '../models/Entry.js';
import { entrySchema, listQuerySchema } from '../lib/validation.js';
import { asyncHandler, HttpError, validate, validateId } from '../middleware/errors.js';

const router = Router();

// GET /api/entries?from=&to=&limit=&page=  (newest first)
router.get(
  '/',
  validate(listQuerySchema, 'query'),
  asyncHandler(async (req, res) => {
    const { from, to, limit, page } = req.valid.query;
    const filter = {};
    if (from || to) filter.date = { ...(from && { $gte: from }), ...(to && { $lte: to }) };

    const [entries, total] = await Promise.all([
      Entry.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Entry.countDocuments(filter),
    ]);
    res.json({ entries, total, page, limit });
  }),
);

// POST /api/entries
router.post(
  '/',
  validate(entrySchema),
  asyncHandler(async (req, res) => {
    const entry = await Entry.create(req.valid.body);
    res.status(201).json(entry);
  }),
);

router.get(
  '/:id',
  validateId,
  asyncHandler(async (req, res) => {
    const entry = await Entry.findById(req.params.id);
    if (!entry) throw new HttpError(404, 'NOT_FOUND', 'Entry not found');
    res.json(entry);
  }),
);

// PUT /api/entries/:id  (full replacement of the editable fields)
router.put(
  '/:id',
  validateId,
  validate(entrySchema),
  asyncHandler(async (req, res) => {
    const entry = await Entry.findByIdAndUpdate(req.params.id, req.valid.body, {
      new: true,
      runValidators: true,
    });
    if (!entry) throw new HttpError(404, 'NOT_FOUND', 'Entry not found');
    res.json(entry);
  }),
);

router.delete(
  '/:id',
  validateId,
  asyncHandler(async (req, res) => {
    const entry = await Entry.findByIdAndDelete(req.params.id);
    if (!entry) throw new HttpError(404, 'NOT_FOUND', 'Entry not found');
    res.status(204).end();
  }),
);

export default router;
