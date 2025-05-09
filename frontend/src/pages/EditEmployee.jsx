import { useState, useEffect } from "react";
import { updateEmployee, fetchEmployees } from "../services/api";
import { useNavigate, useParams } from "react-router-dom";
import { fetchSettings } from "../services/api";



export default function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [message, setMessage] = useState("");
  const [agencies, setAgencies] = useState([]);
  const [locations, setLocations] = useState([]);
  


  useEffect(() => {
  const load = async () => {
    const employees = await fetchEmployees();
    const emp = employees.find(e => e.id === parseInt(id));
    if (emp) setForm(emp);

    const settings = await fetchSettings();
    setAgencies(settings.agencies);
    setLocations(settings.locations);
  };

  load();
}, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await updateEmployee(id, form);
    if (res.id) {
      setMessage("Empleado actualizado ✅");
      setTimeout(() => navigate("/directory"), 1000);
    } else {
      setMessage("Error al actualizar");
    }
  };

  
  if (!form) return <p className="p-6">Cargando...</p>;
  
  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Editar Empleado</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" placeholder="Nombre" className="w-full p-2 border"
          value={form.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Correo" className="w-full p-2 border"
          value={form.email} onChange={handleChange} required />
        <input name="phone" placeholder="Teléfono" className="w-full p-2 border"
          value={form.phone} onChange={handleChange} />
        <input name="position" placeholder="Puesto" className="w-full p-2 border"
          value={form.position} onChange={handleChange} required />
        <select
          name="location"
          value={form.location}
          onChange={handleChange}
          className="w-full p-2 border"
        >
          <option value="">Selecciona ubicación</option>
          {locations
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((l) => (
              <option key={l.id} value={l.name}>{l.name}</option>
          ))}

        </select>
         
        <select
          name="agency"
          value={form.agency}
          onChange={handleChange}
          required
          className="w-full p-2 border"
        >
          <option value="">Selecciona agencia</option>
          {agencies
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((a) => (
              <option key={a.id} value={a.name}>{a.name}</option>
          ))}

        </select>


        <button type="submit" className="bg-blue-600 text-white w-full p-2 rounded">
          Guardar cambios
        </button>
      </form>
      {message && <p className="text-center mt-4">{message}</p>}
    </div>
  );
}
