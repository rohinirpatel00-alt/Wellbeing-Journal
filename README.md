# 🌿 Wellbeing Journal

A private journal for tracking **sleep, mood, energy, stress and routines** over time, with trend charts and a
"compare your patterns" view. It describes patterns in your own entries; it never diagnoses, scores or labels a
person's health.

**Stack:** React (Vite) · Node.js + Express REST API · MongoDB (Mongoose) · Zod validation · Recharts

## Quick start

Prerequisites: Node 18+ and a running MongoDB (local, or a free MongoDB Atlas cluster).

```bash
# 1. API
cd server
cp .env.example .env          # edit MONGODB_URI if needed
npm install
npm run seed                  # optional: 45 days of demo data
npm run dev                   # http://localhost:5000

# 2. UI (new terminal)
cd client
npm install
npm run dev                   # http://localhost:5173  (proxies /api to :5000)
```

The server loads `MONGODB_URI` from the workspace-root `.env` first, then `server/.env` as a fallback. For MongoDB Atlas, set it to your cluster connection string, replace the password placeholder with your database user's URL-encoded password, and allow your IP in Atlas Network Access.

**Single-server mode:** `cd client && npm run build`, then `cd ../server && npm start`. Express serves the built app
and the API together at http://localhost:5000.

## Features

- **Log** a day: hours slept, sleep quality, mood, energy and stress (1-5), routines (pick or add your own) and a note.
  Choosing a date that already has an entry loads it for editing, so there is exactly one entry per day.
- **History**: paginated list with edit and delete (with confirmation).
- **Trends**: 7 / 30 / 90-day charts for mood, energy, stress and sleep, with average and change vs the previous
  period. Changes are shown neutrally (▲/▼), never as "good" or "bad".
- **Patterns**: how measures move together (e.g. sleep hours vs mood) in plain language, and mood on days with vs
  without each routine. Needs a minimum amount of data and always states that this is not cause and effect.
- **Responsive and accessible**: mobile bottom navigation, keyboard-friendly rating buttons, labelled form fields,
  ARIA live regions for messages, light and dark themes, reduced-motion support.

## REST API

All responses are JSON. Errors have the shape `{ "error": { "code", "message", "details?" } }`.

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | 200 when the database is connected, otherwise 503 |
| GET | `/api/entries?from=&to=&limit=&page=` | List entries, newest first (dates `YYYY-MM-DD`) |
| POST | `/api/entries` | Create an entry (201) |
| GET | `/api/entries/:id` | Get one entry |
| PUT | `/api/entries/:id` | Replace an entry's fields |
| DELETE | `/api/entries/:id` | Delete (204) |
| GET | `/api/insights?days=30&to=YYYY-MM-DD` | Averages, change vs previous period, chart series, correlations, routine comparisons |

Entry body:

```json
{
  "date": "2026-11-03",
  "sleepHours": 7.5,
  "sleepQuality": 4,
  "mood": 4,
  "energy": 3,
  "stress": 2,
  "routines": ["Walk outdoors", "Meditation"],
  "note": "Felt calm after the walk."
}
```

## Validation and error handling

| Case | Response |
|---|---|
| Field out of range / wrong type / bad or future date / unknown field | 400 `VALIDATION_ERROR` with per-field `details` |
| Malformed JSON | 400 `INVALID_JSON` |
| Body over 20 KB | 413 `PAYLOAD_TOO_LARGE` |
| Invalid id | 400 `INVALID_ID` |
| Entry or route not found | 404 `NOT_FOUND` |
| Second entry for the same date | 409 `DUPLICATE_DATE` (also enforced by a unique index) |
| Anything unexpected | 500 `INTERNAL_ERROR` (no stack traces leaked) |

Validation runs on both client (instant feedback) and server (the source of truth). Unknown fields are rejected, which also blocks
MongoDB operator injection. The API also uses `helmet` security headers, a 300 requests/minute rate limit, and restricts CORS to
`CORS_ORIGIN`.

## Tests

```bash
cd server
npm run test:unit   # validation, errors, routing, statistics, demo data. No database needed
npm test            # also runs the database-backed API tests (test/api.test.js)
```

`npm test` starts a throwaway MongoDB via `mongodb-memory-server`, which downloads a MongoDB binary on first run. To use your
own instance instead: `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/wj_test npm test` (**the test database is emptied**, so
never point it at your real data).

## Privacy and scope notes

- Data stays in your own MongoDB. Nothing is sent to third parties.
- This is a single-user app with **no login**. Run it locally or behind your own authentication before exposing it to a network.
- Dates are stored as plain `YYYY-MM-DD` strings so entries never shift days across timezones.

## Project layout

```
server/src  app.js  index.js  seed.js  models/Entry.js  routes/{entries,insights}.js
            lib/{validation,stats,sampleData}.js  middleware/errors.js
server/test api.test.js (DB)  validation.test.js  stats.test.js  sampleData.test.js
client/src  App.jsx  components/{EntryForm,History,Trends,Patterns,RatingInput,RoutinePicker,RangePicker}.jsx
            lib/{api,dates,useInsights}.js  styles.css
```
