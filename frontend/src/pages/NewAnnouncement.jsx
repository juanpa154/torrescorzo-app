import { useState } from "react";
import { createAnnouncement } from "../services/api";

export default function NewAnnouncement() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await createAnnouncement(title, content);
    if (res.id) {
      setMessage("Anuncio creado exitosamente ✅");
      setTitle("");
      setContent("");
    } else {
      setMessage(res.message || "Error al crear anuncio ❌");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Nuevo Anuncio</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-2 border"
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full p-2 border"
          rows="4"
          placeholder="Contenido del anuncio"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        ></textarea>
        <button className="w-full bg-blue-600 text-white p-2 rounded">
          Publicar
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
