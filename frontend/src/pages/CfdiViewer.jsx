import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import './CfdiViewer.css';

// ─── format helpers ──────────────────────────────────────────────────────────

const formatMXN = (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return '—';
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 });
};

const formatDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ─── column config ───────────────────────────────────────────────────────────
// order, label, optional formatter, alignment, badge flag, fullOnly flag

const COL_CFG = {
  fecha_emision:         { label: 'Fecha',        fmt: formatDate },
  tipo:                  { label: 'Tipo' },
  rfc_emisor:            { label: 'RFC Emisor' },
  rfc_receptor:          { label: 'RFC Receptor' },
  razon_social_emisor:   { label: 'Emisor' },
  razon_social_receptor: { label: 'Receptor' },
  nombre_emisor:         { label: 'Emisor' },
  nombre_receptor:       { label: 'Receptor' },
  subtotal:              { label: 'Subtotal',     fmt: formatMXN, right: true },
  iva16:                 { label: 'IVA 16%',      fmt: formatMXN, right: true },
  total_retenidos:       { label: 'Retenciones',  fmt: formatMXN, right: true },
  total:                 { label: 'Total',        fmt: formatMXN, right: true, bold: true },
  categoria_ia:          { label: 'Categoría IA', badge: true },
  conceptos:             { label: 'Concepto',     fullOnly: true },
  uuid:                  { label: 'UUID',         fullOnly: true },
};

const COL_ORDER = Object.keys(COL_CFG);

// ─── category badge colors ───────────────────────────────────────────────────

const CAT_COLOR = {
  'Combustible':                                  'badge-orange',
  'Vehículos Nuevos':                             'badge-blue',
  'Refacciones y mantenimiento':                  'badge-yellow',
  'Servicios profesionales y administrativos':    'badge-teal',
  'Publicidad y marketing':                       'badge-pink',
  'Arrendamiento':                                'badge-indigo',
  'Gastos de operación':                          'badge-gray',
  'Servicios de transporte':                      'badge-cyan',
  'Consumo interno y alimentos':                  'badge-green',
  'Servicios técnicos y mantenimiento':           'badge-amber',
  'Tecnología y comunicaciones':                  'badge-violet',
  'Intereses y comisiones':                       'badge-red',
  'Anticipos y pagos aplicados':                  'badge-sky',
  'Otro':                                         'badge-gray',
};

// ─── static data ─────────────────────────────────────────────────────────────

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CATEGORIAS_IA = [
  'Combustible', 'Vehículos Nuevos', 'Refacciones y mantenimiento',
  'Servicios profesionales y administrativos', 'Publicidad y marketing',
  'Arrendamiento', 'Gastos de operación', 'Servicios de transporte',
  'Consumo interno y alimentos', 'Servicios técnicos y mantenimiento',
  'Tecnología y comunicaciones', 'Intereses y comisiones',
  'Anticipos y pagos aplicados', 'Otro'
];

const THIS_YEAR = new Date().getFullYear();
const YEAR_RANGE = Array.from({ length: THIS_YEAR - 2019 }, (_, i) => 2020 + i);

