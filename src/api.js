const API_URL = import.meta.env.VITE_API_URL || '';

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

export const api = {
  register: (values) => request('/auth/register', { method: 'POST', body: JSON.stringify(values) }),
  login: (values) => request('/auth/login', { method: 'POST', body: JSON.stringify(values) }),
  listTasks: (token) => request('/tasks', { token }),
  createTask: (token, values) => request('/tasks', { token, method: 'POST', body: JSON.stringify(values) }),
  updateTask: (token, id, values) => request(`/tasks/${id}`, { token, method: 'PATCH', body: JSON.stringify(values) }),
  deleteTask: (token, id) => request(`/tasks/${id}`, { token, method: 'DELETE' }),
};
