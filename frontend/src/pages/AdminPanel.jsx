import { useEffect, useState } from "react";
import { fetchUsers, updateUserRole } from "../services/api";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const loadUsers = async () => {
    const data = await fetchUsers();
    setUsers(data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (id, role) => {
    await updateUserRole(id, role);
    loadUsers();
  };

  const filteredUsers = users.filter((u) => {
    const matchEmail = u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchEmail && matchRole;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Gestión de Usuarios</h2>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Buscar por correo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border w-full sm:w-1/2"
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="p-2 border w-full sm:w-1/4"
        >
          <option value="all">Todos los roles</option>
          <option value="viewer">viewer</option>
          <option value="editor">editor</option>
          <option value="admin">admin</option>
        </select>
      </div>

      {/* Tabla de usuarios */}
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">Correo</th>
            <th className="p-2 text-center">Rol actual</th>
            <th className="p-2 text-center">Cambiar rol</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.email}</td>
              <td className="p-2 text-center">{u.role}</td>
              <td className="p-2 text-center">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className="p-1 border"
                >
                  <option value="viewer">viewer</option>
                  <option value="editor">editor</option>
                  <option value="admin">admin</option>
                </select>
              </td>
            </tr>
          ))}
          {filteredUsers.length === 0 && (
            <tr>
              <td colSpan="3" className="p-4 text-center text-gray-500">
                No se encontraron usuarios.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
