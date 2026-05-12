import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './CfdiDashboard.css';
import {
  BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return '—';
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
};

const fmtCompact = (v) => {
  const n = parseFloat(v);
  if (isNaN(n) || n === 0) return '$0';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const pct = (now, prev) => {
  if (!prev || prev === 0) return null;
  return ((now - prev) / prev) * 100;
};

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const TIPO_LABEL = { I: 'Ingreso', E: 'Egreso', T: 'Traslado', P: 'Pago', N: 'Nómina' };

const PIE_COLORS = [
  '#3b82f6', '#f97316', '#10b981', '#8b5cf6', '#f43f5e',
  '#06b6d4', '#eab308', '#ec4899', '#14b8a6', '#a855f7',
  '#84cc16', '#ef4444', '#0ea5e9', '#d946ef'
];

const THIS_YEAR = new Date().getFullYear();
const YEAR_RANGE = Array.from({ length: THIS_YEAR - 2019 }, (_, i) => 2020 + i);

// ─── tooltip personalizado ────────────────────────────────────────────────────

const MoneyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="db-tooltip">
      <p className="db-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{fmt(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="db-tooltip">
      <p style={{ color: d.payload.fill }}><strong>{d.name}</strong></p>
      <p>{fmt(d.value)}</p>
      <p className="text-gray-400 text-xs">{d.payload.cantidad?.toLocaleString()} CFDIs</p>
    </div>
  );
};

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, delta, color = 'blue', icon }) {
  const deltaEl = delta != null ? (
    <span className={`db-delta ${delta >= 0 ? 'up' : 'down'}`}>
      {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% vs año ant.
    </span>
  ) : null;

  return (
    <div className={`db-kpi db-kpi-${color}`}>
      <div className="db-kpi-icon">{icon}</div>
      <div className="db-kpi-body">
        <p className="db-kpi-label">{label}</p>
        <p className="db-kpi-value">{value}</p>
        {sub  && <p className="db-kpi-sub">{sub}</p>}
        {deltaEl}
      </div>
    </div>
  );
}

// ─── top RFC table ────────────────────────────────────────────────────────────

function TopTable({ title, rows, rfcLabel }) {
  if (!rows?.length) return (
    <div className="db-card">
      <h3 className="db-card-title">{title}</h3>
      <p className="db-empty">Sin datos</p>
    </div>
  );

  const maxTotal = rows[0]?.total ?? 1;
  return (
    <div className="db-card">
      <h3 className="db-card-title">{title}</h3>
      <div className="db-top-table">
        {rows.map((r, i) => (
          <div key={i} className="db-top-row">
            <span className="db-top-rank">{i + 1}</span>
            <div className="db-top-info">
              <span className="db-top-rfc">{r.rfc}</span>
              <div className="db-top-bar-wrap">
                <div className="db-top-bar" style={{ width: `${(r.total / maxTotal) * 100}%` }} />
              </div>
            </div>
            <div className="db-top-amounts">
              <span className="db-top-total">{fmtCompact(r.total)}</span>
              <span className="db-top-count">{r.cantidad?.toLocaleString()} CFDIs</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function CfdiDashboard() {
  const [schema, setSchema] = useState('kia_zacatecas');
  const [anio,   setAnio]   = useState(String(THIS_YEAR));
  const [data,   setData]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,  setError]  = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/cfdi-dashboard?schema=${schema}&anio=${anio}`);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar el dashboard');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [schema, anio]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // ── derived data ──
  const mensualData = data
    ? Array.from({ length: 12 }, (_, i) => ({
        mes:      MESES_CORTOS[i],
        emitido:  data.mensualEmitidos[i]?.total  ?? 0,
        recibido: data.mensualRecibidos[i]?.total  ?? 0,
        ivaCausado:     data.mensualEmitidos[i]?.iva16  ?? 0,
        ivaAcreditable: data.mensualRecibidos[i]?.iva16 ?? 0,
        balance:  (data.mensualEmitidos[i]?.total ?? 0) - (data.mensualRecibidos[i]?.total ?? 0),
      }))
    : [];

  const ivaBalance    = data ? data.resumenEmitidos.iva16 - data.resumenRecibidos.iva16 : 0;
  const margen        = data && data.resumenEmitidos.total > 0
    ? ((data.resumenEmitidos.total - data.resumenRecibidos.total) / data.resumenEmitidos.total) * 100
    : null;

  const deltaEmi = data?.anioAnterior ? pct(data.resumenEmitidos.total, data.anioAnterior.totalEmitidos) : null;
  const deltaRec = data?.anioAnterior ? pct(data.resumenRecibidos.total, data.anioAnterior.totalRecibidos) : null;

  // Tipos: merge emitidos + recibidos en una tabla
  const tiposData = data
    ? Object.entries(
        [...(data.tiposEmitidos ?? []), ...(data.tiposRecibidos ?? [])].reduce((acc, t) => {
          if (!acc[t.tipo]) acc[t.tipo] = { emitido: 0, recibido: 0, label: TIPO_LABEL[t.tipo] ?? t.tipo };
          return acc;
        }, {})
      ).map(([tipo, v]) => {
        const emi = data.tiposEmitidos?.find(t => t.tipo === tipo);
        const rec = data.tiposRecibidos?.find(t => t.tipo === tipo);
        return { tipo: v.label, emitido: emi?.cantidad ?? 0, recibido: rec?.cantidad ?? 0 };
      })
    : [];

  // ── pie data: filter tiny slices into "Otros" ──
  const pieData = (() => {
    if (!data?.categorias?.length) return [];
    const sorted = [...data.categorias].sort((a, b) => b.total - a.total);
    const top    = sorted.slice(0, 8);
    const rest   = sorted.slice(8);
    if (rest.length > 0) {
      top.push({ categoria: 'Otros', total: rest.reduce((s, c) => s + c.total, 0), cantidad: rest.reduce((s, c) => s + c.cantidad, 0) });
    }
    return top.filter(c => c.total > 0);
  })();

  return (
    <div className="db-container">

      {/* ── HEADER ── */}
      <div className="db-header">
        <div>
          <h1 className="db-title">Dashboard CFDI</h1>
          {data && (
            <p className="db-subtitle">
              {data.schema.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())} · {data.anio}
              <span className={`db-source ${data.fuente}`}>{data.fuente === 'local' ? ' ● Local' : ' ● Remoto'}</span>
            </p>
          )}
        </div>
        <div className="db-controls">
          <select value={schema} onChange={e => setSchema(e.target.value)} className="db-select">
            <option value="kia_zacatecas">KIA Zacatecas</option>
            <option value="kia_celaya">KIA Celaya</option>
            <option value="kia_lomas">KIA Lomas</option>
            <option value="kia_irapuato">KIA Irapuato</option>
          </select>
          <select value={anio} onChange={e => setAnio(e.target.value)} className="db-select w-24">
            {YEAR_RANGE.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={fetchDashboard} disabled={loading} className="db-btn-refresh">
            {loading ? '⏳' : '↻'} Actualizar
          </button>
        </div>
      </div>

      {/* ── LOADING ── */}
      {loading && !data && (
        <div className="db-loading">
          <div className="db-spinner" />
          <p>Cargando datos…</p>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div className="db-error">⚠ {error}</div>
      )}

      {data && (
        <>
          {/* ── KPI CARDS ── */}
          <div className="db-kpis">
            <KpiCard
              icon="📈" label="Total Facturado" color="blue"
              value={fmt(data.resumenEmitidos.total)}
              sub={`${data.resumenEmitidos.cantidad.toLocaleString()} CFDIs emitidos`}
              delta={deltaEmi}
            />
            <KpiCard
              icon="📉" label="Total Gastos" color="orange"
              value={fmt(data.resumenRecibidos.total)}
              sub={`${data.resumenRecibidos.cantidad.toLocaleString()} CFDIs recibidos`}
              delta={deltaRec}
            />
            <KpiCard
              icon="🟢" label="IVA Causado" color="teal"
              value={fmt(data.resumenEmitidos.iva16)}
              sub="IVA cobrado a clientes"
            />
            <KpiCard
              icon="🟣" label="IVA Acreditable" color="purple"
              value={fmt(data.resumenRecibidos.iva16)}
              sub="IVA pagado a proveedores"
            />
            <KpiCard
              icon={ivaBalance >= 0 ? '🔴' : '🟢'}
              label="Balance IVA"
              color={ivaBalance >= 0 ? 'red' : 'green'}
              value={fmt(Math.abs(ivaBalance))}
              sub={ivaBalance >= 0 ? 'A pagar al SAT' : 'Saldo a favor'}
            />
            {margen !== null && (
              <KpiCard
                icon="📊" label="Margen Bruto" color="gray"
                value={`${margen.toFixed(1)}%`}
                sub={`Diferencia: ${fmt(data.resumenEmitidos.total - data.resumenRecibidos.total)}`}
              />
            )}
          </div>

          {/* ── ROW 1: Ingresos vs Gastos + IVA ── */}
          <div className="db-row-2">

            <div className="db-card db-card-lg">
              <h3 className="db-card-title">Ingresos vs Gastos mensuales</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mensualData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} width={64} />
                  <Tooltip content={<MoneyTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="emitido"  name="Emitido"  fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="recibido" name="Recibido" fill="#f97316" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="db-card">
              <h3 className="db-card-title">IVA mensual</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={mensualData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gCausado"     x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gAcreditable" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} width={64} />
                  <Tooltip content={<MoneyTooltip />} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Area type="monotone" dataKey="ivaCausado"     name="IVA Causado"     stroke="#10b981" fill="url(#gCausado)"     strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="ivaAcreditable" name="IVA Acreditable" stroke="#8b5cf6" fill="url(#gAcreditable)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── ROW 2: Balance mensual + Categorías ── */}
          <div className="db-row-2">

            <div className="db-card">
              <h3 className="db-card-title">Balance mensual (Emitido − Recibido)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={mensualData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtCompact} tick={{ fontSize: 11 }} width={64} />
                  <Tooltip content={<MoneyTooltip />} />
                  <Bar dataKey="balance" name="Balance"
                    radius={[3, 3, 0, 0]} maxBarSize={28}
                    fill="#10b981"
                    label={false}
                  >
                    {mensualData.map((entry, i) => (
                      <Cell key={i} fill={entry.balance >= 0 ? '#10b981' : '#f43f5e'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="db-card">
              <h3 className="db-card-title">Gastos por categoría (Recibidos)</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData} dataKey="total" nameKey="categoria"
                      cx="50%" cy="50%" outerRadius={90} innerRadius={44}
                      paddingAngle={2}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} formatter={(v) => v.length > 22 ? v.substring(0, 20) + '…' : v} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="db-empty">Sin datos de categorías. Ejecuta la clasificación IA.</p>
              )}
            </div>
          </div>

          {/* ── ROW 3: Tipos de CFDI ── */}
          {tiposData.length > 0 && (
            <div className="db-card">
              <h3 className="db-card-title">CFDIs por tipo</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={tiposData} layout="vertical" margin={{ top: 4, right: 60, bottom: 0, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="tipo" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="emitido"  name="Emitidos"  fill="#3b82f6" radius={[0, 3, 3, 0]} maxBarSize={18} />
                  <Bar dataKey="recibido" name="Recibidos" fill="#f97316" radius={[0, 3, 3, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* ── ROW 4: Top clientes + Top proveedores ── */}
          <div className="db-row-2">
            <TopTable title="Top 10 Clientes (por facturación)" rows={data.topClientes} rfcLabel="RFC Receptor" />
            <TopTable title="Top 10 Proveedores (por gasto)"    rows={data.topProveedores} rfcLabel="RFC Emisor" />
          </div>
        </>
      )}
    </div>
  );
}
