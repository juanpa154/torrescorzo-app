import { useEffect, useState } from "react";
import { fetchEmployees, deleteEmployee } from "../services/api";
import { useNavigate } from "react-router-dom";
import { exportEmployeesToExcel } from "../utils/exportToExcel";


export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      setUser(decoded);
    }

    const load = async () => {
      const data = await fetchEmployees();
      setEmployees(data);
    };
    load();
  }, []);

  const filtered = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("¿Eliminar este empleado?");
    if (confirmDelete) {
      await deleteEmployee(id);
      setEmployees(employees.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Directorio de Empleados</h2>
      {user?.role !== "viewer" && (
      <button
        onClick={() => exportEmployeesToExcel(employees)}
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded"
      >
        Exportar a Excel
      </button>
      )}

      <input
        type="text"
        placeholder="Buscar por nombre"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-6 p-2 border w-full max-w-md"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((emp) => (
          <div key={emp.id} className="p-4 border rounded shadow bg-white">
            <h3 className="font-bold text-lg">{emp.name}</h3>
            <p className="text-sm text-gray-700">{emp.position}</p>
            <p className="text-sm text-gray-500">{emp.email}</p>
            {emp.phone && <p className="text-sm text-gray-500">{emp.phone}</p>}
            {emp.location && (
              <p className="text-sm text-gray-400">📍 {emp.location}</p>
            )}
            <p className="text-sm text-gray-400">🏢 {emp.agency}</p>

            {user?.role === "admin" && (
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => navigate(`/directory/edit/${emp.id}`)}
                  className="text-sm px-2 py-1 bg-yellow-400 text-white rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(emp.id)}
                  className="text-sm px-2 py-1 bg-red-600 text-white rounded"
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="text-gray-500 col-span-full text-center">Sin resultados.</p>
        )}
      </div>
    </div>
  );
}
