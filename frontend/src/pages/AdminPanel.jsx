import { useEffect, useState } from "react";
import { fetchUsers, updateUserRole } from "../services/api";
import "./pages.css";

const ROLE_OPTIONS = ["viewer", "editor", "admin"];

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch { /* API error — leave users empty */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (id, role) => {
    await updateUserRole(id, role);
    loadUsers();
  };

  const filteredUsers = users.filter((u) => {
    const matchEmail = u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchEmail && matchRole;
  });

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestión de <span>Usuarios</span></h1>
          <p className="page-subtitle">Administra roles y permisos del sistema</p>
        </div>
        <div className="filter-row">
          <div className="search-bar">
            <svg className="search-bar__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "240px" }}
            />
          </div>
          <select
            className="form-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ width: "160px" }}
          >
            <option value="all">Todos los roles</option>
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="page-loading">Cargando usuarios...</div>
        ) : (
          <div className="table-wrap" style={{ borderRadius: "var(--p-radius)", border: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Correo electrónico</th>
                  <th style={{ width: "140px", textAlign: "center" }}>Rol actual</th>
                  <th style={{ width: "180px", textAlign: "center" }}>Cambiar rol</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`badge badge--${u.role}`}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <select
                        className="form-select"
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{ width: "140px", margin: "0 auto" }}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="3">
                      <div className="empty-state">No se encontraron usuarios.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
