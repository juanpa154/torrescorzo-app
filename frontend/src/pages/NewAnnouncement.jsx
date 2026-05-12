import { useState } from "react";
import { createAnnouncement } from "../services/api";
import { useNavigate } from "react-router-dom";
import "./pages.css";

export default function NewAnnouncement() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await createAnnouncement(title, content);
      if (res.id) {
        setStatus({ type: "success", msg: "Anuncio publicado correctamente." });
        setTitle("");
        setContent("");
        setTimeout(() => navigate("/announcements"), 1200);
      } else {
        setStatus({ type: "error", msg: res.message || "Error al crear el anuncio." });
      }
    } catch {
      setStatus({ type: "error", msg: "Error de conexión." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page--narrow">
      <div className="page-header">
        <div>
          <h1 className="page-title">Nuevo Anuncio</h1>
          <p className="page-subtitle">Publica un comunicado para toda la organización</p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="form-group">
              <label className="form-label" htmlFor="ann-title">Título</label>
              <input
                id="ann-title"
                className="form-input"
                type="text"
                placeholder="Asunto del comunicado"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="ann-content">Contenido</label>
              <textarea
                id="ann-content"
                className="form-textarea"
                rows="6"
                placeholder="Escribe el mensaje del anuncio..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            {status && (
              <div className={`alert alert--${status.type === "success" ? "success" : "error"}`}>
                {status.msg}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button type="submit" className="btn btn--primary" disabled={loading}>
                {loading ? "Publicando..." : "Publicar anuncio"}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => navigate("/announcements")}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
