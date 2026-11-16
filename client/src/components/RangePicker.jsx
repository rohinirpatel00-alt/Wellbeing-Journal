export default function RangePicker({ value, onChange, options = [7, 30, 90] }) {
  return (
    <div className="range" role="group" aria-label="Time range">
      {options.map((d) => (
        <button key={d} className={value === d ? 'seg on' : 'seg'} aria-pressed={value === d} onClick={() => onChange(d)}>
          {d} days
        </button>
      ))}
    </div>
  );
}
