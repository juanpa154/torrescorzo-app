import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";

const MENU_GROUPS = [
  {
    id: "anuncios",
    label: "Anuncios",
    roles: ["admin", "editor", "viewer"],
    items: [
      { label: "Ver Anuncios", path: "/announcements", roles: ["admin", "editor", "viewer"] },
      { label: "Nuevo Anuncio", path: "/new", roles: ["admin", "editor"] },
    ],
  },
  {
    id: "directorio",
    label: "Directorio",
    roles: ["admin", "editor", "viewer"],
    items: [
      { label: "Ver Directorio", path: "/directory", roles: ["admin", "editor", "viewer"] },
      { label: "Agregar Empleado", path: "/directory/new", roles: ["admin", "editor"] },
      { label: "Estadísticas", path: "/directory/stats", roles: ["admin", "editor"] },
      { label: "Etiquetas", path: "/settings", roles: ["admin", "editor"] },
    ],
  },
  {
    id: "cfdi",
    label: "CFDI",
    roles: ["admin", "editor"],
    items: [
      { label: "Dashboard", path: "/cfdi/dashboard", roles: ["admin", "editor"] },
      { label: "Emitidos", path: "/cfdi/emitidos", roles: ["admin", "editor"] },
      { label: "Recibidos", path: "/cfdi/recibidos", roles: ["admin", "editor"] },
    ],
  },
  {
    id: "dms",
    label: "DMS",
    roles: ["admin", "editor", "ventas", "servicio", "contador", "gerente", "consulta", "viewer"],
    items: [
      { label: "Registro de Códigos", path: "/codigos", roles: ["admin", "editor", "ventas", "servicio", "contador", "gerente", "consulta", "viewer"] },
    ],
  },
];

function hasAccess(roles, userRole) {
  return roles.includes(userRole);
}

const ChevronIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 20 20"
    fill="currentColor"
    width="13"
    height="13"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0L5.21 8.29a.75.75 0 01.02-1.08z"
      clipRule="evenodd"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="16"
    height="16"
    aria-hidden="true"
  >
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default function Navbar({ user, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const navRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname]);

  function handleLogout() {
    onLogout();
    navigate("/");
  }

  function toggleMobileGroup(id) {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (!user) return null;

  const userInitial = user.email?.[0]?.toUpperCase() ?? "U";
  const roleLabel = { admin: "Admin", editor: "Editor", viewer: "Usuario" }[user.role] ?? user.role;

  return (
    <nav className="tc-navbar" ref={navRef}>
      <div className="tc-navbar__inner">
        {/* Brand */}
        <Link to="/dashboard" className="tc-navbar__brand">
          <div className="tc-navbar__logo-mark">
            <span className="tc-navbar__logo-letters">TC</span>
          </div>
          <div className="tc-navbar__brand-text">
            <span className="tc-navbar__brand-grupo">Grupo</span>
            <span className="tc-navbar__brand-name">Torres Corzo</span>
          </div>
        </Link>

        {/* Desktop navigation */}
        <div className="tc-navbar__links">
          <Link
            to="/dashboard"
            className={`tc-navbar__link${location.pathname === "/dashboard" ? " tc-navbar__link--active" : ""}`}
          >
            Inicio
          </Link>

          {MENU_GROUPS.map((group) => {
            if (!hasAccess(group.roles, user.role)) return null;
            const visibleItems = group.items.filter((i) =>
              hasAccess(i.roles, user.role)
            );
            if (!visibleItems.length) return null;

            const isGroupActive = visibleItems.some((i) =>
              location.pathname.startsWith(i.path)
            );
            const isOpen = openMenu === group.id;

            return (
              <div
                key={group.id}
                className="tc-navbar__dropdown-wrap"
                onMouseEnter={() => setOpenMenu(group.id)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button
                  className={`tc-navbar__link${isGroupActive ? " tc-navbar__link--active" : ""}`}
                  onClick={() => setOpenMenu(isOpen ? null : group.id)}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                >
                  {group.label}
                  <ChevronIcon
                    className={`tc-navbar__chevron${isOpen ? " tc-navbar__chevron--open" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="tc-navbar__dropdown" role="menu">
                    {visibleItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        role="menuitem"
                        className={`tc-navbar__dropdown-item${location.pathname === item.path ? " tc-navbar__dropdown-item--active" : ""}`}
                        onClick={() => setOpenMenu(null)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {user.role === "admin" && (
            <Link
              to="/admin"
              className={`tc-navbar__link${location.pathname === "/admin" ? " tc-navbar__link--active" : ""}`}
            >
              Admin
            </Link>
          )}
          {user.role === "admin" && (
            <Link
              to="/register"
              className={`tc-navbar__link${location.pathname === "/register" ? " tc-navbar__link--active" : ""}`}
            >
              Registro
            </Link>
          )}
        </div>

        {/* User + logout */}
        <div className="tc-navbar__user">
          <div className="tc-navbar__user-info">
            <div className="tc-navbar__avatar" aria-hidden="true">
              {userInitial}
            </div>
            <div className="tc-navbar__user-details">
              <span className="tc-navbar__user-email">{user.email}</span>
              <span className={`tc-navbar__role-badge tc-navbar__role-badge--${user.role}`}>
                {roleLabel}
              </span>
            </div>
          </div>
          <button
            className="tc-navbar__logout"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogoutIcon />
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="tc-navbar__hamburger"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
        >
          <span className={`tc-navbar__ham-line${mobileOpen ? " tc-navbar__ham-line--1-open" : ""}`} />
          <span className={`tc-navbar__ham-line${mobileOpen ? " tc-navbar__ham-line--2-open" : ""}`} />
          <span className={`tc-navbar__ham-line${mobileOpen ? " tc-navbar__ham-line--3-open" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="tc-navbar__mobile">
          <Link to="/dashboard" className="tc-navbar__mobile-link">
            Inicio
          </Link>

          {MENU_GROUPS.map((group) => {
            if (!hasAccess(group.roles, user.role)) return null;
            const visibleItems = group.items.filter((i) =>
              hasAccess(i.roles, user.role)
            );
            if (!visibleItems.length) return null;
            const expanded = !!expandedGroups[group.id];

            return (
              <div key={group.id}>
                <button
                  className="tc-navbar__mobile-group-btn"
                  onClick={() => toggleMobileGroup(group.id)}
                  aria-expanded={expanded}
                >
                  {group.label}
                  <ChevronIcon
                    className={`tc-navbar__chevron${expanded ? " tc-navbar__chevron--open" : ""}`}
                  />
                </button>
                {expanded && (
                  <div className="tc-navbar__mobile-sub">
                    {visibleItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className="tc-navbar__mobile-sublink"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {user.role === "admin" && (
            <Link to="/admin" className="tc-navbar__mobile-link">
              Admin
            </Link>
          )}
          {user.role === "admin" && (
            <Link to="/register" className="tc-navbar__mobile-link">
              Registro
            </Link>
          )}

          <div className="tc-navbar__mobile-user">
            <div className="tc-navbar__avatar" aria-hidden="true">
              {userInitial}
            </div>
            <div>
              <div className="tc-navbar__user-email">{user.email}</div>
              <span className={`tc-navbar__role-badge tc-navbar__role-badge--${user.role}`}>
                {roleLabel}
              </span>
            </div>
            <button
              className="tc-navbar__logout tc-navbar__logout--mobile"
              onClick={handleLogout}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
