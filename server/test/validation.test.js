// These tests never touch MongoDB: they cover validation, routing and error responses,
// which all run before any database call. (test/api.test.js covers the database-backed behaviour.)
import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();
const valid = (over = {}) => ({
  date: '2026-10-01', sleepHours: 7.5, sleepQuality: 4, mood: 4, energy: 3, stress: 2,
  routines: ['Walk'], note: 'ok', ...over,
});

describe('request validation (no database needed)', () => {
  it.each([
    ['mood out of range', { mood: 6 }, 'mood'],
    ['mood not a whole number', { mood: 3.5 }, 'mood'],
    ['stress below range', { stress: 0 }, 'stress'],
    ['sleep hours too high', { sleepHours: 30 }, 'sleepHours'],
    ['sleep hours negative', { sleepHours: -1 }, 'sleepHours'],
    ['sleep hours as string', { sleepHours: 'lots' }, 'sleepHours'],
    ['impossible date', { date: '2026-02-31' }, 'date'],
    ['wrong date format', { date: '01/10/2026' }, 'date'],
    ['future date', { date: '2999-01-01' }, 'date'],
    ['note too long', { note: 'x'.repeat(1001) }, 'note'],
    ['too many routines', { routines: Array.from({ length: 11 }, (_, i) => `r${i}`) }, 'routines'],
    ['routine too long', { routines: ['x'.repeat(31)] }, 'routines'],
    ['empty routine', { routines: ['  '] }, 'routines'],
  ])('rejects %s', async (_n, over, field) => {
    const res = await request(app).post('/api/entries').send(valid(over)).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.some((d) => d.field.startsWith(field))).toBe(true);
  });

  it('lists every missing field', async () => {
    const res = await request(app).post('/api/entries').send({}).expect(400);
    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['date', 'sleepHours', 'sleepQuality', 'mood', 'energy', 'stress']));
  });

  it('rejects unknown fields, including Mongo operators', async () => {
    await request(app).post('/api/entries').send(valid({ $where: '1' })).expect(400);
    await request(app).put('/api/entries/507f1f77bcf86cd799439011').send(valid({ isAdmin: true })).expect(400);
  });

  it('rejects malformed JSON with a clear code', async () => {
    const res = await request(app).post('/api/entries').set('Content-Type', 'application/json').send('{bad').expect(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });

  it('rejects oversized bodies', async () => {
    const res = await request(app).post('/api/entries').send(valid({ note: 'x'.repeat(30_000) })).expect(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('rejects invalid ids before querying', async () => {
    for (const method of ['get', 'put', 'delete']) {
      const res = await request(app)[method]('/api/entries/not-an-id').send(valid()).expect(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    }
  });

  it('validates list and insights query params', async () => {
    await request(app).get('/api/entries?limit=0').expect(400);
    await request(app).get('/api/entries?limit=9999').expect(400);
    await request(app).get('/api/entries?from=2026-10-05&to=2026-10-01').expect(400);
    await request(app).get('/api/insights?days=2').expect(400);
    await request(app).get('/api/insights?days=30&to=nope').expect(400);
  });

  it('returns a JSON 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('reports database unavailability on /api/health', async () => {
    const res = await request(app).get('/api/health').expect(503);
    expect(res.body.status).toBe('database_unavailable');
  });

  it('sets security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
