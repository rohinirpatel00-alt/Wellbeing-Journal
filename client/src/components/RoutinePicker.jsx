import { useState } from 'react';

const SUGGESTIONS = ['Exercise', 'Walk outdoors', 'Meditation', 'Reading', 'Social time', 'Screen-free evening', 'Late caffeine'];
const MAX = 10;

export default function RoutinePicker({ value, onChange, error }) {
  const [custom, setCustom] = useState('');
  const has = (name) => value.some((v) => v.toLowerCase() === name.toLowerCase());

  const toggle = (name) => onChange(has(name) ? value.filter((v) => v.toLowerCase() !== name.toLowerCase()) : [...value, name]);

  const addCustom = () => {
    const name = custom.trim().slice(0, 30);
    if (!name || has(name) || value.length >= MAX) return;
    onChange([...value, name]);
    setCustom('');
  };

  const all = [...SUGGESTIONS, ...value.filter((v) => !SUGGESTIONS.some((s) => s.toLowerCase() === v.toLowerCase()))];

  return (
    <fieldset className="field">
      <legend>
        Routines today <span className="hint">(optional, up to {MAX})</span>
      </legend>
      <div className="chips">
        {all.map((name) => (
          <button
            type="button"
            key={name}
            className={has(name) ? 'chip on' : 'chip'}
            aria-pressed={has(name)}
            onClick={() => toggle(name)}
          >
            {has(name) ? '✓ ' : ''}{name}
          </button>
        ))}
      </div>
      <div className="inline-add">
        <label className="sr-only" htmlFor="custom-routine">Add your own routine</label>
        <input
          id="custom-routine"
          type="text"
          maxLength={30}
          placeholder="Add your own…"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button type="button" className="btn secondary" onClick={addCustom} disabled={!custom.trim() || value.length >= MAX}>
          Add
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </fieldset>
  );
}
