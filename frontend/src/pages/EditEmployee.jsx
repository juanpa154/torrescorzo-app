import { useState, useEffect } from "react";
import { updateEmployee, fetchEmployees, fetchSettings } from "../services/api";
import { useNavigate, useParams } from "react-router-dom";
import "./pages.css";

export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [employees, settings] = await Promise.all([
          fetchEmployees(),
          fetchSettings(),
        ]);
        const emp = employees.find((e) => e.id === parseInt(id));
        if (emp) setForm(emp);
        setAgencies(settings.agencies ?? []);
        setLocations(settings.locations ?? []);
      } catch {
        setStatus({ type: "error", msg: "Error al cargar los datos. Intenta de nuevo." });
        setForm({});
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await updateEmployee(id, form);
      if (res.id) {
        setStatus({ type: "success", msg: "Empleado actualizado correctamente." });
        setTimeout(() => navigate("/directory"), 1200);
      } else {
        setStatus({ type: "error", msg: "Error al actualizar el empleado." });
      }
    } catch {
      setStatus({ type: "error", msg: "Error de conexión." });
    } finally {
      setLoading(false);
    }
  };

  if (!form) {
    return <div className="page-loading">Cargando empleado...</div>;
  }

  return (
    <div className="page page--narrow">
      <div className="page-header">
        <div>
          <h1 className="page-title">Editar <span>Empleado</span></h1>
          <p className="page-subtitle">{form.name}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="emp-name">Nombre completo</label>
                <input id="emp-name" name="name" className="form-input"
                  value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="emp-pos">Puesto</label>
                <input id="emp-pos" name="position" className="form-input"
                  value={form.position} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="emp-email">Correo electrónico</label>
              <input id="emp-email" name="email" type="email" className="form-input"
                value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="emp-phone">Teléfono</label>
              <input id="emp-phone" name="phone" className="form-input"
                value={form.phone ?? ""} onChange={handleChange} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="emp-location">Ubicación</label>
                <select id="emp-location" name="location" className="form-select"
                  value={form.location ?? ""} onChange={handleChange}>
                  <option value="">Selecciona...</option>
                  {[...locations].sort((a, b) => a.name.localeCompare(b.name)).map((l) => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="emp-agency">Agencia</label>
                <select id="emp-agency" name="agency" className="form-select"
                  value={form.agency ?? ""} onChange={handleChange} required>
                  <option value="">Selecciona...</option>
                  {[...agencies].sort((a, b) => a.name.localeCompare(b.name)).map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {status && (
              <div className={`alert alert--${status.type === "success" ? "success" : "error"}`}>
                {status.msg}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => navigate("/directory")}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
