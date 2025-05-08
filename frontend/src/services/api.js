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

