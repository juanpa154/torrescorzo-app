import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CfdiViewer.css';

export default function CfdiViewer() {
  const [cfdis, setCfdis] = useState([]);
  const [schema, setSchema] = useState('kia_zacatecas');
  const [mes, setMes] = useState('');
  const [anio, setAnio] = useState('');
  const [resumen, setResumen] = useState(null);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const limit = 50;
  const [rfc, setRfc] = useState('');
  const [tipo, setTipo] = useState('');
  const [minMonto, setMinMonto] = useState('');
  const [maxMonto, setMaxMonto] = useState('');


  const fetchCfdis = async () => {
    try {
      const params = new URLSearchParams();
      if (mes) params.append('mes', mes);
      if (anio) params.append('anio', anio);
      if (rfc) params.append('rfc', rfc);
      if (tipo) params.append('tipo', tipo);
      if (minMonto) params.append('minMonto', minMonto);
      if (maxMonto) params.append('maxMonto', maxMonto);
      params.append('page', page);
      params.append('limit', limit);


      const res = await axios.get(`/api/cfdi/${schema}/ingresos?${params.toString()}`);
      setCfdis(res.data.data);
      setTotal(res.data.total);
      setResumen(res.data.resumen);
      setError(null);
    } catch (err) {
      console.error('Error al obtener CFDIs:', err);
      setError('Error al obtener los datos.');
      setCfdis([]);
      setResumen(null);
      setTotal(0);
    }
  };

  useEffect(() => {
    fetchCfdis();
  }, [schema, mes, anio, page, tipo, rfc, minMonto, maxMonto]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="cfdi-container p-4">
      <h2 className="text-2xl font-bold mb-4">CFDI Emitidos</h2>

      <div className="flex flex-wrap gap-4 mb-4">
        <select value={schema} onChange={(e) => setSchema(e.target.value)} className="border px-2 py-1 rounded">
          <option value="kia_zacatecas">KIA Zacatecas</option>
          <option value="kia_celaya">KIA Celaya</option>
          <option value="kia_lomas">KIA Lomas</option>
        </select>

        <select value={mes} onChange={(e) => { setMes(e.target.value); setPage(1); }} className="border px-2 py-1 rounded">
          <option value="">-- Mes --</option>
          {[...Array(12)].map((_, i) => (
            <option key={i} value={i + 1}>{i + 1}</option>
          ))}
        </select>

        <select
          value={anio}
          onChange={(e) => { setAnio(e.target.value); setPage(1); }}
          className="border px-2 py-1 rounded w-28"
        >
          <option value="">-- Año --</option>
          {[...Array(11)].map((_, i) => {
            const year = 2024 + i;
            return (
              <option key={year} value={year}>
                {year}
              </option>
            );
          })}
        </select>
      <input
            type="text"
            placeholder="RFC Receptor"
            value={rfc}
            onChange={(e) => { setRfc(e.target.value); setPage(1); }}
            className="border px-2 py-1 rounded w-52"
          />

          <select
            value={tipo}
            onChange={(e) => { setTipo(e.target.value); setPage(1); }}
            className="border px-2 py-1 rounded w-48"
          >
            <option value="">-- Tipo CFDI --</option>
            <option value="I">Ingreso (I)</option>
            <option value="NotaCredito">Nota crédito (E)</option>
            <option value="T">Traslado (T)</option>
            <option value="P">Pago (P)</option>
            <option value="N">Nómina (N)</option>
          </select>


          <input
            type="number"
            placeholder="Monto mínimo"
            value={minMonto}
            onChange={(e) => { setMinMonto(e.target.value); setPage(1); }}
            className="border px-2 py-1 rounded w-36"
          />

          <input
            type="number"
            placeholder="Monto máximo"
            value={maxMonto}
            onChange={(e) => { setMaxMonto(e.target.value); setPage(1); }}
            className="border px-2 py-1 rounded w-36"
          />

      </div>

      


      {error && <div className="text-red-500 mb-4">{error}</div>}

      {!error && (
        <>
          <div className="text-sm text-gray-600 mb-2 ">Total de registros: {total}</div>

            {resumen && (
              <div className="cfdi-summary-bar">
                <div className="cfdi-summary-grid">
                  <div><span className="font-semibold">Subtotal:</span> ${parseFloat(resumen.subtotal).toLocaleString()}</div>
                  <div><span className="font-semibold">IVA 16%:</span> ${parseFloat(resumen.iva16).toLocaleString()}</div>
                  <div><span className="font-semibold">Retenciones:</span> ${parseFloat(resumen.retenidos).toLocaleString()}</div>
                  <div><span className="font-semibold">Total:</span> ${parseFloat(resumen.total).toLocaleString()}</div>
                </div>
              </div>
            )}

          <div className="cfdi-table-wrapper border rounded">
            
            <table className="cfdi-table min-w-full text-xs text-gray-800 border-collapse">

            


              <thead>
                <tr>
                  {cfdis.length > 0 &&
                    Object.keys(cfdis[0]).map((key) => (
                     <th
                        key={key}
                        className="px-3 py-2 border border-gray-700 font-semibold text-left whitespace-nowrap sticky top-[96px] bg-gray-800 text-white z-10"
                      >
                        {key.replaceAll('_', ' ')}
                      </th>
                    ))}
                </tr>
              </thead>

              
              <tbody>
                {cfdis.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'}>
                    {Object.values(item).map((val, i) => (
                      <td
                        key={i}
                        className="px-3 py-2 border border-gray-200 whitespace-nowrap truncate max-w-[200px] text-gray-700 text-xs"
                      >
                        {val !== null ? val.toString() : ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 rounded border text-sm font-medium ${
                    page === i + 1
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50'
                  }`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
