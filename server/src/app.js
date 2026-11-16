import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import entriesRouter from './routes/entries.js';
import insightsRouter from './routes/insights.js';
import { errorHandler, notFound } from './middleware/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp({ corsOrigin } = {}) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: (corsOrigin || '').split(',').filter(Boolean) }));
  app.use(express.json({ limit: '20kb' }));
  app.use('/api', rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));

  app.get('/api/health', (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({ status: connected ? 'ok' : 'database_unavailable' });
  });
  app.use('/api/entries', entriesRouter);
  app.use('/api/insights', insightsRouter);
  app.use('/api', notFound);

  // In production, serve the built React app from the same server.
  const dist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
