import { useEffect, useState } from "react";
import {
  fetchSettings, addAgency, addLocation, deleteAgency, deleteLocation,
} from "../services/api";
import "./pages.css";
import "./SettingsPanel.css";

function TagList({ title, items, newValue, onChangeNew, onAdd, onDelete, placeholder }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <span className="badge badge--viewer" style={{ marginLeft: "auto" }}>
          {items.length} registros
        </span>
      </div>
      <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            className="form-input"
            value={newValue}
            onChange={(e) => onChangeNew(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onAdd())}
          />
          <button className="btn btn--primary" onClick={onAdd} style={{ flexShrink: 0 }}>
            + Agregar
          </button>
        </div>

        {items.length === 0 ? (
          <div className="empty-state" style={{ padding: "1rem" }}>Sin registros aún</div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {items.map((item) => (
              <li key={item.id} className="settings-tag-item">
                <span className="settings-tag-name">{item.name}</span>
                <button
                  className="btn btn--danger btn--sm"
                  onClick={async () => {
                    if (window.confirm(`¿Eliminar "${item.name}"?`)) {
                      await onDelete(item.id);
                    }
                  }}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function SettingsPanel() {
  const [agencies, setAgencies] = useState([]);
  const [locations, setLocations] = useState([]);
  const [newAgency, setNewAgency] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const loadData = async () => {
    try {
      const res = await fetchSettings();
      setAgencies(res.agencies ?? []);
      setLocations(res.locations ?? []);
    } catch { /* API error — leave lists empty */ }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddAgency = async () => {
    if (!newAgency.trim()) return;
    await addAgency(newAgency.trim());
    setNewAgency("");
    loadData();
  };

  const handleAddLocation = async () => {
    if (!newLocation.trim()) return;
    await addLocation(newLocation.trim());
    setNewLocation("");
    loadData();
  };

  const handleDeleteAgency = async (id) => {
    await deleteAgency(id);
    loadData();
  };

  const handleDeleteLocation = async (id) => {
    await deleteLocation(id);
    loadData();
  };

  return (
    <div className="page" style={{ maxWidth: "800px" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Configurar <span>Etiquetas</span></h1>
          <p className="page-subtitle">Administra agencias y ubicaciones del directorio</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <TagList
          title="Agencias"
          items={agencies}
          newValue={newAgency}
          onChangeNew={setNewAgency}
          onAdd={handleAddAgency}
          onDelete={handleDeleteAgency}
          placeholder="Nueva agencia..."
        />
        <TagList
          title="Ubicaciones"
          items={locations}
          newValue={newLocation}
          onChangeNew={setNewLocation}
          onAdd={handleAddLocation}
          onDelete={handleDeleteLocation}
          placeholder="Nueva ubicación..."
        />
      </div>
    </div>
  );
}
