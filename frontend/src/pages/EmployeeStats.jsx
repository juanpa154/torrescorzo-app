import { useEffect, useState } from "react";
import { fetchEmployees } from "../services/api";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { exportEmployeesToExcel } from "../utils/exportToExcel";
import "./pages.css";
import "./EmployeeStats.css";

const COLORS = ["#dc2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777"];

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
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
    const matchYear = selectedYear === "all" || date.getFullYear().toString() === selectedYear;
    const matchMonth = selectedMonth === "all" || (date.getMonth() + 1).toString().padStart(2, "0") === selectedMonth;
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

  const byAgency   = toChartData(groupBy("agency"));
  const byLocation = toChartData(groupBy("location"));
  const byPosition = toChartData(groupBy("position"));

  const allYears     = [...new Set(employees.map((e) => new Date(e.createdAt).getFullYear().toString()))].sort((a, b) => b - a);
  const allAgencies  = [...new Set(employees.map((e) => e.agency).filter(Boolean))];
  const allPositions = [...new Set(employees.map((e) => e.position).filter(Boolean))];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="stats-tooltip">
        <p className="stats-tooltip__label">{label}</p>
        <p className="stats-tooltip__value">{payload[0].value} empleados</p>
      </div>
    );
  };

  return (
    <div className="page page--wide">
      <div className="page-header">
        <div>
          <h1 className="page-title">Estadísticas del <span>Directorio</span></h1>
          <p className="page-subtitle">{filteredEmployees.length} empleados en la selección actual</p>
        </div>
        {filteredEmployees.length > 0 && (
          <button
            className="btn btn--success"
            onClick={() => exportEmployeesToExcel(filteredEmployees)}
          >
            Exportar resultados
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="card-body" style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
          <div className="filter-row">
            <select className="form-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{ width: "140px" }}>
              <option value="all">Todos los años</option>
              {allYears.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="form-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: "150px" }}>
              <option value="all">Todos los meses</option>
              {MONTHS.map((m, i) => (
                <option key={i} value={(i + 1).toString().padStart(2, "0")}>{m}</option>
              ))}
            </select>
            <select className="form-select" value={selectedAgency} onChange={(e) => setSelectedAgency(e.target.value)} style={{ width: "180px" }}>
              <option value="all">Todas las agencias</option>
              {allAgencies.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select className="form-select" value={selectedPosition} onChange={(e) => setSelectedPosition(e.target.value)} style={{ width: "180px" }}>
              <option value="all">Todos los puestos</option>
              {allPositions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Charts grid */}
      <div className="stats-charts-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Por Agencia</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byAgency} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Por Ubicación</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byLocation} dataKey="value" nameKey="name" outerRadius={90} label>
                  {byLocation.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-header">
            <h3 className="card-title">Por Puesto</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byPosition} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
