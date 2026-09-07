const API_URL = import.meta.env.VITE_API_URL ?? '/api';

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export const getToken = () => localStorage.getItem('token');

export const register = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
};

export const createAnnouncement = async (title, content) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/announcements`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ title, content }),
  });
  return res.json();
};

export const fetchAnnouncements = async () => {
  const token = getToken();
  const res = await fetch(`${API_URL}/announcements`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const fetchUsers = async () => {
  const token = getToken();
  const res = await fetch(`${API_URL}/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const updateUserRole = async (id, role) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/users/${id}/role`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ role }),
  });
  return res.json();
};

export const fetchEmployees = async () => {
  const token = getToken();
  const res = await fetch(`${API_URL}/employees`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const createEmployee = async (employeeData) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/employees`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(employeeData),
  });
  return res.json();
};

export const updateEmployee = async (id, employeeData) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(employeeData),
  });
  return res.json();
};

export const deleteEmployee = async (id) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/employees/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const fetchSettings = async () => {
  const token = getToken();
  const res = await fetch(`${API_URL}/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const addAgency = async (name) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/settings/agency`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  return res.json();
};

export const addLocation = async (name) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/settings/location`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ name }),
  });
  return res.json();
};

export const deleteAgency = async (id) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/settings/agency/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const deleteLocation = async (id) => {
  const token = getToken();
  const res = await fetch(`${API_URL}/settings/location/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const fetchVencimientos = async (filters) => {
  const token = getToken();
  const query = new URLSearchParams(filters).toString();
  const res = await fetch(`${API_URL}/vencimientos?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

// ─── Códigos (FrmCodigos) ─────────────────────────────────────────────────────

const CODIGOS_BASE = `${API_URL}/v1/codigos`;

const schemaQ = (schema) => schema ? `?schema=${encodeURIComponent(schema)}` : '';
const appendSchema = (params, schema) => { if (schema) params.schema = schema; };

export const fetchCodigosCatalogos = async (schema = null) => {
  const token = getToken();
  const res = await fetch(`${CODIGOS_BASE}/catalogos${schemaQ(schema)}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

export const fetchColoniasPorCp = async (cp, schema = null) => {
  const token = getToken();
  const params = { cp };
  appendSchema(params, schema);
  const res = await fetch(`${CODIGOS_BASE}/catalogos/colonias?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

export const fetchSiguienteCodigo = async (schema = null) => {
  const token = getToken();
  const res = await fetch(`${CODIGOS_BASE}/siguiente${schemaQ(schema)}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

export const buscarCodigos = async (q, tipo = 'nombre', limit = 20, offset = 0, schema = null) => {
  const token = getToken();
  const params = { q, tipo, limit, offset };
  appendSchema(params, schema);
  const res = await fetch(`${CODIGOS_BASE}/buscar?${new URLSearchParams(params)}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

export const fetchCodigo = async (codigo, schema = null) => {
  const token = getToken();
  const res = await fetch(`${CODIGOS_BASE}/${codigo}${schemaQ(schema)}`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

export const createCodigo = async (data, schema = null) => {
  const token = getToken();
  const res = await fetch(`${CODIGOS_BASE}${schemaQ(schema)}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return { status: res.status, data: await res.json() };
};

export const confirmarCodigo = async (codigo, data, schema = null) => {
  const token = getToken();
  const res = await fetch(`${CODIGOS_BASE}/${codigo}/confirmar${schemaQ(schema)}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return { status: res.status, data: await res.json() };
};

export const updateCodigo = async (codigo, data, schema = null) => {
  const token = getToken();
  const res = await fetch(`${CODIGOS_BASE}/${codigo}${schemaQ(schema)}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return { status: res.status, data: await res.json() };
};

export const updateCodigoNombre = async (codigo, data, schema = null) => {
  const token = getToken();
  const res = await fetch(`${CODIGOS_BASE}/${codigo}/nombre${schemaQ(schema)}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
  return { status: res.status, data: await res.json() };
};

export const fetchCodigoImagen = async (codigo, schema = null) => {
  const token = getToken();
  const res = await fetch(`${CODIGOS_BASE}/${codigo}/imagen${schemaQ(schema)}`, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 404) return null;
  return res.json();
};

export const uploadCodigoImagen = async (codigo, imagenBase64, schema = null) => {
  const token = getToken();
  const res = await fetch(`${CODIGOS_BASE}/${codigo}/imagen${schemaQ(schema)}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ imagen: imagenBase64 }),
  });
  return res.json();
};
