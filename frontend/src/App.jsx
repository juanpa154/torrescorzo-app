import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Announcements from "./pages/Announcements";
import PrivateRoute from "./components/PrivateRoute";
import NewAnnouncement from "./pages/NewAnnouncement";
import Dashboard from "./pages/Dashboard";
import RoleProtectedRoute from "./components/RoleProtectedRoute";
import { getToken } from "./services/api";
import AdminPanel from "./pages/AdminPanel";
import EmployeeDirectory from "./pages/EmployeeDirectory";
import NewEmployee from "./pages/NewEmployee";
import EditEmployee from "./pages/EditEmployee";
import SettingsPanel from "./pages/SettingsPanel";
import EmployeeStats from "./pages/EmployeeStats";






export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (token) {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setUser(decoded);
    }
  }, []);

  return (
    <BrowserRouter>
      <nav className="p-4 bg-gray-100 flex gap-4">
        {!user && <Link to="/">Login</Link>}
        {user?.role === "admin" && <Link to="/register">Registro</Link>}

        {user && <Link to="/dashboard">Dashboard</Link>}
        {user && <Link to="/announcements">Anuncios</Link>}

        {user && (user.role === "admin" || user.role === "editor") && (
          <Link to="/new">Nuevo Anuncio</Link>
        )}
        {user?.role === "admin" && <Link to="/admin">Admin</Link>}
        {user && <Link to="/directory">Directorio</Link>}
        {user && (user.role === "admin" || user.role === "editor") && (
          <Link to="/directory/new">Agregar empleado</Link>
         )}

        {user && (user.role === "admin" || user.role === "editor") && (
          <Link to="/settings">Configurar etiquetas</Link>
        )}

        {user && (user.role === "admin" || user.role === "editor") && (
          <Link to="/directory/stats">Estadísticas</Link>
        )}





      </nav>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/register"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <Register />
            </RoleProtectedRoute>
          }
        />

        <Route
          path="/announcements"
          element={
            <PrivateRoute>
              <Announcements />
            </PrivateRoute>
          }
        />
        <Route
          path="/new"
          element={
            <RoleProtectedRoute allowedRoles={["admin", "editor"]}>
              <NewAnnouncement />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      <Route
          path="/admin"
          element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
              <AdminPanel />
            </RoleProtectedRoute>
          }
      />
      <Route
        path="/directory"
        element={
          <PrivateRoute>
            <EmployeeDirectory />
          </PrivateRoute>
        }
      />
      <Route
        path="/directory/new"
        element={
          <RoleProtectedRoute allowedRoles={["admin", "editor"]}>
            <NewEmployee />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/directory/edit/:id"
        element={
          <RoleProtectedRoute allowedRoles={["admin"]}>
            <EditEmployee />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <RoleProtectedRoute allowedRoles={["admin", "editor"]}>
            <SettingsPanel />
          </RoleProtectedRoute>
        }
      />
      <Route
        path="/directory/stats"
        element={
           <RoleProtectedRoute allowedRoles={["admin", "editor"]}>
            <EmployeeStats />
          </RoleProtectedRoute>
        }
      />





      </Routes>
    </BrowserRouter>
  );
}


