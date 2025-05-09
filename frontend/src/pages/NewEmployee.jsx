import { useState } from "react";
import { createEmployee } from "../services/api";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createEmployee(form);
    if (res.id) {
      setMessage("Empleado creado ✅");
      setForm({ name: "", email: "", phone: "", position: "", location: "" });
      setTimeout(() => navigate("/directory"), 1000);
    } else {
      setMessage(res.message || "Error al crear empleado");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Nuevo Empleado</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" placeholder="Nombre" className="w-full p-2 border"
          value={form.name} onChange={handleChange} required />
        <input name="email" type="email" placeholder="Correo" className="w-full p-2 border"
          value={form.email} onChange={handleChange} required />
        <input name="phone" placeholder="Teléfono" className="w-full p-2 border"
          value={form.phone} onChange={handleChange} />
        <input name="position" placeholder="Puesto" className="w-full p-2 border"
          value={form.position} onChange={handleChange} required />
        <input name="location" placeholder="Ubicación" className="w-full p-2 border"
          value={form.location} onChange={handleChange} />
        <input name="agency" placeholder="Agencia" className="w-full p-2 border" 
            value={form.agency} onChange={handleChange} required/>

        <button type="submit" className="bg-blue-600 text-white w-full p-2 rounded">
          Crear empleado
        </button>
      </form>
      {message && <p className="text-center mt-4">{message}</p>}
    </div>
  );
}
