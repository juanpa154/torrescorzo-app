const API_URL = "http://localhost:3000/api"; // cambia si usas deploy

export const register = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return await res.json();
};

export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return await res.json();
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const createAnnouncement = async (title, content) => {
  const token = getToken();
  const res = await fetch("http://localhost:3000/api/announcements", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content }),
  });
  return await res.json();
};

export const fetchUsers = async () => {
  const token = getToken();
  const res = await fetch("http://localhost:3000/api/users", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
};

export const updateUserRole = async (id, role) => {
  const token = getToken();
  const res = await fetch(`http://localhost:3000/api/users/${id}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ role })
  });
  return await res.json();
};

export const fetchEmployees = async () => {
  const token = getToken();
  const res = await fetch("http://localhost:3000/api/employees", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
};

export const createEmployee = async (employeeData) => {
  const token = getToken();
  const res = await fetch("http://localhost:3000/api/employees", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(employeeData),
  });
  return await res.json();
};

export const updateEmployee = async (id, employeeData) => {
  const token = getToken();
  const res = await fetch(`http://localhost:3000/api/employees/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(employeeData)
  });
  return await res.json();
};

export const deleteEmployee = async (id) => {
  const token = getToken();
  const res = await fetch(`http://localhost:3000/api/employees/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return await res.json();
};

export const fetchSettings = async () => {
  const token = getToken();
  const res = await fetch("http://localhost:3000/api/settings", {
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
};

export const addAgency = async (name) => {
  const token = getToken();
  const res = await fetch("http://localhost:3000/api/settings/agency", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name })
  });
  return await res.json();
};

export const addLocation = async (name) => {
  const token = getToken();
  const res = await fetch("http://localhost:3000/api/settings/location", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name })
  });
  return await res.json();
};

export const deleteAgency = async (id) => {
  const token = getToken();
  const res = await fetch(`http://localhost:3000/api/settings/agency/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
};

export const deleteLocation = async (id) => {
  const token = getToken();
  const res = await fetch(`http://localhost:3000/api/settings/location/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }
  });
  return await res.json();
};



