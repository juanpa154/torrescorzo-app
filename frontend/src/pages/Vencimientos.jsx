import { useEffect, useState } from "react";
import { fetchVencimientos } from "../services/api";

export default function Vencimientos() {
  const [data, setData] = useState([]);
  const [cuent, setCuent] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  const handleSearch = async () => {
    const filters = {};
    if (cuent) filters.cuent = cuent;
    if (desde) filters.desde = desde;
    if (hasta) filters.hasta = hasta;

    const results = await fetchVencimientos(filters);
    setData(results);
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Consulta de Vencimientos</h2>

      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          value={cuent}
          onChange={(e) => setCuent(e.target.value)}
          placeholder="Cuenta (cuent)"
          className="p-2 border rounded w-48"
        />
        <input
          type="date"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className="p-2 border rounded"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Buscar
        </button>
      </div>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Serie</th>
            <th className="p-2 border">Cuenta</th>
            <th className="p-2 border">Documento</th>
            <th className="p-2 border">Importe</th>
            <th className="p-2 border">Vencimiento</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.serie}>
              <td className="p-2 border">{row.serie}</td>
              <td className="p-2 border">{row.cuent}</td>
              <td className="p-2 border">{row.doct}</td>
              <td className="p-2 border text-right">
                ${parseFloat(row.importe).toLocaleString()}
              </td>
              <td className="p-2 border">{new Date(row.fec_venc).toLocaleDateString()}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center p-4 text-gray-500">
                No hay resultados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
