import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { formatDate } from '../lib/dates.js';

const PAGE = 20;

export default function History({ version, onEdit, onChanged }) {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .listEntries({ limit: PAGE, page })
      .then((r) => {
        if (cancelled) return;
        setEntries(r.entries);
        setTotal(r.total);
        setError(null);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, version]);

  async function remove(id) {
    try {
      await api.remove(id);
      setConfirming(null);
      // If that was the last item on this page, step back.
      if (entries.length === 1 && page > 1) setPage(page - 1);
      onChanged();
    } catch (e) {
      setError(e.message);
      setConfirming(null);
    }
  }

  if (loading && !entries.length) return <p className="muted center">Loading your entries…</p>;
  if (error) return <p className="banner error" role="alert">{error}</p>;
  if (!entries.length)
    return (
      <div className="card empty">
        <h2>No entries yet</h2>
        <p>Your entries will appear here once you save your first check-in.</p>
      </div>
    );

  const pages = Math.ceil(total / PAGE);

  return (
    <section aria-label="Past entries">
      <p className="muted">{total} {total === 1 ? 'entry' : 'entries'}</p>
      <ul className="list">
        {entries.map((e) => (
          <li key={e.id} className="card entry">
            <div className="card-head">
              <h3>{formatDate(e.date)}</h3>
              <div className="actions">
                <button className="btn small secondary" onClick={() => onEdit(e.date)} aria-label={`Edit entry for ${formatDate(e.date)}`}>Edit</button>
                {confirming === e.id ? (
                  <>
                    <button className="btn small danger" onClick={() => remove(e.id)}>Confirm delete</button>
                    <button className="btn small secondary" onClick={() => setConfirming(null)}>Cancel</button>
                  </>
                ) : (
                  <button className="btn small secondary" onClick={() => setConfirming(e.id)} aria-label={`Delete entry for ${formatDate(e.date)}`}>Delete</button>
                )}
              </div>
            </div>
            <dl className="metrics">
              <div><dt>Sleep</dt><dd>{e.sleepHours}h</dd></div>
              <div><dt>Sleep quality</dt><dd>{e.sleepQuality}/5</dd></div>
              <div><dt>Mood</dt><dd>{e.mood}/5</dd></div>
              <div><dt>Energy</dt><dd>{e.energy}/5</dd></div>
              <div><dt>Stress</dt><dd>{e.stress}/5</dd></div>
            </dl>
            {e.routines.length > 0 && (
              <p className="chips static">{e.routines.map((r) => <span className="chip on" key={r}>{r}</span>)}</p>
            )}
            {e.note && <p className="note">{e.note}</p>}
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div className="pager">
          <button className="btn secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Newer</button>
          <span className="muted">Page {page} of {pages}</span>
          <button className="btn secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Older →</button>
        </div>
      )}
    </section>
  );
}
