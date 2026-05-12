import { useEffect, useState } from "react";
import { fetchEmployees, deleteEmployee } from "../services/api";
import { useNavigate } from "react-router-dom";
import { exportEmployeesToExcel } from "../utils/exportToExcel";
import "./pages.css";
import "./EmployeeDirectory.css";

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        setUser(JSON.parse(atob(payload)));
      } catch { /* token malformado */ }
    }
    fetchEmployees()
      .then((data) => setEmployees(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este empleado?")) return;
    await deleteEmployee(id);
    setEmployees(employees.filter((e) => e.id !== id));
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Directorio de <span>Empleados</span></h1>
          <p className="page-subtitle">{employees.length} empleados registrados</p>
        </div>
        <div className="filter-row">
          <div className="search-bar">
            <svg className="search-bar__icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              className="form-input"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "220px" }}
            />
          </div>
          {user?.role !== "viewer" && (
            <button
              className="btn btn--success"
              onClick={() => exportEmployeesToExcel(employees)}
            >
              Exportar Excel
            </button>
          )}
          {(user?.role === "admin" || user?.role === "editor") && (
            <button
              className="btn btn--primary"
              onClick={() => navigate("/directory/new")}
            >
              + Agregar empleado
            </button>
          )}
        </div>
      </div>

      {loading && <div className="page-loading">Cargando directorio...</div>}

      {!loading && (
        <div className="emp-grid">
          {filtered.map((emp) => (
            <div key={emp.id} className="emp-card card">
              <div className="card-body emp-card__body">
                <div className="emp-card__avatar">
                  {emp.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="emp-card__info">
                  <h3 className="emp-card__name">{emp.name}</h3>
                  <p className="emp-card__position">{emp.position}</p>
                  <p className="emp-card__detail">{emp.email}</p>
                  {emp.phone && <p className="emp-card__detail">{emp.phone}</p>}
                  <div className="emp-card__tags">
                    {emp.location && (
                      <span className="emp-card__tag">{emp.location}</span>
                    )}
                    {emp.agency && (
                      <span className="emp-card__tag emp-card__tag--agency">{emp.agency}</span>
                    )}
                  </div>
                </div>
                {user?.role === "admin" && (
                  <div className="emp-card__actions">
                    <button
                      className="btn btn--secondary btn--sm"
                      onClick={() => navigate(`/directory/edit/${emp.id}`)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn--danger btn--sm"
                      onClick={() => handleDelete(emp.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="empty-state" style={{ gridColumn: "1/-1" }}>
              Sin resultados para "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
