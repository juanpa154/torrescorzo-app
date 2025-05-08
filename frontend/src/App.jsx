import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Announcements from "./pages/Announcements";
import PrivateRoute from "./components/PrivateRoute";
import NewAnnouncement from "./pages/NewAnnouncement";


export default function App() {
  return (
    <BrowserRouter>
      <nav className="p-4 bg-gray-100 flex gap-4">
        <Link to="/">Login</Link>
        <Link to="/register">Registro</Link>
        <Link to="/announcements">Anuncios</Link>
        <Link to="/new">Nuevo Anuncio</Link>

      </nav>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
              <PrivateRoute>
                <NewAnnouncement />
              </PrivateRoute>
          }
          />

      </Routes>
    </BrowserRouter>
  );
}
