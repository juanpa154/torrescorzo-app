import { useEffect, useState } from "react";
import { fetchVencimientos } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ["#60a5fa", "#f59e0b", "#10b981", "#a78bfa", "#f87171", "#34d399"];

export default function VencimientosDashboard() {
  const [data, setData] = useState([]);
  const [year, setYear] = useState("all");
  const [month, setMonth] = useState("all");
  const [cuenta, setCuenta] = useState("all");
  const [minImporte, setMinImporte] = useState("");
  const [maxImporte, setMaxImporte] = useState("");

  useEffect(() => {
    fetchVencimientos({}).then(setData);
  }, []);

  const filtered = data.filter((item) => {
    const date = new Date(item.fec_venc);
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const imp = parseFloat(item.importe);

    const matchYear = year === "all" || y === year;
    const matchMonth = month === "all" || m === month;
    const matchCuenta = cuenta === "all" || item.cuent === cuenta;
    const matchImporteMin = minImporte === "" || imp >= parseFloat(minImporte);
    const matchImporteMax = maxImporte === "" || imp <= parseFloat(maxImporte);

    return matchYear && matchMonth && matchCuenta && matchImporteMin && matchImporteMax;
  });

  const groupBy = (key) =>
    filtered.reduce((acc, item) => {
      const val = item[key] || "Sin valor";
      acc[val] = (acc[val] || 0) + parseFloat(item.importe);
      return acc;
    }, {});

  const toChartData = (grouped) =>
    Object.entries(grouped).map(([name, value]) => ({ name, value }));

  const groupByMonth = () => {
    const acc = {};
    filtered.forEach((item) => {
      const date = new Date(item.fec_venc);
      const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
      acc[key] = (acc[key] || 0) + parseFloat(item.importe);
    });
    return acc;
  };

  const importRanges = [
    { label: "0 - 1,000", min: 0, max: 1000 },
    { label: "1,000 - 5,000", min: 1000, max: 5000 },
    { label: "5,000 - 10,000", min: 5000, max: 10000 },
    { label: "+10,000", min: 10000, max: Infinity },
  ];

  const byCuenta = toChartData(groupBy("cuent"));
  const byMes = toChartData(groupByMonth()).sort((a, b) => new Date(a.name) - new Date(b.name));


  const byImportRange = importRanges.map((range) => ({
    name: range.label,
    value: filtered.filter((d) => {
      const imp = parseFloat(d.importe);
      return imp >= range.min && imp < range.max;
    }).length,
  }));

  const formatMonth = (key) => {
  const [year, month] = key.split("-");
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${meses[parseInt(month, 10) - 1]} ${year}`;
    };


  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <h2 className="text-2xl font-bold mb-6">Dashboard de Vencimientos</h2>

      {/* Filtros */}
      <div className="grid sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
        <select value={year} onChange={(e) => setYear(e.target.value)} className="p-2 border">
          <option value="all">Todos los años</option>
          {[...new Set(data.map(d => new Date(d.fec_venc).getFullYear()))].sort().map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select value={month} onChange={(e) => setMonth(e.target.value)} className="p-2 border">
          <option value="all">Todos los meses</option>
          {Array.from({ length: 12 }, (_, i) => {
            const m = (i + 1).toString().padStart(2, "0");
            return <option key={m} value={m}>{m}</option>;
          })}
        </select>

        <select value={cuenta} onChange={(e) => setCuenta(e.target.value)} className="p-2 border">
          <option value="all">Todas las cuentas</option>
          {[...new Set(data.map(d => d.cuent))].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Mín. Importe"
          className="p-2 border"
          value={minImporte}
          onChange={(e) => setMinImporte(e.target.value)}
        />
        <input
          type="number"
          placeholder="Máx. Importe"
          className="p-2 border"
          value={maxImporte}
          onChange={(e) => setMaxImporte(e.target.value)}
        />
      </div>

      {/* Gráfica por Cuenta */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Total por Cuenta</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byCuenta}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis
                allowDecimals={false}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
                width={100}
            />
            <Tooltip />
            <Bar dataKey="value" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* Gráfica por Mes */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Evolución Mensual</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={byMes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
            dataKey="name"
            tickFormatter={formatMonth}
            interval={0}
            />

            <YAxis
                allowDecimals={false}
                tickFormatter={(v) => `$${v.toLocaleString()}`}
                width={100}
            />

            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#34d399" />
          </LineChart>
        </ResponsiveContainer>
      </section>

      {/* Gráfica por Rango de Importe */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Distribución por Rango de Importe</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={byImportRange} dataKey="value" nameKey="name" outerRadius={100} label>
              {byImportRange.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
