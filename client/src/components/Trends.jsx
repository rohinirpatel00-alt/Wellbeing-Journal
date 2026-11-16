import { useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, ReferenceLine } from 'recharts';
import { useInsights } from '../lib/useInsights.js';
import { METRIC_NAMES, shortDate } from '../lib/dates.js';
import RangePicker from './RangePicker.jsx';

const METRICS = ['sleepHours', 'sleepQuality', 'mood', 'energy', 'stress'];

function Delta({ value, unit = '' }) {
  if (value == null) return <span className="delta">no earlier data to compare</span>;
  if (value === 0) return <span className="delta">same as previous period</span>;
  // Deliberately neutral: a higher or lower number is not framed as good or bad.
  return <span className="delta">{value > 0 ? '▲' : '▼'} {Math.abs(value)}{unit} vs previous period</span>;
}

export default function Trends({ version }) {
  const [days, setDays] = useState(30);
  const { data, error, loading } = useInsights(days, version);

  return (
    <section aria-label="Trends">
      <div className="toolbar">
        <h2>Your trends</h2>
        <RangePicker value={days} onChange={setDays} />
      </div>

      {error && <p className="banner error" role="alert">{error}</p>}
      {loading && !data && <p className="muted center">Loading…</p>}

      {data && data.count === 0 && (
        <div className="card empty">
          <h2>Nothing to chart yet</h2>
          <p>No entries in the last {days} days. Log a few days and your trends will show up here.</p>
        </div>
      )}

      {data && data.count > 0 && (
        <>
          <p className="muted">{data.count} {data.count === 1 ? 'entry' : 'entries'} in the last {days} days</p>
          <div className="stat-grid">
            {METRICS.map((m) => (
              <div className="card stat" key={m}>
                <p className="stat-label">{METRIC_NAMES[m]}</p>
                <p className="stat-value">{data.averages[m]}{m === 'sleepHours' ? 'h' : ''}</p>
                <Delta value={data.change[m]} unit={m === 'sleepHours' ? 'h' : ''} />
              </div>
            ))}
          </div>

          <div className="card chart-card">
            <h3>Mood, energy and stress</h3>
            <p className="muted small">Each rated 1–5 per day.</p>
            <div className="chart" role="img" aria-label="Line chart of daily mood, energy and stress ratings">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.series} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
                  <XAxis dataKey="date" tickFormatter={shortDate} stroke="var(--muted)" fontSize={12} minTickGap={24} />
                  <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="var(--muted)" fontSize={12} />
                  <Tooltip labelFormatter={shortDate} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="mood" name="Mood" stroke="var(--c-mood)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="energy" name="Energy" stroke="var(--c-energy)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="stress" name="Stress" stroke="var(--c-stress)" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card chart-card">
            <h3>Sleep</h3>
            <p className="muted small">Hours slept each night. Dashed line shows your average.</p>
            <div className="chart" role="img" aria-label="Bar chart of hours slept per night">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.series} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" />
                  <XAxis dataKey="date" tickFormatter={shortDate} stroke="var(--muted)" fontSize={12} minTickGap={24} />
                  <YAxis stroke="var(--muted)" fontSize={12} domain={[0, 'dataMax + 1']} />
                  <Tooltip labelFormatter={shortDate} formatter={(v) => [`${v} h`, 'Sleep']} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8 }} />
                  <ReferenceLine y={data.averages.sleepHours} stroke="var(--muted)" strokeDasharray="5 4" />
                  <Bar dataKey="sleepHours" name="Sleep" fill="var(--c-sleep)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <p className="muted small">{data.disclaimer}</p>
        </>
      )}
    </section>
  );
}
