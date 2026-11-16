import './loadEnv.js';
import mongoose from 'mongoose';
import { createApp } from './app.js';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wellbeing_journal';

async function main() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error(`Could not connect to MongoDB: ${err.message}`);
    console.error('Start MongoDB (or set MONGODB_URI in server/.env) and try again.');
    process.exit(1);
  }

  const server = createApp({ corsOrigin: process.env.CORS_ORIGIN }).listen(PORT, () =>
    console.log(`Wellbeing Journal API listening on http://localhost:${PORT}`),
  );

  const shutdown = () => server.close(() => mongoose.disconnect().then(() => process.exit(0)));
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
