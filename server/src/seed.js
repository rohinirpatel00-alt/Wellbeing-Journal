// Loads ~6 weeks of demo entries ending today:   npm run seed        (add --reset to clear existing entries first)
import './loadEnv.js';
import mongoose from 'mongoose';
import { Entry } from './models/Entry.js';
import { entrySchema } from './lib/validation.js';
import { generateSampleEntries } from './lib/sampleData.js';
import { todayUtc } from './lib/stats.js';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wellbeing_journal';
const reset = process.argv.includes('--reset');

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  if (reset) await Entry.deleteMany({});
  const entries = generateSampleEntries(todayUtc()).map((e) => entrySchema.parse(e));
  const ops = entries.map((e) => ({ updateOne: { filter: { date: e.date }, update: { $set: e }, upsert: true } }));
  const res = await Entry.bulkWrite(ops);
  console.log(`Seeded ${entries.length} entries (${res.upsertedCount} new, ${res.modifiedCount} updated).`);
} catch (err) {
  console.error('Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
