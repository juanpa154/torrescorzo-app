import { useEffect, useState } from "react";
import { fetchEmployees } from "../services/api";

export default function EmployeeDirectory() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const load = async () => {
      const data = await fetchEmployees();
      setEmployees(data);
    };
    load();
  }, []);

  const filtered = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Directorio de Empleados</h2>
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
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-500 col-span-full text-center">Sin resultados.</p>
        )}
      </div>
    </div>
  );
}
