import { useState } from "react";
import { register } from "../services/api";
import { useNavigate } from "react-router-dom";
import "./pages.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await register(email, password);
      if (res.message?.toLowerCase().includes("exitoso") || res.id) {
        setStatus({ type: "success", msg: res.message || "Usuario registrado correctamente." });
        setEmail("");
        setPassword("");
      } else {
        setStatus({ type: "error", msg: res.message || "Error al registrar usuario." });
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
          <h1 className="page-title">Registrar <span>Usuario</span></h1>
          <p className="page-subtitle">Crea una nueva cuenta en el sistema</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Correo electrónico</label>
              <input
                id="reg-email"
                className="form-input"
                type="email"
                placeholder="usuario@torrescorzo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Contraseña</label>
              <input
                id="reg-password"
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            {status && (
              <div className={`alert alert--${status.type === "success" ? "success" : "error"}`}>
                {status.msg}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? "Registrando..." : "Crear cuenta"}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => navigate("/admin")}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
