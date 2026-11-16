export default function RatingInput({ name, label, value, onChange, labels, error, hint }) {
  return (
    <fieldset className="field" aria-describedby={error ? `${name}-err` : undefined}>
      <legend>
        {label} {hint && <span className="hint">{hint}</span>}
      </legend>
      <div className="rating" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={value === n ? 'rating-opt selected' : 'rating-opt'}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
            <span className="rating-num">{n}</span>
            <span className="rating-label">{labels[n - 1]}</span>
          </label>
        ))}
      </div>
      {error && <p className="error-text" id={`${name}-err`}>{error}</p>}
    </fieldset>
  );
}
