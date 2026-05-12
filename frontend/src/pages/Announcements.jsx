import { useEffect, useState } from "react";
import "./pages.css";
import "./Announcements.css";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/announcements");
        const data = await res.json();
        setAnnouncements(data);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Anuncios</h1>
          <p className="page-subtitle">Comunicados internos de Grupo Torres Corzo</p>
        </div>
      </div>

      {loading && (
        <div className="page-loading">Cargando anuncios...</div>
      )}

      {!loading && announcements.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <span>Sin anuncios publicados</span>
          </div>
        </div>
      )}

      <div className="ann-list">
        {announcements.map((a) => (
          <article key={a.id} className="ann-card card">
            <div className="ann-card__accent" />
            <div className="card-body">
              <h3 className="ann-card__title">{a.title}</h3>
              <p className="ann-card__content">{a.content}</p>
              <div className="ann-card__meta">
                <span className="ann-card__author">{a.author?.email}</span>
                {a.createdAt && (
                  <span className="ann-card__date">{formatDate(a.createdAt)}</span>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
