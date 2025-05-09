import { useEffect, useState } from "react";
import {
  fetchSettings,
  addAgency,
  addLocation,
  deleteAgency,
  deleteLocation
} from "../services/api";

export default function SettingsPanel() {
  const [agencies, setAgencies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [newAgency, setNewAgency] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const loadData = async () => {
    const res = await fetchSettings();
    setAgencies(res.agencies);
    setLocations(res.locations);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddAgency = async () => {
    if (!newAgency.trim()) return;
    await addAgency(newAgency);
    setNewAgency("");
    loadData();
  };

  const handleAddLocation = async () => {
    if (!newLocation.trim()) return;
    await addLocation(newLocation);
    setNewLocation("");
    loadData();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Gestión de Agencias y Ubicaciones</h2>

      {/* Agencias */}
      <section className="mb-6">
        <h3 className="font-semibold text-lg mb-2">Agencias</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newAgency}
            onChange={(e) => setNewAgency(e.target.value)}
            placeholder="Nueva agencia"
            className="p-2 border w-full"
          />
          <button onClick={handleAddAgency} className="bg-blue-600 text-white px-4 rounded">
            Agregar
          </button>
        </div>
        <ul className="space-y-2">
          {agencies.map((a) => (
            <li key={a.id} className="flex justify-between items-center border p-2 rounded">
              <span>{a.name}</span>
              <button
                onClick={async () => {
                  if (confirm("¿Eliminar esta agencia?")) {
                    await deleteAgency(a.id);
                    loadData();
                  }
                }}
                className="text-sm bg-red-500 text-white px-2 py-1 rounded"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Ubicaciones */}
      <section>
        <h3 className="font-semibold text-lg mb-2">Ubicaciones</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
            placeholder="Nueva ubicación"
            className="p-2 border w-full"
          />
          <button onClick={handleAddLocation} className="bg-blue-600 text-white px-4 rounded">
            Agregar
          </button>
        </div>
        <ul className="space-y-2">
          {locations.map((l) => (
            <li key={l.id} className="flex justify-between items-center border p-2 rounded">
              <span>{l.name}</span>
              <button
                onClick={async () => {
                  if (confirm("¿Eliminar esta ubicación?")) {
                    await deleteLocation(l.id);
                    loadData();
                  }
                }}
                className="text-sm bg-red-500 text-white px-2 py-1 rounded"
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
