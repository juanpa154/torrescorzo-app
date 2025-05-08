import { useEffect, useState } from "react";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const res = await fetch("http://localhost:3000/api/announcements");
      const data = await res.json();
      setAnnouncements(data);
    };
    fetchAnnouncements();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 text-blue-700">Anuncios</h2>
      <div className="space-y-4">
        {announcements.map((a) => (
          <div key={a.id} className="p-4 border rounded shadow bg-white">
            <h3 className="text-xl font-semibold">{a.title}</h3>
            <p className="text-gray-700">{a.content}</p>
            <p className="text-sm text-gray-500 mt-2">
              Publicado por: {a.author.email}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
