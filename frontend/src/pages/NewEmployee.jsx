import { useState } from "react";
import { useEffect } from "react"; 
import { createEmployee } from "../services/api";
import { useNavigate } from "react-router-dom";
import { fetchSettings } from "../services/api";






export default function NewEmployee() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    position: "",
    location: "",
    agency: ""
  });

  const [message, setMessage] = useState("");
  const [agencies, setAgencies] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
      const loadSettings = async () => {
        const res = await fetchSettings();
        setAgencies(res.agencies);
        setLocations(res.locations);
      };
      loadSettings();
    }, []);

  
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await createEmployee(form);
    setLoading(false);

    if (res.id) {
      setMessage("Empleado creado ✅");
      setForm({
        name: "",
        email: "",
        phone: "",
        position: "",
        location: "",
        agency: ""
      });
      setTimeout(() => navigate("/directory"), 1000);
    } else {
      setMessage(res.message || "Error al crear empleado");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Nuevo Empleado</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="name"
          placeholder="Nombre"
          className="w-full p-2 border"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          name="email"
          type="email"
          placeholder="Correo"
          className="w-full p-2 border"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          name="phone"
          placeholder="Teléfono"
          className="w-full p-2 border"
          value={form.phone}
          onChange={handleChange}
        />
        <input
          name="position"
          placeholder="Puesto"
          className="w-full p-2 border"
          value={form.position}
          onChange={handleChange}
          required
        />

        <select
          name="location"
          value={form.location}
          onChange={handleChange}
          className="w-full p-2 border"
          required
        >
          <option value="">Selecciona ubicación</option>
          {locations.map((l) => (
            <option key={l.id} value={l.name}>
              {l.name}
            </option>
          ))}

        </select>

        <select
          name="agency"
          value={form.agency}
          onChange={handleChange}
          className="w-full p-2 border"
          required
        >
          <option value="">Selecciona agencia</option>
          {agencies.map((a) => (
            <option key={a.id} value={a.name}>
              {a.name}
            </option>
          ))}

        </select>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white w-full p-2 rounded disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Crear empleado"}
        </button>
      </form>
      {message && <p className="text-center mt-4">{message}</p>}
    </div>
  );
}
