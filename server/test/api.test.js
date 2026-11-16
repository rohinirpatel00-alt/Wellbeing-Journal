import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { Entry } from '../src/models/Entry.js';

let mongod;
let app;

const valid = (over = {}) => ({
  date: '2026-10-01', sleepHours: 7.5, sleepQuality: 4, mood: 4, energy: 3, stress: 2,
  routines: ['Walk'], note: 'Felt fine', ...over,
});

beforeAll(async () => {
  const uri = process.env.TEST_MONGODB_URI;
  if (uri) {
    await mongoose.connect(uri);
  } else {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
  }
  await Entry.init();
  app = createApp();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

beforeEach(async () => {
  await Entry.deleteMany({});
});

describe('entries CRUD', () => {
  it('creates, reads, updates and deletes an entry', async () => {
    const created = await request(app).post('/api/entries').send(valid()).expect(201);
    expect(created.body.id).toBeTruthy();
    expect(created.body._id).toBeUndefined();

    await request(app).get(`/api/entries/${created.body.id}`).expect(200);

    const updated = await request(app).put(`/api/entries/${created.body.id}`).send(valid({ mood: 5 })).expect(200);
    expect(updated.body.mood).toBe(5);

    await request(app).delete(`/api/entries/${created.body.id}`).expect(204);
    await request(app).get(`/api/entries/${created.body.id}`).expect(404);
  });

  it('lists newest first and filters by date range', async () => {
    for (const d of ['2026-10-01', '2026-10-02', '2026-10-03']) {
      await request(app).post('/api/entries').send(valid({ date: d })).expect(201);
    }
    const all = await request(app).get('/api/entries').expect(200);
    expect(all.body.entries.map((x) => x.date)).toEqual(['2026-10-03', '2026-10-02', '2026-10-01']);
    const some = await request(app).get('/api/entries?from=2026-10-02&to=2026-10-02').expect(200);
    expect(some.body.total).toBe(1);
  });

  it('de-duplicates routines case-insensitively', async () => {
    const r = await request(app).post('/api/entries').send(valid({ routines: ['Walk', 'walk', ' Yoga '] })).expect(201);
    expect(r.body.routines).toEqual(['Walk', 'Yoga']);
  });
});

describe('validation and errors', () => {
  it.each([
    ['mood out of range', { mood: 6 }, 'mood'],
    ['mood not a whole number', { mood: 3.5 }, 'mood'],
    ['sleep hours too high', { sleepHours: 30 }, 'sleepHours'],
    ['sleep hours as string', { sleepHours: 'lots' }, 'sleepHours'],
    ['bad date', { date: '2026-02-31' }, 'date'],
    ['future date', { date: '2999-01-01' }, 'date'],
    ['note too long', { note: 'x'.repeat(1001) }, 'note'],
    ['too many routines', { routines: Array.from({ length: 11 }, (_, i) => `r${i}`) }, 'routines'],
  ])('rejects %s', async (_name, over, field) => {
    const res = await request(app).post('/api/entries').send(valid(over)).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.field.startsWith(field))).toBe(true);
  });

  it('rejects missing fields and unknown fields', async () => {
    await request(app).post('/api/entries').send({}).expect(400);
    await request(app).post('/api/entries').send(valid({ $where: '1' })).expect(400);
  });

  it('rejects malformed JSON', async () => {
    const res = await request(app).post('/api/entries').set('Content-Type', 'application/json').send('{bad').expect(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('returns 409 for a duplicate date', async () => {
    await request(app).post('/api/entries').send(valid()).expect(201);
    const res = await request(app).post('/api/entries').send(valid()).expect(409);
    expect(res.body.error.code).toBe('DUPLICATE_DATE');
  });

  it('returns 400 for an invalid id and 404 for a missing one', async () => {
    await request(app).get('/api/entries/not-an-id').expect(400);
    await request(app).get(`/api/entries/${new mongoose.Types.ObjectId()}`).expect(404);
    await request(app).delete(`/api/entries/${new mongoose.Types.ObjectId()}`).expect(404);
  });

  it('returns 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('validates list query params', async () => {
    await request(app).get('/api/entries?limit=0').expect(400);
    await request(app).get('/api/entries?from=2026-10-05&to=2026-10-01').expect(400);
  });
});

describe('insights', () => {
  it('returns averages, period change, correlations and routine comparisons', async () => {
    // Current window: 2026-10-01..2026-10-14 ; previous window: 2026-09-17..2026-09-30
    for (let i = 1; i <= 14; i++) {
      const walk = i % 2 === 0;
      await request(app).post('/api/entries').send(valid({
        date: `2026-10-${String(i).padStart(2, '0')}`,
        sleepHours: 5 + (i % 5), mood: walk ? 4 : 3, stress: walk ? 2 : 4, routines: walk ? ['Walk'] : [],
      })).expect(201);
    }
    await request(app).post('/api/entries').send(valid({ date: '2026-09-20', mood: 2 })).expect(201);

    const res = await request(app).get('/api/insights?days=14&to=2026-10-14').expect(200);
    expect(res.body.count).toBe(14);
    expect(res.body.series).toHaveLength(14);
    expect(res.body.averages.mood).toBeCloseTo(3.5);
    expect(res.body.previous.count).toBe(1);
    expect(res.body.change.mood).toBeCloseTo(1.5);
    expect(res.body.routines[0].routine).toBe('Walk');
    expect(res.body.routines[0].difference.mood).toBeCloseTo(1);
    expect(res.body.correlations.length).toBeGreaterThan(0);
    expect(res.body.disclaimer).toMatch(/not a medical/);
  });

  it('handles an empty journal', async () => {
    const res = await request(app).get('/api/insights?days=30&to=2026-10-14').expect(200);
    expect(res.body.count).toBe(0);
    expect(res.body.averages.mood).toBeNull();
    expect(res.body.routines).toEqual([]);
  });

  it('validates days', async () => {
    await request(app).get('/api/insights?days=2').expect(400);
  });
});
