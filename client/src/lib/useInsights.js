import { useEffect, useState } from 'react';
import { api } from './api.js';
import { localToday } from './dates.js';

/** Loads /api/insights for a window of `days`, ending today (user's local date). */
export function useInsights(days, version) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .insights(days, localToday())
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [days, version]);

  return { data, error, loading };
}
