import { useEffect, useState } from "react";
import { fetchEmployees } from "../services/api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { exportEmployeesToExcel } from "../utils/exportToExcel";

const COLORS = [
  "#4ade80",
  "#60a5fa",
  "#f472b6",
  "#facc15",
  "#a78bfa",
  "#fb923c",
  "#34d399",
];

export default function EmployeeStats() {
  const [employees, setEmployees] = useState([]);

  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedAgency, setSelectedAgency] = useState("all");
  const [selectedPosition, setSelectedPosition] = useState("all");

  useEffect(() => {
    fetchEmployees().then(setEmployees);
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const date = new Date(emp.createdAt);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    const matchYear = selectedYear === "all" || year === selectedYear;
    const matchMonth = selectedMonth === "all" || month === selectedMonth;
    const matchAgency = selectedAgency === "all" || emp.agency === selectedAgency;
    const matchPosition = selectedPosition === "all" || emp.position === selectedPosition;

    return matchYear && matchMonth && matchAgency && matchPosition;
  });

  const groupBy = (key) =>
    filteredEmployees.reduce((acc, emp) => {
      const val = emp[key] || "Sin especificar";
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {});

  const toChartData = (group) =>
    Object.entries(group).map(([name, value]) => ({ name, value }));

  const byAgency = toChartData(groupBy("agency"));
  const byLocation = toChartData(groupBy("location"));
  const byPosition = toChartData(groupBy("position"));

  // Valores únicos para selects
  const allYears = [...new Set(employees.map(emp => new Date(emp.createdAt).getFullYear().toString()))].sort((a, b) => b - a);
  const allAgencies = [...new Set(employees.map(emp => emp.agency).filter(Boolean))];
  const allPositions = [...new Set(employees.map(emp => emp.position).filter(Boolean))];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-10">
      <h2 className="text-2xl font-bold mb-4">Estadísticas del Directorio</h2>

      {/* 🔍 Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="p-2 border">
          <option value="all">Todos los años</option>
          {allYears.map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>

        <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="p-2 border">
          <option value="all">Todos los meses</option>
          {Array.from({ length: 12 }, (_, i) => {
            const m = (i + 1).toString().padStart(2, "0");
            return <option key={m} value={m}>{m}</option>;
          })}
        </select>

        <select value={selectedAgency} onChange={(e) => setSelectedAgency(e.target.value)} className="p-2 border">
          <option value="all">Todas las agencias</option>
          {allAgencies.map((agency) => (
            <option key={agency} value={agency}>{agency}</option>
          ))}
        </select>

        <select value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)} className="p-2 border">
          <option value="all">Todos los puestos</option>
          {allPositions.map((position) => (
            <option key={position} value={position}>{position}</option>
          ))}
        </select>
      </div>

      {/* 📁 Exportación */}
      {filteredEmployees.length > 0 && (
        <button
          onClick={() => exportEmployeesToExcel(filteredEmployees)}
          className="mb-6 bg-green-600 text-white px-4 py-2 rounded"
        >
          Exportar resultados filtrados
        </button>
      )}

      {/* 📊 Gráfica por Agencia */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Empleados por Agencia</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byAgency}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* 📍 Gráfica por Ubicación */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Empleados por Ubicación</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={byLocation}
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label
            >
              {byLocation.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </section>

      {/* 👤 Gráfica por Puesto */}
      <section>
        <h3 className="text-lg font-semibold mb-2">Empleados por Puesto</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={byPosition}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#34d399" />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
