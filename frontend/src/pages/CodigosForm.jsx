import { useState, useEffect, useRef, useCallback } from "react";
import { getToken } from "../services/api";
import { decodeToken } from "../utils/jwt";
import {
  fetchCodigosCatalogos,
  fetchColoniasPorCp,
  fetchSiguienteCodigo,
  buscarCodigos,
  fetchCodigo,
  createCodigo,
  confirmarCodigo,
  updateCodigo,
  updateCodigoNombre,
  fetchCodigoImagen,
  uploadCodigoImagen,
} from "../services/api";
import "./pages.css";

// ─── Constantes ───────────────────────────────────────────────────────────────

const RFC_GENERICO = "XAXX010101000";

const EMPTY_FORM = {
  codigo: "",
  // Persona física
  paterno: "", materno: "", nombre: "",
  curp: "", sexo: "", escolaridad: "", edoCivil: "", titulo: "",
  pasatiempo1: "", pasatiempo2: "",
  // Persona moral
  razSoc: "", regSoc: "", repLegal: "",
  // Comunes
  rfc: "", regFis: "",
  direccion: "", noExterior: "", colonia: "", codPos: "", ciudad: "", estado: "", municipio: "",
  lada: "", telefono: "", movil: "",
  ladaOf: "", telOficina: "", extTelOfi: "",
  email: "", email2: "",
  redSoc1: "", redSoc2: "", redSoc3: "",
  formaPago: "", ctaPagadora: "", limCred: "", dias: "",
  tipo: "P", convenio: false, clasif: "",
  fechaNac: "", fechaAlta: "",
  noId: "", observaciones: "",
};

// ─── Utilidades ───────────────────────────────────────────────────────────────

function pad5(v) { return String(v || "").padStart(5, "0"); }

// ─── Componentes menores ──────────────────────────────────────────────────────

function Field({ label, error, children, style }) {
  return (
    <div className="form-group" style={{ marginBottom: 0, ...style }}>
      <label className="form-label">{label}</label>
      {children}
      {error && <span style={{ color: "var(--p-red)", fontSize: "0.75rem" }}>{error}</span>}
    </div>
  );
}

function Input({ name, value, onChange, disabled, maxLength, placeholder, type = "text", style }) {
  return (
    <input
      className="form-input"
      type={type}
      name={name}
      value={value ?? ""}
      onChange={onChange}
      disabled={disabled}
      maxLength={maxLength}
      placeholder={placeholder}
      style={style}
      autoComplete="off"
    />
  );
}