// ─── smart pagination ─────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const items = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) items.push(i);
  } else {
    items.push(1);
    if (page > 3) items.push('..L');
    const lo = Math.max(2, page - 1);
    const hi = Math.min(totalPages - 1, page + 1);
    for (let i = lo; i <= hi; i++) items.push(i);
    if (page < totalPages - 2) items.push('..R');
    items.push(totalPages);
  }

  return (
    <div className="cfdi-pagination">
      <button className="cfdi-page-btn" disabled={page === 1} onClick={() => onChange(page - 1)}>‹</button>
      {items.map((p, i) =>
        typeof p === 'string'
          ? <span key={p + i} className="cfdi-page-dots">…</span>
          : <button key={p} className={`cfdi-page-btn${page === p ? ' active' : ''}`} onClick={() => onChange(p)}>{p}</button>
      )}
      <button className="cfdi-page-btn" disabled={page === totalPages} onClick={() => onChange(page + 1)}>›</button>
      <span className="cfdi-page-info">Página {page} de {totalPages.toLocaleString()}</span>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function CfdiViewer({
  tipo = 'ingresos',
  esquemaInicial = 'kia_zacatecas',
  tipoRfcFiltro = 'rfc_receptor',
  endpointBase = '/api/cfdi/',
  titulo = 'CFDI Emitidos'
}) {
  const tipoSync = tipo === 'ingresos' ? 'emitidos' : 'recibidos';

  // ── data state ──
  const [cfdis, setCfdis]       = useState([]);
  const [total, setTotal]       = useState(0);
  const [resumen, setResumen]   = useState(null);
  const [fuente, setFuente]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError]       = useState(null);

  // ── filter state ──
  const [schema, setSchema]         = useState(esquemaInicial);
  const [mes, setMes]               = useState('');
  const [anio, setAnio]             = useState(String(THIS_YEAR));
  const [rfcInput, setRfcInput]     = useState('');
  const [rfc, setRfc]               = useState('');
  const [cfdiTipo, setCfdiTipo]     = useState('');
  const [minMonto, setMinMonto]     = useState('');
  const [maxMonto, setMaxMonto]     = useState('');
  const [categoriaIa, setCategoriaIa] = useState('');
  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(50);

  // ── ui state ──
  const [modoCompleto, setModoCompleto] = useState(false);
  const [syncEstado, setSyncEstado]     = useState(null);
  const [syncing, setSyncing]           = useState(false);
  const [classifying, setClassifying]   = useState(false);

  // debounce RFC input
  useEffect(() => {
    const t = setTimeout(() => { setRfc(rfcInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [rfcInput]);

  // overlay delay: only show spinner after 300ms to avoid flash on fast loads
  useEffect(() => {
    if (!loading) { setShowOverlay(false); return; }
    const t = setTimeout(() => setShowOverlay(true), 300);
    return () => clearTimeout(t);
  }, [loading]);

  // ── data fetching ──
  const fetchSyncEstado = useCallback(async () => {
    try {
      const res = await axios.get(`/api/sync/estado?schema=${schema}`);
      setSyncEstado(res.data);
    } catch { setSyncEstado(null); }
  }, [schema]);

  const fetchCfdis = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (mes)         params.append('mes', mes);
      if (anio)        params.append('anio', anio);
      if (rfc)         params.append('rfc', rfc);
      if (cfdiTipo)    params.append('tipo', cfdiTipo);
      if (minMonto)    params.append('minMonto', minMonto);
      if (maxMonto)    params.append('maxMonto', maxMonto);
      if (categoriaIa) params.append('categoriaIa', categoriaIa);
      params.append('page', page);
      params.append('limit', limit);

      const res = await axios.get(`${endpointBase}${schema}/${tipo}?${params.toString()}`);
      setCfdis(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
      setResumen(res.data.resumen ?? null);
      setFuente(res.data.fuente ?? null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo obtener los datos. Verifica la conexión.');
      setCfdis([]); setResumen(null); setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [schema, mes, anio, rfc, cfdiTipo, minMonto, maxMonto, categoriaIa, page, limit, tipo, endpointBase]);

  useEffect(() => { fetchCfdis(); }, [fetchCfdis]);
  useEffect(() => { fetchSyncEstado(); }, [fetchSyncEstado]);

  // ── actions ──
  const limpiarFiltros = () => {
    setMes(''); setAnio(String(THIS_YEAR));
    setRfcInput(''); setRfc(''); setCfdiTipo('');
    setMinMonto(''); setMaxMonto(''); setCategoriaIa('');
    setPage(1);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await axios.post(`/api/sync/ejecutar?schema=${schema}&tipo=${tipoSync}`);
      await fetchSyncEstado();
      await fetchCfdis();
    } catch (err) {
      alert('Error al sincronizar: ' + (err.response?.data?.error || err.message));
    } finally { setSyncing(false); }
  };

  const handleClassify = async () => {
    setClassifying(true);
    try {
      const res = await axios.get(`/api/ia/clasificar?schema=${schema}&tipo=${tipoSync}&limit=1000`);
      alert(`Clasificación completada: ${res.data.clasificados ?? 0} CFDI(s) procesados`);
      await fetchSyncEstado();
      await fetchCfdis();
    } catch (err) {
      alert('Error al clasificar: ' + (err.response?.data?.error || err.message));
    } finally { setClassifying(false); }
  };

  const handleExport = async () => {
    if (total === 0) return;
    if (total > 10000 && !confirm(
      `Hay ${total.toLocaleString()} registros. Solo se exportarán los primeros 10,000. ¿Continuar?`
    )) return;

    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (mes)         params.append('mes', mes);
      if (anio)        params.append('anio', anio);
      if (rfc)         params.append('rfc', rfc);
      if (cfdiTipo)    params.append('tipo', cfdiTipo);
      if (minMonto)    params.append('minMonto', minMonto);
      if (maxMonto)    params.append('maxMonto', maxMonto);
      if (categoriaIa) params.append('categoriaIa', categoriaIa);
      params.append('page', '1');
      params.append('limit', '10000');

      const res = await axios.get(`${endpointBase}${schema}/${tipo}?${params.toString()}`);
      const rows = res.data.data ?? [];
      if (rows.length === 0) { alert('No hay datos para exportar.'); return; }

      const ExcelJS = (await import('exceljs')).default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet(titulo.substring(0, 31));

      const headers = Object.keys(rows[0]);
      const headerRow = ws.addRow(headers.map(h => h.replaceAll('_', ' ').toUpperCase()));
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
        cell.alignment = { vertical: 'middle' };
      });
      headerRow.height = 22;

      rows.forEach(row => ws.addRow(headers.map(k => row[k] ?? '')));
      ws.columns.forEach((col, i) => {
        col.width = Math.max(10, Math.min(36, (headers[i]?.length ?? 10) + 4));
      });

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${titulo}_${schema}_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error(err);
      alert('Error al exportar: ' + err.message);
    } finally { setExporting(false); }
  };

  // ── column resolution ──
  const visibleCols = (() => {
    if (cfdis.length === 0) return [];
    const allKeys = Object.keys(cfdis[0]);
    const ordered = [
      ...COL_ORDER.filter(k => allKeys.includes(k)),
      ...allKeys.filter(k => !COL_ORDER.includes(k))
    ];
    return modoCompleto ? ordered : ordered.filter(k => !COL_CFG[k]?.fullOnly);
  })();

  const renderCell = (key, val) => {
    const cfg = COL_CFG[key];
    if (cfg?.badge) {
      if (!val) return <span className="cell-empty">—</span>;
      return <span className={`cfdi-badge ${CAT_COLOR[val] ?? 'badge-gray'}`}>{val}</span>;
    }
    if (cfg?.fmt) return cfg.fmt(val);
    if (val === null || val === undefined) return <span className="cell-empty">—</span>;
    const str = String(val);
    return str.length > 60
      ? <span title={str} className="cell-truncate">{str.substring(0, 58)}…</span>
      : str;
  };

  // ── derived ──
  const estadoSync = syncEstado?.estados?.find(e => e.tipoCfdi === tipoSync);
  const pendientes  = syncEstado?.pendientes?.[tipoSync] ?? 0;
  const totalPages  = Math.ceil(total / limit);
  const hayFiltros  = mes || anio !== String(THIS_YEAR) || rfc || cfdiTipo || minMonto || maxMonto || categoriaIa;

  return (
    <div className="cfdi-container">

      {/* ── HEADER ── */}
      <div className="cfdi-header">
        <div className="cfdi-header-left">
          <h2 className="cfdi-title">{titulo}</h2>
          {fuente && (
            <span className={`cfdi-source-badge ${fuente}`}>{fuente === 'local' ? '● Local' : '● Remoto'}</span>
          )}
          {loading && <span className="cfdi-spinner" />}
        </div>

        <div className="cfdi-header-actions">
          {estadoSync?.ultimaSync && (
            <span className="cfdi-sync-info">
              Sync: {new Date(estadoSync.ultimaSync).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })}
              &nbsp;·&nbsp;{estadoSync.totalSincronizados?.toLocaleString()} reg.
            </span>
          )}
          <button onClick={handleSync} disabled={syncing || classifying} className="cfdi-btn btn-blue">
            {syncing ? '⏳ Sincronizando…' : '↻ Sincronizar'}
          </button>
          <button
            onClick={handleClassify}
            disabled={classifying || syncing || !estadoSync?.ultimaSync}
            title={!estadoSync?.ultimaSync ? 'Primero ejecuta una sincronización' : undefined}
            className="cfdi-btn btn-purple"
          >
            {classifying
              ? '⏳ Clasificando…'
              : pendientes > 0 ? `✦ Clasificar IA (${pendientes})` : '✦ Clasificar IA'}
          </button>
          <button onClick={handleExport} disabled={exporting || loading || total === 0} className="cfdi-btn btn-green">
            {exporting ? '⏳ Exportando…' : '↓ Excel'}
          </button>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="cfdi-filters">
        <select value={schema} onChange={e => { setSchema(e.target.value); setPage(1); }} className="cfdi-input">
          <option value="kia_zacatecas">KIA Zacatecas</option>
          <option value="kia_celaya">KIA Celaya</option>
          <option value="kia_lomas">KIA Lomas</option>
          <option value="kia_irapuato">KIA Irapuato</option>
        </select>

        <select value={mes} onChange={e => { setMes(e.target.value); setPage(1); }} className="cfdi-input">
          <option value="">Todos los meses</option>
          {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>

        <select value={anio} onChange={e => { setAnio(e.target.value); setPage(1); }} className="cfdi-input w-24">
          <option value="">Todos los años</option>
          {YEAR_RANGE.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <input
          type="text"
          placeholder={tipoRfcFiltro === 'rfc_receptor' ? 'RFC receptor…' : 'RFC emisor…'}
          value={rfcInput}
          onChange={e => setRfcInput(e.target.value)}
          className="cfdi-input w-44"
        />

        <select value={cfdiTipo} onChange={e => { setCfdiTipo(e.target.value); setPage(1); }} className="cfdi-input">
          <option value="">Todos los tipos</option>
          <option value="I">Ingreso (I)</option>
          <option value="E">Egreso / Nota crédito (E)</option>
          <option value="T">Traslado (T)</option>
          <option value="P">Pago (P)</option>
          <option value="N">Nómina (N)</option>
        </select>

        <select value={categoriaIa} onChange={e => { setCategoriaIa(e.target.value); setPage(1); }} className="cfdi-input w-52">
          <option value="">Todas las categorías</option>
          <option value="sin_clasificar">— Sin clasificar</option>
          {CATEGORIAS_IA.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <input type="number" placeholder="Monto mín." value={minMonto}
          onChange={e => { setMinMonto(e.target.value); setPage(1); }} className="cfdi-input w-28" />

        <input type="number" placeholder="Monto máx." value={maxMonto}
          onChange={e => { setMaxMonto(e.target.value); setPage(1); }} className="cfdi-input w-28" />

        <div className="cfdi-filter-tools">
          {hayFiltros && (
            <button onClick={limpiarFiltros} className="cfdi-btn btn-ghost text-xs">✕ Limpiar</button>
          )}
          <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="cfdi-input w-20 text-xs">
            <option value={25}>25 / pág</option>
            <option value={50}>50 / pág</option>
            <option value={100}>100 / pág</option>
            <option value={200}>200 / pág</option>
          </select>
          <button onClick={() => setModoCompleto(m => !m)} className="cfdi-btn btn-ghost text-xs">
            {modoCompleto ? '⊟ Compacto' : '⊞ Ver todo'}
          </button>
        </div>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div className="cfdi-error">
          <span>⚠ {error}</span>
          <button onClick={fetchCfdis} className="cfdi-btn btn-ghost ml-3 text-xs">Reintentar</button>
        </div>
      )}

      {!error && (
        <>
          {/* ── SUMMARY ── */}
          {resumen && (
            <div className="cfdi-summary">
              <div className="cfdi-summary-item">
                <span className="cfdi-summary-label">Registros</span>
                <span className="cfdi-summary-value">{total.toLocaleString()}</span>
              </div>
              <div className="cfdi-summary-sep" />
              <div className="cfdi-summary-item">
                <span className="cfdi-summary-label">Subtotal</span>
                <span className="cfdi-summary-value">{formatMXN(resumen.subtotal)}</span>
              </div>
              <div className="cfdi-summary-sep" />
              <div className="cfdi-summary-item">
                <span className="cfdi-summary-label">IVA 16%</span>
                <span className="cfdi-summary-value">{formatMXN(resumen.iva16)}</span>
              </div>
              <div className="cfdi-summary-sep" />
              <div className="cfdi-summary-item">
                <span className="cfdi-summary-label">Retenciones</span>
                <span className="cfdi-summary-value">{formatMXN(resumen.retenidos)}</span>
              </div>
              <div className="cfdi-summary-sep" />
              <div className="cfdi-summary-item">
                <span className="cfdi-summary-label">Total</span>
                <span className="cfdi-summary-value highlight">{formatMXN(resumen.total)}</span>
              </div>
            </div>
          )}

          {/* ── TABLE ── */}
          <div className="cfdi-table-wrapper">
            {showOverlay && (
              <div className="cfdi-loading-overlay">
                <div className="cfdi-spinner-lg" />
              </div>
            )}
            {cfdis.length === 0 && !loading ? (
              <div className="cfdi-empty">No se encontraron registros con los filtros aplicados.</div>
            ) : (
              <table className="cfdi-table">
                <thead>
                  <tr>
                    {visibleCols.map(key => (
                      <th key={key} className={COL_CFG[key]?.right ? 'th-right' : ''}>
                        {COL_CFG[key]?.label ?? key.replaceAll('_', ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cfdis.map((item, idx) => (
                    <tr key={idx}>
                      {visibleCols.map(key => (
                        <td key={key} className={[
                          COL_CFG[key]?.right ? 'td-right' : '',
                          COL_CFG[key]?.bold  ? 'td-bold'  : ''
                        ].join(' ')}>
                          {renderCell(key, item[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ── PAGINATION ── */}
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
