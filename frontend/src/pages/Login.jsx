import { useState } from "react";
import { login } from "../services/api";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.token) {
        localStorage.setItem("token", res.token);
        const decoded = JSON.parse(atob(res.token.split(".")[1]));
        onLogin?.(decoded);
        navigate("/dashboard");
      } else {
        setMessage(res.message || "Credenciales incorrectas");
      }
    } catch {
      setMessage("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg" aria-hidden="true" />

      <div className="login-card">
        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo-mark">
            <span className="login-logo-letters">TC</span>
          </div>
          <div className="login-brand-text">
            <span className="login-brand-grupo">Grupo</span>
            <span className="login-brand-name">Torres Corzo</span>
          </div>
        </div>

        <h1 className="login-title">Bienvenido</h1>
        <p className="login-subtitle">Ingresa tus credenciales para continuar</p>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="login-field">
            <label htmlFor="email" className="login-label">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              className="login-input"
              placeholder="usuario@torrescorzo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className="login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {message && (
            <div className="login-error" role="alert">
              {message}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span className="login-btn-spinner" aria-hidden="true" />
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <p className="login-footer">
          Sistema interno &mdash; Grupo Torres Corzo
        </p>
      </div>
    </div>
  );
}
