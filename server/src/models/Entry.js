import mongoose from 'mongoose';

const rating = { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger };

const entrySchema = new mongoose.Schema(
  {
    // Calendar day the entry is about, as YYYY-MM-DD (kept as a string to avoid timezone shifts).
    date: { type: String, required: true, unique: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    sleepHours: { type: Number, required: true, min: 0, max: 24 },
    sleepQuality: rating,
    mood: rating,
    energy: rating,
    stress: rating,
    routines: { type: [String], default: [] },
    note: { type: String, default: '', maxlength: 1000 },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

export const Entry = mongoose.model('Entry', entrySchema);
