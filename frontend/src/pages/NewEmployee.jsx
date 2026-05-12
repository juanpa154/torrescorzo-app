import { useState, useEffect } from "react";
import { createEmployee, fetchSettings } from "../services/api";
import { useNavigate } from "react-router-dom";
import "./pages.css";

const EMPTY_FORM = { name: "", email: "", phone: "", position: "", location: "", agency: "" };

export default function NewEmployee() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [agencies, setAgencies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSettings().then((res) => {
      setAgencies(res.agencies ?? []);
      setLocations(res.locations ?? []);
    });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await createEmployee(form);
      if (res.id) {
        setStatus({ type: "success", msg: "Empleado creado correctamente." });
        setForm(EMPTY_FORM);
        setTimeout(() => navigate("/directory"), 1200);
      } else {
        setStatus({ type: "error", msg: res.message || "Error al crear el empleado." });
      }
    } catch {
      setStatus({ type: "error", msg: "Error de conexión." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--narrow">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nuevo <span>Empleado</span></h1>
          <p className="page-subtitle">Registra un nuevo colaborador en el directorio</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="emp-name">Nombre completo</label>
                <input id="emp-name" name="name" className="form-input" placeholder="Nombre Apellido"
                  value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="emp-pos">Puesto</label>
                <input id="emp-pos" name="position" className="form-input" placeholder="Ej: Asesor de ventas"
                  value={form.position} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="emp-email">Correo electrónico</label>
              <input id="emp-email" name="email" type="email" className="form-input"
                placeholder="empleado@torrescorzo.com" value={form.email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="emp-phone">Teléfono</label>
              <input id="emp-phone" name="phone" className="form-input" placeholder="Opcional"
                value={form.phone} onChange={handleChange} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label" htmlFor="emp-location">Ubicación</label>
                <select id="emp-location" name="location" className="form-select"
                  value={form.location} onChange={handleChange} required>
                  <option value="">Selecciona...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="emp-agency">Agencia</label>
                <select id="emp-agency" name="agency" className="form-select"
                  value={form.agency} onChange={handleChange} required>
                  <option value="">Selecciona...</option>
                  {agencies.map((a) => (
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
                {loading ? "Guardando..." : "Crear empleado"}
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
