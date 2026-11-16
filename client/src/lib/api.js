const BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(status, code, message, details = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(BASE + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check that it is running and try again.');
  }
  if (res.status === 204) return null;

  let body = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    const e = body?.error;
    throw new ApiError(res.status, e?.code || 'ERROR', e?.message || `Request failed (${res.status})`, e?.details || []);
  }
  return body;
}

const qs = (params) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null)).toString();
  return s ? `?${s}` : '';
};

export const api = {
  listEntries: (params = {}) => request(`/entries${qs(params)}`),
  create: (entry) => request('/entries', { method: 'POST', body: JSON.stringify(entry) }),
  update: (id, entry) => request(`/entries/${id}`, { method: 'PUT', body: JSON.stringify(entry) }),
  remove: (id) => request(`/entries/${id}`, { method: 'DELETE' }),
  insights: (days, to) => request(`/insights${qs({ days, to })}`),
};
