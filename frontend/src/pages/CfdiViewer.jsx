import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './CfdiViewer.css';

export default function CfdiViewer() {
  const [cfdis, setCfdis] = useState([]);
  const [schema, setSchema] = useState('kia_zacatecas');
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCfdis = async () => {
      try {
        const res = await axios.get(`/api/cfdi/${schema}/ingresos?page=1&limit=50`);
        setCfdis(res.data.data);
        setTotal(res.data.total);
        setError(null);
      } catch (err) {
        setError('Error al obtener los datos.');
        setCfdis([]);
        setTotal(0);
      }
    };

    fetchCfdis();
  }, [schema]);

  const handleSchemaChange = (e) => {
    setSchema(e.target.value);
  };

  return (
    <div className="cfdi-container">
      <h2>CFDI Emitidos</h2>

      <select value={schema} onChange={handleSchemaChange} className="cfdi-select">
        <option value="kia_zacatecas">KIA Zacatecas</option>
        <option value="kia_celaya">KIA Celaya</option>
        {/* Agrega más opciones si hay más esquemas */}
      </select>

      {error && <div className="error">{error}</div>}

      {!error && (
        <>
          <div className="cfdi-summary">
            Total de registros: {total}
          </div>

          <div className="cfdi-table-container">
            <table className="cfdi-table">
              <thead>
                <tr>
                  {cfdis.length > 0 &&
                    Object.keys(cfdis[0]).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {cfdis.map((item, index) => (
                  <tr key={index}>
                    {Object.values(item).map((val, i) => (
                      <td key={i}>{val !== null ? val.toString() : ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
