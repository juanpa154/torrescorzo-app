import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../services/api";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const decoded = JSON.parse(atob(token.split(".")[1]));
    setUser(decoded);
  }, []);

  if (!user) return <p className="p-6">Cargando usuario...</p>;

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Bienvenido, {user.email}</h1>
      <p>Tu rol es: <strong>{user.role}</strong></p>

      <div className="space-y-2">
        {(user.role === "admin" || user.role === "editor") && (
          <button
            onClick={() => navigate("/new")}
            className="block w-full p-2 bg-blue-600 text-white rounded"
          >
            Crear nuevo anuncio
          </button>
        )}

        <button
          onClick={() => navigate("/announcements")}
          className="block w-full p-2 bg-green-600 text-white rounded"
        >
          Ver anuncios
        </button>

        {user.role === "admin" && (
          <button
            onClick={() => alert("Opción solo para admins")}
            className="block w-full p-2 bg-red-600 text-white rounded"
          >
            Panel de administración
          </button>
        )}
      </div>
    </div>
  );
}
