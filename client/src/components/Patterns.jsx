import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useInsights } from '../lib/useInsights.js';
import RangePicker from './RangePicker.jsx';

function CorrelationBar({ r }) {
  // Position a marker along a -1..+1 scale.
  const pct = ((r + 1) / 2) * 100;
  return (
    <div className="corr-scale" aria-hidden="true">
      <span className="corr-mid" />
      <span className="corr-dot" style={{ left: `${pct}%` }} />
    </div>
  );
}

export default function Patterns({ version }) {
  const [days, setDays] = useState(30);
  const { data, error, loading } = useInsights(days, version);

  const routineChart = data?.routines.map((r) => ({
    name: r.routine,
    'With routine': r.with.mood,
    'Without': r.without.mood,
  }));

  return (
    <section aria-label="Personal patterns">
      <div className="toolbar">
        <h2>Compare your patterns</h2>
        <RangePicker value={days} onChange={setDays} options={[30, 60, 90]} />
      </div>
      <p className="muted">
        See how things line up in your own entries. These are observations, not explanations. Two things moving together
        does not mean one causes the other.
      </p>

      {error && <p className="banner error" role="alert">{error}</p>}
      {loading && !data && <p className="muted center">Loading…</p>}

      {data && (
        <>
          <div className="card">
            <h3>How measures move together</h3>
            {data.correlations.length === 0 ? (
              <p className="muted">
                You need at least 5 entries with some variety in this period to compare patterns (you have {data.count}).
              </p>
            ) : (
              <ul className="corr-list">
                {data.correlations.map((c) => (
                  <li key={`${c.a}-${c.b}`}>
                    <p>{c.summary}</p>
                    <CorrelationBar r={c.r} />
                    <p className="scale-labels" aria-hidden="true"><span>move opposite</span><span>unrelated</span><span>move together</span></p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3>Routines and mood</h3>
            {data.routines.length === 0 ? (
              <p className="muted">
                Once a routine appears on at least 3 days (and is missing from at least 3), you will see how your average
                mood compared on those days.
              </p>
            ) : (
              <>
                <div className="chart short" role="img" aria-label="Bar chart of average mood on days with and without each routine">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={routineChart} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
                      <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} interval={0} />
                      <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="var(--muted)" fontSize={12} />
                      <Tooltip contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                      <Legend />
                      <Bar dataKey="With routine" fill="var(--c-mood)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Without" fill="var(--c-muted-bar)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="plain-list">
                  {data.routines.map((r) => <li key={r.routine}>{r.summary}</li>)}
                </ul>
              </>
            )}
          </div>
          <p className="muted small">{data.disclaimer}</p>
        </>
      )}
    </section>
  );
}
