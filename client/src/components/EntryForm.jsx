import { useEffect, useState } from 'react';
import { api, ApiError } from '../lib/api.js';
import { formatDate, localToday, RATING_LABELS } from '../lib/dates.js';
import RatingInput from './RatingInput.jsx';
import RoutinePicker from './RoutinePicker.jsx';

const blank = () => ({ sleepHours: '7', sleepQuality: null, mood: null, energy: null, stress: null, routines: [], note: '' });

const fromEntry = (e) => ({
  sleepHours: String(e.sleepHours),
  sleepQuality: e.sleepQuality,
  mood: e.mood,
  energy: e.energy,
  stress: e.stress,
  routines: e.routines || [],
  note: e.note || '',
});

function validateClient(f) {
  const errors = {};
  const hours = Number(f.sleepHours);
  if (f.sleepHours.trim() === '' || Number.isNaN(hours)) errors.sleepHours = 'Enter the hours you slept, e.g. 7.5';
  else if (hours < 0 || hours > 24) errors.sleepHours = 'Sleep hours must be between 0 and 24';
  for (const k of ['sleepQuality', 'mood', 'energy', 'stress']) if (!f[k]) errors[k] = 'Please choose a rating from 1 to 5';
  if (f.note.length > 1000) errors.note = 'Note can be at most 1000 characters';
  return errors;
}

export default function EntryForm({ date, onDateChange, onChanged }) {
  const [form, setForm] = useState(blank());
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null); // { type: 'success' | 'error', text }

  // Load any existing entry for the selected date so it can be edited rather than duplicated.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrors({});
    setBanner(null);
    api
      .listEntries({ from: date, to: date, limit: 1 })
      .then(({ entries }) => {
        if (cancelled) return;
        setExisting(entries[0] || null);
        setForm(entries[0] ? fromEntry(entries[0]) : blank());
      })
      .catch((err) => {
        if (cancelled) return;
        setExisting(null);
        setForm(blank());
        setBanner({ type: 'error', text: err.message });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [date]);

  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function submit(e) {
    e.preventDefault();
    setBanner(null);
    const clientErrors = validateClient(form);
    if (Object.keys(clientErrors).length) {
      setErrors(clientErrors);
      setBanner({ type: 'error', text: 'Please fix the highlighted fields.' });
      return;
    }
    const payload = { date, ...form, sleepHours: Number(form.sleepHours) };
    setSaving(true);
    try {
      const saved = existing ? await api.update(existing.id, payload) : await api.create(payload);
      setExisting(saved);
      setForm(fromEntry(saved));
      setBanner({ type: 'success', text: existing ? 'Entry updated.' : 'Entry saved. Nice work checking in.' });
      onChanged();
    } catch (err) {
      if (err instanceof ApiError && err.details?.length) {
        const fieldErrors = {};
        for (const d of err.details) fieldErrors[d.field.split('.')[0]] = d.message;
        setErrors(fieldErrors);
      }
      setBanner({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="card form" onSubmit={submit} noValidate aria-busy={loading}>
      <div className="card-head">
        <h2>{existing ? 'Edit entry' : 'New entry'}</h2>
        <span className="pill">{formatDate(date)}</span>
      </div>

      <div className="field">
        <label htmlFor="date">Date</label>
        <input id="date" type="date" value={date} max={localToday()} required onChange={(e) => e.target.value && onDateChange(e.target.value)} />
        {existing && <p className="hint">You already have an entry for this day. Saving will update it.</p>}
      </div>

      <div className="field">
        <label htmlFor="sleepHours">Hours slept last night</label>
        <input
          id="sleepHours"
          type="number"
          inputMode="decimal"
          min="0"
          max="24"
          step="0.25"
          value={form.sleepHours}
          onChange={(e) => set('sleepHours')(e.target.value)}
          aria-invalid={!!errors.sleepHours}
          aria-describedby={errors.sleepHours ? 'sleepHours-err' : undefined}
        />
        {errors.sleepHours && <p className="error-text" id="sleepHours-err">{errors.sleepHours}</p>}
      </div>

      <RatingInput name="sleepQuality" label="Sleep quality" value={form.sleepQuality} onChange={set('sleepQuality')} labels={RATING_LABELS.sleepQuality} error={errors.sleepQuality} />
      <RatingInput name="mood" label="Mood" value={form.mood} onChange={set('mood')} labels={RATING_LABELS.mood} error={errors.mood} />
      <RatingInput name="energy" label="Energy" value={form.energy} onChange={set('energy')} labels={RATING_LABELS.energy} error={errors.energy} />
      <RatingInput name="stress" label="Stress" value={form.stress} onChange={set('stress')} labels={RATING_LABELS.stress} error={errors.stress} />

      <RoutinePicker value={form.routines} onChange={set('routines')} error={errors.routines} />

      <div className="field">
        <label htmlFor="note">Notes <span className="hint">(optional)</span></label>
        <textarea
          id="note"
          rows={4}
          maxLength={1000}
          placeholder="Anything worth remembering about today?"
          value={form.note}
          onChange={(e) => set('note')(e.target.value)}
        />
        <p className="hint right">{form.note.length}/1000</p>
        {errors.note && <p className="error-text">{errors.note}</p>}
      </div>

      <div aria-live="polite">
        {banner && <p className={banner.type === 'success' ? 'banner success' : 'banner error'} role={banner.type === 'error' ? 'alert' : 'status'}>{banner.text}</p>}
      </div>

      <button className="btn primary" type="submit" disabled={saving || loading}>
        {saving ? 'Saving…' : existing ? 'Update entry' : 'Save entry'}
      </button>
    </form>
  );
}