function Select({ name, value, onChange, disabled, children }) {
  return (
    <select className="form-input" name={name} value={value ?? ""} onChange={onChange} disabled={disabled}>
      <option value="">— Seleccionar —</option>
      {children}
    </select>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{
      gridColumn: "1 / -1",
      fontWeight: 600,
      fontSize: "0.8rem",
      color: "var(--p-text-2)",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      borderBottom: "1px solid var(--p-border)",
      paddingBottom: "0.4rem",
      marginTop: "0.5rem",
    }}>
      {children}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CodigosForm() {
  const [user] = useState(() => decodeToken(getToken()));
  const isAdmin = user?.role === "admin";

  // Agencia: del JWT o seleccionada manualmente (admin sin agencySchema)
  const [selectedSchema, setSelectedSchema] = useState(user?.agencySchema ?? null);
  const [schemaDraft, setSchemaDraft] = useState(user?.agencySchema ?? "");

  // Estado del formulario
  const [form, setForm] = useState(EMPTY_FORM);
  const [esMoral, setEsMoral] = useState(false);
  const [modo, setModo] = useState("nuevo"); // 'nuevo' | 'edicion'
  const [errors, setErrors] = useState({});

  // Catálogos
  const [cats, setCats] = useState(null);
  const [colonias, setColonias] = useState([]);

  // Búsqueda
  const [busqTerm, setBusqTerm] = useState("");
  const [busqTipo, setBusqTipo] = useState("nombre");
  const [busqResults, setBusqResults] = useState(null);
  const debounceRef = useRef(null);
  const searchSeqRef = useRef(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { existing, data }
  const [modcodigoDialog, setModcodigoDialog] = useState(false);
  const [nombreEnabled, setNombreEnabled] = useState(false);

  // Imagen
  const [imgPreview, setImgPreview] = useState(null);
  const [imgDirty, setImgDirty] = useState(false);
  const fileRef = useRef(null);

  // ─── Carga inicial: catálogos + siguiente código ──────────────────────────

  useEffect(() => {
    fetchCodigosCatalogos(selectedSchema).then(setCats).catch(() => setStatus({ type: "error", msg: "Error al cargar catálogos" }));
    if (selectedSchema) loadSiguiente();
  }, [selectedSchema]);

  async function loadSiguiente() {
    try {
      const { codigo } = await fetchSiguienteCodigo(selectedSchema);
      setForm(f => ({ ...EMPTY_FORM, codigo, tipo: "P", fechaAlta: new Date().toISOString().split("T")[0] }));
      setModo("nuevo");
      setNombreEnabled(true);
      setBusqResults(null);
      setImgPreview(null);
      setImgDirty(false);
      setErrors({});
      setStatus(null);
    } catch { setStatus({ type: "error", msg: "Error al obtener siguiente código" }); }
  }

  // ─── Búsqueda con debounce (300 ms) ──────────────────────────────────────

  const runSearch = useCallback(async (q, tipo) => {
    if (!q.trim()) { setBusqResults(null); return; }
    const seq = ++searchSeqRef.current;
    try {
      const res = await buscarCodigos(q.trim(), tipo, 20, 0, selectedSchema);
      if (seq !== searchSeqRef.current) return; // respuesta obsoleta, ya hay una búsqueda más nueva
      if (!res.rows) {
        setStatus({ type: "error", msg: res.error || "Error en búsqueda. Verifica que la agencia esté configurada." });
        setBusqResults(null);
        return;
      }
      if (res.total === 1) {
        await cargarCodigo(res.rows[0].codigo);
        if (seq !== searchSeqRef.current) return;
        setBusqResults(null);
      } else {
        setBusqResults(res);
      }
    } catch { /* silencioso */ }
  }, [selectedSchema]);

  const handleBusqChange = (e) => {
    const val = e.target.value;
    setBusqTerm(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val, busqTipo), 300);
  };

  const handleBusqTipoChange = (e) => {
    setBusqTipo(e.target.value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(busqTerm, e.target.value), 300);
  };

  // ─── Cargar código en el formulario ──────────────────────────────────────

  async function cargarCodigo(codigo) {
    setLoading(true);
    try {
      const record = await fetchCodigo(pad5(codigo), selectedSchema);
      if (record.error) { setStatus({ type: "error", msg: record.error }); return; }
      const esMoralVal = !!record.razSoc;
      setEsMoral(esMoralVal);
      setForm({
        codigo:       record.codigo ?? "",
        paterno:      record.paterno ?? "",
        materno:      record.materno ?? "",
        nombre:       record.nombre ?? "",
        curp:         record.curp ?? "",
        sexo:         record.sexo ?? "",
        escolaridad:  record.escolaridad ?? "",
        edoCivil:     record.edoCivil ?? "",
        titulo:       record.titulo ?? "",
        pasatiempo1:  record.pasatiempo1 ?? "",
        pasatiempo2:  record.pasatiempo2 ?? "",
        razSoc:       record.razSoc ?? "",
        regSoc:       record.regSoc ?? "",
        repLegal:     record.repLegal ?? "",
        rfc:          record.rfc ?? "",
        regFis:       record.regFis ?? "",
        direccion:    record.direccion ?? "",
        noExterior:   record.noExterior ?? "",
        colonia:      record.colonia ?? "",
        codPos:       record.codPos ?? "",
        ciudad:       record.ciudad ?? "",
        estado:       record.estado ?? "",
        municipio:    record.municipio ?? "",
        lada:         record.lada ?? "",
        telefono:     record.telefono ?? "",
        movil:        record.movil ?? "",
        ladaOf:       record.ladaOf ?? "",
        telOficina:   record.telOficina ?? "",
        extTelOfi:    record.extTelOfi ?? "",
        email:        record.email ?? "",
        email2:       record.email2 ?? "",
        redSoc1:      record.redSoc1 ?? "",
        redSoc2:      record.redSoc2 ?? "",
        redSoc3:      record.redSoc3 ?? "",
        formaPago:    record.formaPago ?? "",
        ctaPagadora:  record.ctaPagadora ?? "",
        limCred:      record.limCred ?? "",
        dias:         record.dias ?? "",
        tipo:         record.tipo ?? "P",
        convenio:     record.convenio ?? false,
        clasif:       record.clasif ?? "",
        fechaNac:     record.fechaNac ? record.fechaNac.split("T")[0] : "",
        fechaAlta:    record.fechaAlta ? record.fechaAlta.split("T")[0] : "",
        noId:         record.noId ?? "",
        observaciones: record.observaciones ?? "",
      });
      setModo("edicion");
      setNombreEnabled(false);
      setErrors({});
      setStatus(null);
      setBusqResults(null);
      setBusqTerm("");

      // Cargar colonias del CP existente para que el select quede poblado
      setColonias([]);
      if (/^\d{5}$/.test(record.codPos ?? "")) {
        fetchColoniasPorCp(record.codPos, selectedSchema).then(setColonias).catch(() => setColonias([]));
      }

      // Cargar imagen si existe
      const imgData = await fetchCodigoImagen(pad5(codigo), selectedSchema);
      setImgPreview(imgData?.imagen ?? null);
      setImgDirty(false);
    } catch { setStatus({ type: "error", msg: "Error al cargar el código" }); }
    finally { setLoading(false); }
  }

  // ─── Cambio de campo ──────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value, type: t, checked } = e.target;
    const val = t === "checkbox" ? checked : value;
    setForm(f => ({ ...f, [name]: val }));
    setErrors(er => ({ ...er, [name]: undefined }));

    // RFC genérico → forzar régimen fiscal 616
    if (name === "rfc" && val.toUpperCase() === RFC_GENERICO) {
      setForm(f => ({ ...f, rfc: val.toUpperCase(), regFis: "616" }));
    }

    // CP → cargar colonias
    if (name === "codPos" && /^\d{5}$/.test(val)) {
      fetchColoniasPorCp(val, selectedSchema).then(setColonias).catch(() => setColonias([]));
    }
  };

  const handleToggleMoral = (isMoral) => {
    setEsMoral(isMoral);
    setForm(f => ({
      ...f,
      razSoc: "", regSoc: "", repLegal: "",
      paterno: "", materno: "", nombre: "",
      curp: "", sexo: "", escolaridad: "", edoCivil: "", titulo: "",
    }));
    setErrors({});
  };

  // ─── Guard MODCODIGO ──────────────────────────────────────────────────────

  function handleModcodigoClick() {
    setModcodigoDialog(true);
  }

  function confirmModcodigo() {
    setModcodigoDialog(false);
    setNombreEnabled(true);
  }

  // ─── Validación cliente ───────────────────────────────────────────────────

  function validate() {
    const errs = {};
    const rfc = form.rfc.toUpperCase();

    if (rfc && rfc !== RFC_GENERICO) {
      if (esMoral && rfc.length !== 12) errs.rfc = "RFC moral debe tener 12 caracteres";
      if (!esMoral && rfc.length !== 13) errs.rfc = "RFC físico debe tener 13 caracteres";
    }
    if (rfc === RFC_GENERICO && esMoral) errs.rfc = "RFC genérico no válido para personas morales";

    if (form.curp && form.curp.length !== 18) errs.curp = "CURP debe tener 18 caracteres";
    if (form.lada && !/^\d{3}$/.test(form.lada)) errs.lada = "Lada: exactamente 3 dígitos";
    if (form.ladaOf && !/^\d{3}$/.test(form.ladaOf)) errs.ladaOf = "Lada: exactamente 3 dígitos";
    if (form.telefono && (!/^\d+$/.test(form.telefono) || form.telefono.length < 7))
      errs.telefono = "Teléfono: mínimo 7 dígitos numéricos";
    if (form.telOficina && (!/^\d+$/.test(form.telOficina) || form.telOficina.length < 7))
      errs.telOficina = "Teléfono: mínimo 7 dígitos numéricos";
    if (form.email && !form.email.includes("@")) errs.email = "Email inválido";
    if (form.email2 && !form.email2.includes("@")) errs.email2 = "Email inválido";
    if (form.codPos && !/^\d{5}$/.test(form.codPos)) errs.codPos = "CP: exactamente 5 dígitos";

    if (esMoral && form.razSoc) {
      if (/\b(SA\s+DE|S\.?\s*A\.?|C\.?\s*V\.?|SAPI|A\.?\s*C\.?|S\.?\s*C\.?|R\.?\s*L\.?)\b/i.test(form.razSoc))
        errs.razSoc = "La razón social no puede contener abreviaturas societarias";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── Guardar ──────────────────────────────────────────────────────────────

  async function handleGuardar() {
    if (!validate()) { setStatus({ type: "error", msg: "Corrige los errores antes de guardar" }); return; }
    setLoading(true);
    setStatus(null);

    try {
      const payload = buildPayload();

      let res;
      if (modo === "nuevo") {
        res = await createCodigo(payload, selectedSchema);
        if (res.status === 409) {
          setConfirmDialog({ existing: res.data.existing, data: payload });
          setLoading(false);
          return;
        }
      } else {
        // Guardar nombre/razSoc si están habilitados y el usuario es admin
        if (nombreEnabled && isAdmin) {
          const nombreRes = await updateCodigoNombre(form.codigo, {
            paterno: form.paterno || null,
            materno: form.materno || null,
            nombre:  form.nombre  || null,
            razSoc:  form.razSoc  || null,
          }, selectedSchema);
          if (nombreRes.status >= 400) {
            setStatus({ type: "error", msg: nombreRes.data?.error || "Error al actualizar nombre" });
            setLoading(false);
            return;
          }
        }
        res = await updateCodigo(form.codigo, payload, selectedSchema);
      }

      if (res.status >= 400) {
        setStatus({ type: "error", msg: res.data?.error || "Error al guardar" });
        setLoading(false);
        return;
      }

      // Subir o quitar imagen si cambió (imgPreview null = quitar)
      if (imgDirty) {
        await uploadCodigoImagen(form.codigo, imgPreview, selectedSchema);
        setImgDirty(false);
      }

      setStatus({ type: "success", msg: `Código ${form.codigo} guardado correctamente.` });
      if (modo === "nuevo") await cargarCodigo(form.codigo);
    } catch {
      setStatus({ type: "error", msg: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmarUpsert() {
    if (!confirmDialog) return;
    setLoading(true);
    try {
      const res = await confirmarCodigo(form.codigo, confirmDialog.data, selectedSchema);
      setConfirmDialog(null);
      if (res.status >= 400) {
        setStatus({ type: "error", msg: res.data?.error || "Error al confirmar" });
      } else {
        setStatus({ type: "success", msg: `Código ${form.codigo} actualizado.` });
        await cargarCodigo(form.codigo);
      }
    } catch {
      setConfirmDialog(null);
      setStatus({ type: "error", msg: "Error de conexión" });
    } finally {
      setLoading(false);
    }
  }

  function buildPayload() {
    return {
      codigo:       form.codigo,
      paterno:      form.paterno  || null,
      materno:      form.materno  || null,
      nombre:       form.nombre   || null,
      curp:         form.curp     || null,
      sexo:         form.sexo     || null,
      escolaridad:  form.escolaridad || null,
      edoCivil:     form.edoCivil || null,
      titulo:       form.titulo   || null,
      pasatiempo1:  form.pasatiempo1 || null,
      pasatiempo2:  form.pasatiempo2 || null,
      razSoc:       form.razSoc   || null,
      regSoc:       form.regSoc   || null,
      repLegal:     form.repLegal || null,
      rfc:          form.rfc.toUpperCase() || null,
      regFis:       form.regFis   || null,
      direccion:    form.direccion || null,
      noExterior:   form.noExterior || null,
      colonia:      form.colonia  || null,
      codPos:       form.codPos   || null,
      ciudad:       form.ciudad   || null,
      estado:       form.estado   || null,
      municipio:    form.municipio || null,
      lada:         form.lada     || null,
      telefono:     form.telefono || null,
      movil:        form.movil    || null,
      ladaOf:       form.ladaOf   || null,
      telOficina:   form.telOficina || null,
      extTelOfi:    form.extTelOfi || null,
      email:        form.email    || null,
      email2:       form.email2   || null,
      redSoc1:      form.redSoc1  || null,
      redSoc2:      form.redSoc2  || null,
      redSoc3:      form.redSoc3  || null,
      formaPago:    form.formaPago || null,
      ctaPagadora:  form.ctaPagadora || null,
      limCred:      form.limCred !== "" ? parseFloat(form.limCred) : null,
      dias:         form.dias !== "" ? parseInt(form.dias) : null,
      tipo:         form.tipo || "P",
      convenio:     form.convenio,
      clasif:       form.clasif   || null,
      fechaNac:     form.fechaNac ? new Date(form.fechaNac).toISOString() : null,
      fechaAlta:    form.fechaAlta ? new Date(form.fechaAlta).toISOString() : null,
      noId:         form.noId     || null,
      observaciones: form.observaciones || null,
    };
  }

  // ─── Imagen ───────────────────────────────────────────────────────────────

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImgPreview(ev.target.result);
      setImgDirty(true);
    };
    reader.readAsDataURL(file);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const rfcBloqueado = form.rfc.toUpperCase() === RFC_GENERICO;
  const showConvenio = form.tipo === "CS";

  return (
    <div className="page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Registro de <span>Códigos</span></h1>
          <p className="page-subtitle">Maestro de clientes, proveedores y contactos</p>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button className="btn btn--secondary" onClick={loadSiguiente} disabled={loading}>
            Nuevo
          </button>
          <button className="btn btn--primary" onClick={handleGuardar} disabled={loading}>
            {loading ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>

      {/* Selector de agencia — solo visible cuando el usuario no tiene agencySchema en el token */}
      {!user?.agencySchema && (
        <div style={{
          marginBottom: "1rem",
          padding: "0.75rem 1rem",
          borderRadius: "var(--p-radius)",
          background: selectedSchema ? "var(--p-green-light)" : "var(--p-red-light)",
          border: `1px solid ${selectedSchema ? "#bbf7d0" : "var(--p-red-border)"}`,
          color: selectedSchema ? "var(--p-green)" : "var(--p-red)",
          fontSize: "0.875rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          flexWrap: "wrap",
        }}>
          {selectedSchema
            ? <>Agencia activa: <strong>{selectedSchema}</strong></>
            : <>Tu cuenta no tiene agencia asignada. Ingresa el nombre del schema de la agencia para operar:</>
          }
          <form onSubmit={e => { e.preventDefault(); setSelectedSchema(schemaDraft.trim() || null); }}
            style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
            <input
              className="form-input"
              style={{ width: "10rem", fontSize: "0.85rem", padding: "0.3rem 0.6rem" }}
              placeholder="ej: kia_chihuahua"
              value={schemaDraft}
              onChange={e => setSchemaDraft(e.target.value)}
            />
            <button type="submit" className="btn btn--primary" style={{ padding: "0.3rem 0.8rem", fontSize: "0.85rem" }}>
              Aplicar
            </button>
          </form>
        </div>
      )}

      {/* Barra de búsqueda */}
      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="card-body" style={{ padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="form-input"
            style={{ width: "9rem", flexShrink: 0 }}
            value={busqTipo}
            onChange={handleBusqTipoChange}
          >
            <option value="nombre">Por nombre</option>
            <option value="razon">Por razón social</option>
            <option value="rfc">Por RFC</option>
          </select>
          <input
            className="form-input"
            style={{ flex: 1, minWidth: "12rem" }}
            placeholder="Buscar…"
            value={busqTerm}
            onChange={handleBusqChange}
            autoComplete="off"
          />
          {busqTerm && (
            <button className="btn btn--secondary" onClick={() => { setBusqTerm(""); setBusqResults(null); }} style={{ flexShrink: 0 }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Resultados de búsqueda */}
      {busqResults && (
        <div className="card" style={{ marginBottom: "1.25rem" }}>
          <div className="card-header">
            <span className="card-title">{busqResults.total} resultado(s)</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--p-surface-2)" }}>
                  {["Código","Nombre / Razón Social","RFC","Tipo","Email"].map(h => (
                    <th key={h} style={{ padding: "0.5rem 1rem", textAlign: "left", borderBottom: "1px solid var(--p-border)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {busqResults.rows.map((r) => (
                  <tr
                    key={r.codigo}
                    onClick={() => cargarCodigo(r.codigo)}
                    style={{ cursor: "pointer", borderBottom: "1px solid var(--p-border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--p-blue-light)"}
                    onMouseLeave={e => e.currentTarget.style.background = ""}
                  >
                    <td style={{ padding: "0.5rem 1rem", fontFamily: "monospace" }}>{r.codigo}</td>
                    <td style={{ padding: "0.5rem 1rem" }}>
                      {r.razSoc || [r.paterno, r.materno, r.nombre].filter(Boolean).join(" ")}
                    </td>
                    <td style={{ padding: "0.5rem 1rem" }}>{r.rfc}</td>
                    <td style={{ padding: "0.5rem 1rem" }}>{r.tipo}</td>
                    <td style={{ padding: "0.5rem 1rem" }}>{r.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Status */}
      {status && (
        <div style={{
          marginBottom: "1rem",
          padding: "0.75rem 1rem",
          borderRadius: "var(--p-radius)",
          background: status.type === "success" ? "var(--p-green-light)" : "var(--p-red-light)",
          color: status.type === "success" ? "var(--p-green)" : "var(--p-red)",
          border: `1px solid ${status.type === "success" ? "#bbf7d0" : "var(--p-red-border)"}`,
          fontSize: "0.875rem",
        }}>
          {status.msg}
        </div>
      )}

      {/* Formulario principal */}
      <div className="card">
        <div className="card-body">

          {/* Fila 1: Código + Toggle */}
          <div style={{ display: "grid", gridTemplateColumns: "10rem 1fr", gap: "1rem", marginBottom: "1.25rem", alignItems: "end" }}>
            <Field label="Código">
              <Input name="codigo" value={form.codigo} onChange={handleChange} disabled style={{ fontFamily: "monospace", fontWeight: 700 }} />
            </Field>

            <div>
              <label className="form-label">Tipo de persona</label>
              <div style={{ display: "flex", gap: "1rem", marginTop: "0.25rem" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                  <input type="radio" checked={!esMoral} onChange={() => handleToggleMoral(false)} />
                  <span>Persona Física</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer" }}>
                  <input type="radio" checked={esMoral} onChange={() => handleToggleMoral(true)} />
                  <span>Persona Moral</span>
                </label>
              </div>
            </div>
          </div>

          {/* Grid de campos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.85rem" }}>

            {/* ── Identidad ─────────────────────────────────────────────── */}
            <SectionTitle>Identidad</SectionTitle>

            {!esMoral ? (
              <>
                {/* Persona Física */}
                <Field label="Apellido Paterno" error={errors.paterno}>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <Input name="paterno" value={form.paterno} onChange={handleChange}
                      disabled={modo === "edicion" && !nombreEnabled} maxLength={100} />
                    {modo === "edicion" && !nombreEnabled && (
                      <button type="button" title="Modificar nombre (MODCODIGO)" onClick={handleModcodigoClick}
                        style={{ background: "none", border: "1px solid var(--p-border)", borderRadius: 6, padding: "0 0.4rem", cursor: "pointer", fontSize: "0.8rem", height: "2rem" }}>
                        ✎
                      </button>
                    )}
                  </div>
                </Field>
                <Field label="Apellido Materno">
                  <Input name="materno" value={form.materno} onChange={handleChange} disabled={modo === "edicion" && !nombreEnabled} maxLength={100} />
                </Field>
                <Field label="Nombre(s)">
                  <Input name="nombre" value={form.nombre} onChange={handleChange} disabled={modo === "edicion" && !nombreEnabled} maxLength={100} />
                </Field>
                <Field label="CURP" error={errors.curp}>
                  <Input name="curp" value={form.curp} onChange={e => handleChange({ target: { name: "curp", value: e.target.value.toUpperCase() } })} maxLength={18} />
                </Field>
                <Field label="Sexo">
                  <Select name="sexo" value={form.sexo} onChange={handleChange}>
                    <option value="M">M — Masculino</option>
                    <option value="F">F — Femenino</option>
                    <option value="O">O — Otro</option>
                  </Select>
                </Field>
                <Field label="Escolaridad">
                  <Select name="escolaridad" value={form.escolaridad} onChange={handleChange}>
                    {cats?.escolaridades?.map(e => <option key={e.clave} value={e.clave}>{e.clave} — {e.descrip}</option>)}
                  </Select>
                </Field>
                <Field label="Estado Civil">
                  <Select name="edoCivil" value={form.edoCivil} onChange={handleChange}>
                    {cats?.estadosCiviles?.map(e => <option key={e.clave} value={e.clave}>{e.clave} — {e.descrip}</option>)}
                  </Select>
                </Field>
                <Field label="Título">
                  <Select name="titulo" value={form.titulo} onChange={handleChange}>
                    {cats?.titulos?.map(t => <option key={t.clave} value={t.clave}>{t.clave} — {t.descrip}</option>)}
                  </Select>
                </Field>
              </>
            ) : (
              <>
                {/* Persona Moral */}
                <Field label="Razón Social" error={errors.razSoc} style={{ gridColumn: "span 2" }}>
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <Input name="razSoc" value={form.razSoc} onChange={handleChange}
                      disabled={modo === "edicion" && !nombreEnabled} maxLength={200} />
                    {modo === "edicion" && !nombreEnabled && (
                      <button type="button" title="Modificar razón social (MODCODIGO)" onClick={handleModcodigoClick}
                        style={{ background: "none", border: "1px solid var(--p-border)", borderRadius: 6, padding: "0 0.4rem", cursor: "pointer", fontSize: "0.8rem", height: "2rem" }}>
                        ✎
                      </button>
                    )}
                  </div>
                </Field>
                <Field label="Régimen Societario">
                  <Select name="regSoc" value={form.regSoc} onChange={handleChange}>
                    {cats?.regimenSoc?.map(r => <option key={r.cRegimenSoc} value={r.cRegimenSoc}>{r.abreviatura} — {r.regimenSocietario}</option>)}
                  </Select>
                </Field>
                <Field label="Representante Legal">
                  <Input name="repLegal" value={form.repLegal} onChange={handleChange} maxLength={200} />
                </Field>
              </>
            )}

            {/* ── RFC / Fiscal ─────────────────────────────────────────── */}
            <SectionTitle>RFC / Fiscal</SectionTitle>

            <Field label="RFC" error={errors.rfc}>
              <Input name="rfc" value={form.rfc} onChange={e => handleChange({ target: { name: "rfc", value: e.target.value.toUpperCase() } })}
                maxLength={13} placeholder={esMoral ? "12 caracteres" : "13 caracteres"} />
            </Field>
            <Field label="Régimen Fiscal">
              <Select name="regFis" value={form.regFis} onChange={handleChange} disabled={rfcBloqueado}>
                {cats?.regimenFiscal
                  ?.filter(r => esMoral ? r.moral : r.fisica)
                  .map(r => <option key={r.cRegimenFiscal} value={r.cRegimenFiscal}>{r.cRegimenFiscal} — {r.regimenFiscal}</option>)}
              </Select>
            </Field>
            <Field label="No. ID">
              <Input name="noId" value={form.noId} onChange={handleChange} maxLength={50} placeholder="INE, pasaporte…" />
            </Field>

            {/* ── Dirección ────────────────────────────────────────────── */}
            <SectionTitle>Dirección</SectionTitle>

            <Field label="Dirección" style={{ gridColumn: "span 2" }}>
              <Input name="direccion" value={form.direccion} onChange={handleChange} maxLength={200} />
            </Field>
            <Field label="No. Exterior">
              <Input name="noExterior" value={form.noExterior} onChange={handleChange} maxLength={20} />
            </Field>
            <Field label="Código Postal" error={errors.codPos}>
              <Input name="codPos" value={form.codPos} onChange={handleChange} maxLength={5} disabled={rfcBloqueado} />
            </Field>
            <Field label="Colonia">
              {colonias.length > 0 ? (
                <Select name="colonia" value={form.colonia} onChange={handleChange}>
                  {colonias.map(c => <option key={c.nomColonia} value={c.nomColonia}>{c.nomColonia}</option>)}
                </Select>
              ) : (
                <Input name="colonia" value={form.colonia} onChange={handleChange} maxLength={100} />
              )}
            </Field>
            <Field label="Ciudad">
              <Input name="ciudad" value={form.ciudad} onChange={handleChange} maxLength={100} />
            </Field>
            <Field label="Estado">
              <Select name="estado" value={form.estado} onChange={handleChange}>
                {cats?.estados?.map(e => <option key={e.codEstado} value={e.codEstado}>{e.codEstado} — {e.nombreEstado}</option>)}
              </Select>
            </Field>
            <Field label="Municipio">
              <Input name="municipio" value={form.municipio} onChange={handleChange} maxLength={100} />
            </Field>

            {/* ── Contacto ─────────────────────────────────────────────── */}
            <SectionTitle>Contacto</SectionTitle>

            <Field label="Lada" error={errors.lada}>
              <Input name="lada" value={form.lada} onChange={handleChange} maxLength={3} placeholder="614" />
            </Field>
            <Field label="Teléfono" error={errors.telefono}>
              <Input name="telefono" value={form.telefono} onChange={handleChange} maxLength={20} />
            </Field>
            <Field label="Móvil">
              <Input name="movil" value={form.movil} onChange={handleChange} maxLength={20} />
            </Field>
            <Field label="Lada Oficina" error={errors.ladaOf}>
              <Input name="ladaOf" value={form.ladaOf} onChange={handleChange} maxLength={3} />
            </Field>
            <Field label="Tel. Oficina" error={errors.telOficina}>
              <Input name="telOficina" value={form.telOficina} onChange={handleChange} maxLength={20} />
            </Field>
            <Field label="Extensión">
              <Input name="extTelOfi" value={form.extTelOfi} onChange={handleChange} maxLength={10} />
            </Field>
            <Field label="Email" error={errors.email}>
              <Input name="email" type="email" value={form.email} onChange={handleChange} maxLength={100} />
            </Field>
            <Field label="Email 2" error={errors.email2}>
              <Input name="email2" type="email" value={form.email2} onChange={handleChange} maxLength={100} />
            </Field>
            <Field label="Red Social 1 (Facebook)">
              <Input name="redSoc1" value={form.redSoc1} onChange={handleChange} maxLength={200} />
            </Field>
            <Field label="Red Social 2 (Twitter/X)">
              <Input name="redSoc2" value={form.redSoc2} onChange={handleChange} maxLength={200} />
            </Field>

            {/* ── Comercial ────────────────────────────────────────────── */}
            <SectionTitle>Comercial</SectionTitle>

            <Field label="Tipo">
              <Select name="tipo" value={form.tipo} onChange={handleChange}>
                {cats?.tipos?.map(t => <option key={t.tipo} value={t.tipo}>{t.tipo} — {t.descrip}</option>)}
              </Select>
            </Field>
            {showConvenio && (
              <Field label="Convenio">
                <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.3rem", cursor: "pointer" }}>
                  <input type="checkbox" name="convenio" checked={form.convenio} onChange={handleChange} />
                  <span>Tiene convenio</span>
                </label>
              </Field>
            )}
            <Field label="Forma de Pago">
              <Select name="formaPago" value={form.formaPago} onChange={handleChange}>
                {cats?.formasPago?.map(f => <option key={f.clave} value={f.clave}>{f.clave} — {f.descrip}</option>)}
              </Select>
            </Field>
            <Field label="Límite de Crédito">
              <Input name="limCred" type="number" value={form.limCred} onChange={handleChange} placeholder="0.00" />
            </Field>
            <Field label="Días de Crédito">
              <Input name="dias" type="number" value={form.dias} onChange={handleChange} placeholder="0" />
            </Field>
            <Field label="Clasificación">
              <Select name="clasif" value={form.clasif} onChange={handleChange}>
                {cats?.comCred?.map(c => <option key={c.clasif} value={c.clasif}>{c.clasif} — {c.descrip}</option>)}
              </Select>
            </Field>

            {/* ── Personal (solo física) ───────────────────────────────── */}
            {!esMoral && (
              <>
                <SectionTitle>Personal</SectionTitle>
                <Field label="Fecha de Nacimiento">
                  <Input name="fechaNac" type="date" value={form.fechaNac} onChange={handleChange} />
                </Field>
                <Field label="Fecha de Alta">
                  <Input name="fechaAlta" type="date" value={form.fechaAlta} onChange={handleChange} />
                </Field>
                <Field label="Pasatiempo 1">
                  <Input name="pasatiempo1" value={form.pasatiempo1} onChange={handleChange} maxLength={100} />
                </Field>
                <Field label="Pasatiempo 2">
                  <Input name="pasatiempo2" value={form.pasatiempo2} onChange={handleChange} maxLength={100} />
                </Field>
              </>
            )}

            {/* ── Observaciones ────────────────────────────────────────── */}
            <SectionTitle>Notas</SectionTitle>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Observaciones</label>
              <textarea
                className="form-input"
                name="observaciones"
                value={form.observaciones}
                onChange={handleChange}
                rows={3}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* ── Imagen de ID ─────────────────────────────────────────── */}
            <SectionTitle>Imagen de Identificación</SectionTitle>

            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "1.5rem", alignItems: "flex-start", flexWrap: "wrap" }}>
              {imgPreview && (
                <img
                  src={imgPreview}
                  alt="ID"
                  style={{ width: 160, height: 100, objectFit: "cover", borderRadius: 8, border: "1px solid var(--p-border)" }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileSelect} />
                <button type="button" className="btn btn--secondary" onClick={() => fileRef.current?.click()}>
                  {imgPreview ? "Cambiar imagen" : "Seleccionar imagen"}
                </button>
                {imgPreview && (
                  <button type="button" className="btn btn--secondary" style={{ color: "var(--p-red)" }}
                    onClick={() => { setImgPreview(null); setImgDirty(true); }}>
                    Quitar imagen
                  </button>
                )}
                {imgDirty && <span style={{ fontSize: "0.75rem", color: "var(--p-text-3)" }}>⚠ Sin guardar</span>}
              </div>
            </div>

          </div>{/* fin grid */}
        </div>
      </div>

      {/* ── Diálogo: Confirmar sobreescritura (409) ──────────────────────────── */}
      {confirmDialog && (
        <div style={OVERLAY_STYLE}>
          <div style={DIALOG_STYLE}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>El código ya existe</h3>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.875rem", color: "var(--p-text-2)" }}>
              Código <strong>{confirmDialog.existing.codigo}</strong> —{" "}
              {confirmDialog.existing.razSoc || [confirmDialog.existing.paterno, confirmDialog.existing.nombre].filter(Boolean).join(" ")}
              {confirmDialog.existing.rfc && <> &nbsp;·&nbsp; RFC: {confirmDialog.existing.rfc}</>}
            </p>
            <p style={{ fontSize: "0.875rem" }}>¿Deseas sobrescribir los datos existentes?</p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button className="btn btn--secondary" onClick={() => setConfirmDialog(null)}>Cancelar</button>
              <button className="btn btn--primary" onClick={handleConfirmarUpsert} disabled={loading}>
                {loading ? "Guardando…" : "Sí, sobrescribir"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Diálogo: Guard MODCODIGO ─────────────────────────────────────────── */}
      {modcodigoDialog && (
        <div style={OVERLAY_STYLE}>
          <div style={DIALOG_STYLE}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Modificar Nombre / Razón Social</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--p-text-2)", margin: "0 0 1rem" }}>
              {isAdmin
                ? "Esta acción requiere autorización. ¿Deseas habilitar la edición del nombre?"
                : "No tienes permisos para modificar el nombre o razón social (MODCODIGO). Contacta al administrador."}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
              <button className="btn btn--secondary" onClick={() => setModcodigoDialog(false)}>Cerrar</button>
              {isAdmin && (
                <button className="btn btn--primary" onClick={confirmModcodigo}>Habilitar edición</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const OVERLAY_STYLE = {
  position: "fixed", inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex", alignItems: "center", justifyContent: "center",
  zIndex: 1000,
};

const DIALOG_STYLE = {
  background: "var(--p-surface)",
  border: "1px solid var(--p-border)",
  borderRadius: "var(--p-radius)",
  padding: "1.5rem",
  maxWidth: 440,
  width: "90%",
  boxShadow: "var(--p-shadow-md)",
};
