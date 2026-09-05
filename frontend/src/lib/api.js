const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8787';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}

export const api = {
  health: () => request('/api/health'),

  createPipeline: () => request('/api/pipelines', { method: 'POST', body: JSON.stringify({}) }),
  getPipeline: (id) => request(`/api/pipelines/${id}`),
  updatePipeline: (id, graph_json) =>
    request(`/api/pipelines/${id}`, { method: 'PUT', body: JSON.stringify({ graph_json }) }),

  uploadFiles: (fileList) => {
    const form = new FormData();
    for (const f of fileList) form.append('files', f);
    return request('/api/uploads', { method: 'POST', body: form });
  },

  proposeDirections: (brief) =>
    request('/api/jobs/propose-directions', {
      method: 'POST',
      body: JSON.stringify({ brief }),
    }),

  listJobs: () => request('/api/jobs'),
  createJob: (payload) => request('/api/jobs', { method: 'POST', body: JSON.stringify(payload) }),
  runJob: (jobId) => request(`/api/jobs/${jobId}/run`, { method: 'POST' }),
  getJob: (jobId) => request(`/api/jobs/${jobId}`),
  retryVariant: (jobId, itemId, variantId) =>
    request(`/api/jobs/${jobId}/items/${itemId}/variants/${variantId}/retry`, { method: 'POST' }),
  patchVariant: (jobId, itemId, variantId, patch) =>
    request(`/api/jobs/${jobId}/items/${itemId}/variants/${variantId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),
  exportCampaign: (jobId) => request(`/api/jobs/${jobId}/export`, { method: 'POST' }),
};
