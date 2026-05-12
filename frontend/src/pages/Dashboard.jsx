import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../services/api";
import "./pages.css";
import "./Dashboard.css";

const QUICK_LINKS = [
  {
    label: "Anuncios",
    desc: "Comunicados internos",
    path: "/announcements",
    roles: ["admin", "editor", "viewer"],
    color: "#2563eb",
  },
  {
    label: "Directorio",
    desc: "Empleados de la empresa",
    path: "/directory",
    roles: ["admin", "editor", "viewer"],
    color: "#0891b2",
  },
  {
    label: "CFDI Dashboard",
    desc: "Análisis financiero",
    path: "/cfdi/dashboard",
    roles: ["admin", "editor"],
    color: "#7c3aed",
  },
  {
    label: "CFDI Emitidos",
    desc: "Facturas emitidas",
    path: "/cfdi/emitidos",
    roles: ["admin", "editor"],
    color: "#16a34a",
  },
  {
    label: "CFDI Recibidos",
    desc: "Facturas recibidas",
    path: "/cfdi/recibidos",
    roles: ["admin", "editor"],
    color: "#d97706",
  },
  {
    label: "Estadísticas",
    desc: "Métricas del directorio",
    path: "/directory/stats",
    roles: ["admin", "editor"],
    color: "#dc2626",
  },
];

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setUser(decoded);
    } catch {
      /* invalid token */
    }
  }, []);

  if (!user) {
    return (
      <div className="page-loading">
        <span>Cargando...</span>
      </div>
    );
  }

  const roleLabel = { admin: "Administrador", editor: "Editor", viewer: "Visualizador" }[user.role] ?? user.role;
  const userInitial = user.email?.[0]?.toUpperCase() ?? "U";
  const visibleLinks = QUICK_LINKS.filter((l) => l.roles.includes(user.role));

  return (
    <div className="page">
      {/* Welcome header */}
      <div className="dash-welcome">
        <div className="dash-welcome__avatar">{userInitial}</div>
        <div>
          <h1 className="dash-welcome__title">Bienvenido de vuelta</h1>
          <p className="dash-welcome__email">{user.email}</p>
        </div>
        <span className={`badge badge--${user.role} dash-welcome__badge`}>{roleLabel}</span>
      </div>

      {/* Quick access grid */}
      <p className="section-title" style={{ marginTop: "2rem" }}>Acceso rápido</p>
      <div className="dash-grid">
        {visibleLinks.map((link) => (
          <button
            key={link.path}
            className="dash-card"
            onClick={() => navigate(link.path)}
            style={{ "--card-accent": link.color }}
          >
            <div className="dash-card__dot" />
            <p className="dash-card__label">{link.label}</p>
            <p className="dash-card__desc">{link.desc}</p>
          </button>
        ))}
      </div>

      {/* Admin actions */}
      {user.role === "admin" && (
        <>
          <p className="section-title" style={{ marginTop: "2.5rem" }}>Administración</p>
          <div className="dash-admin-row">
            <button className="btn btn--secondary" onClick={() => navigate("/admin")}>
              Gestión de usuarios
            </button>
            <button className="btn btn--secondary" onClick={() => navigate("/register")}>
              Registrar usuario
            </button>
            <button className="btn btn--secondary" onClick={() => navigate("/settings")}>
              Configurar etiquetas
            </button>
          </div>
        </>
      )}
      {(user.role === "admin" || user.role === "editor") && (
        <>
          <p className="section-title" style={{ marginTop: "2.5rem" }}>Crear contenido</p>
          <div className="dash-admin-row">
            <button className="btn btn--primary" onClick={() => navigate("/new")}>
              Nuevo anuncio
            </button>
            <button className="btn btn--secondary" onClick={() => navigate("/directory/new")}>
              Agregar empleado
            </button>
          </div>
        </>
      )}
    </div>
  );
}
