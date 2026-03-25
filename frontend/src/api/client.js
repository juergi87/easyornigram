const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Fehler');
  }
  return res.json();
}

export const api = {
  // Auth
  login: (pin) => request('/auth/login', { method: 'POST', body: JSON.stringify({ pin }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  authStatus: () => request('/auth/status'),

  // Projects
  getProjects: () => request('/projects'),
  getProject: (id) => request(`/projects/${id}`),
  createProject: (name) => request('/projects', { method: 'POST', body: JSON.stringify({ name }) }),
  updateProject: (id, name) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify({ name }) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  saveGraph: (id, nodes, edges) =>
    request(`/projects/${id}/graph`, { method: 'PUT', body: JSON.stringify({ nodes, edges }) }),
  exportProject: (id) => `${BASE}/projects/${id}/export`,
  importProject: (data) => request('/projects/import', { method: 'POST', body: JSON.stringify(data) })
};
