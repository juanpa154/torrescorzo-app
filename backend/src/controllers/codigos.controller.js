const logger = require('../config/logger').default;
const {
  getSiguiente,
  buscarCodigos,
  getCodigo,
  createCodigo,
  updateCodigo,
  updateNombre,
  getImagen,
  saveImagen,
  getCatalogos,
  getColoniasPorCp,
} = require('../models/codigos.model');

const RFC_GENERICO = 'XAXX010101000';

// GET /api/v1/codigos/siguiente
const siguiente = async (req, res) => {
  try {
    const agencySchema = req.tenantSchema;
    if (!agencySchema) return res.status(400).json({ error: 'Agencia no definida en el token' });

    const codigo = await getSiguiente(agencySchema);
    res.json({ codigo });
  } catch (err) {
    logger.error({ err }, 'Error al obtener siguiente código');
    res.status(500).json({ error: 'Error interno' });
  }
};

// GET /api/v1/codigos/buscar?q=&tipo=nombre|razon|rfc&limit=&offset=
const buscar = async (req, res) => {
  try {
    const agencySchema = req.tenantSchema;
    if (!agencySchema) return res.status(400).json({ error: 'Agencia no definida en el token' });

    const result = await buscarCodigos(agencySchema, req.validatedQuery);
    res.json(result);
  } catch (err) {
    logger.error({ err }, 'Error en búsqueda de códigos');
    res.status(500).json({ error: 'Error interno' });
  }
};

// GET /api/v1/codigos/:codigo
const getOne = async (req, res) => {
  try {
    const agencySchema = req.tenantSchema;
    if (!agencySchema) return res.status(400).json({ error: 'Agencia no definida en el token' });

    const { codigo } = req.params;
    if (codigo === '99999') return res.status(400).json({ error: 'Código reservado' });

    const record = await getCodigo(agencySchema, codigo.padStart(5, '0'));
    if (!record) return res.status(404).json({ error: 'Código no encontrado' });

    // Si el RFC es genérico, informar al frontend para bloquear los campos correspondientes
    res.json({
      ...record,
      _rfcGenerico: record.rfc === RFC_GENERICO,
    });
  } catch (err) {
    logger.error({ err }, 'Error al obtener código');
    res.status(500).json({ error: 'Error interno' });
  }
};

// POST /api/v1/codigos
// Body validado por validateBody(codigoBodySchema) en la ruta
// req.body ya contiene el código (vendrá como `codigo` en el body, generado por el frontend vía /siguiente)
const create = async (req, res) => {
  try {
    const agencySchema = req.tenantSchema;
    if (!agencySchema) return res.status(400).json({ error: 'Agencia no definida en el token' });

    const { codigo, ...data } = req.body;
    if (!codigo) return res.status(400).json({ error: 'El campo codigo es requerido' });
    if (codigo === '99999') return res.status(400).json({ error: 'Código reservado' });

    const padded = String(codigo).padStart(5, '0');

    // Verificar si ya existe — devolver 409 para que el frontend muestre confirmación
    const existing = await getCodigo(agencySchema, padded);
    if (existing) {
      return res.status(409).json({
        error: 'El código ya existe',
        existing: {
          codigo: existing.codigo,
          nombre: existing.nombre,
          paterno: existing.paterno,
          razSoc: existing.razSoc,
          rfc: existing.rfc,
        },
      });
    }

    // Aplicar regla RFC genérico → régimen fiscal 616 forzado
    if (data.rfc === RFC_GENERICO) {
      data.regFis = '616';
    }

    const created = await createCodigo(agencySchema, padded, data);
    logger.info({ agencySchema, codigo: padded, user: req.user?.email }, 'Código creado');
    res.status(201).json(created);
  } catch (err) {
    logger.error({ err }, 'Error al crear código');
    res.status(500).json({ error: 'Error interno' });
  }
};

// POST /api/v1/codigos/:codigo/confirmar  — upsert cuando ya existe y el usuario confirma
const confirmar = async (req, res) => {
  try {
    const agencySchema = req.tenantSchema;
    if (!agencySchema) return res.status(400).json({ error: 'Agencia no definida en el token' });

    const padded = String(req.params.codigo).padStart(5, '0');
    if (padded === '99999') return res.status(400).json({ error: 'Código reservado' });

    const { ...data } = req.body;

    if (data.rfc === RFC_GENERICO) data.regFis = '616';

    const updated = await updateCodigo(agencySchema, padded, data);
    logger.info({ agencySchema, codigo: padded, user: req.user?.email }, 'Código actualizado (confirmación upsert)');
    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'Error al confirmar código');
    res.status(500).json({ error: 'Error interno' });
  }
};

// PUT /api/v1/codigos/:codigo
const update = async (req, res) => {
  try {
    const agencySchema = req.tenantSchema;
    if (!agencySchema) return res.status(400).json({ error: 'Agencia no definida en el token' });

    const padded = String(req.params.codigo).padStart(5, '0');
    if (padded === '99999') return res.status(400).json({ error: 'Código reservado' });

    const exists = await getCodigo(agencySchema, padded);
    if (!exists) return res.status(404).json({ error: 'Código no encontrado' });

    if (req.body.rfc === RFC_GENERICO) req.body.regFis = '616';

    const updated = await updateCodigo(agencySchema, padded, req.body);
    logger.info({ agencySchema, codigo: padded, user: req.user?.email }, 'Código actualizado');
    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'Error al actualizar código');
    res.status(500).json({ error: 'Error interno' });
  }
};

// PUT /api/v1/codigos/:codigo/nombre  — requiere MODCODIGO (solo admin)
const updateNombreHandler = async (req, res) => {
  try {
    const agencySchema = req.tenantSchema;
    if (!agencySchema) return res.status(400).json({ error: 'Agencia no definida en el token' });

    const padded = String(req.params.codigo).padStart(5, '0');

    const exists = await getCodigo(agencySchema, padded);
    if (!exists) return res.status(404).json({ error: 'Código no encontrado' });

    const updated = await updateNombre(agencySchema, padded, req.body);
    logger.info({ agencySchema, codigo: padded, user: req.user?.email }, 'Nombre/razón social actualizado (MODCODIGO)');
    res.json(updated);
  } catch (err) {
    logger.error({ err }, 'Error al actualizar nombre');
    res.status(500).json({ error: 'Error interno' });
  }
};

// GET /api/v1/codigos/catalogos — todos los catálogos en una sola llamada
const catalogos = async (_req, res) => {
  try {
    const data = await getCatalogos();
    res.json(data);
  } catch (err) {
    logger.error({ err }, 'Error al obtener catálogos');
    res.status(500).json({ error: 'Error interno' });
  }
};

// GET /api/v1/codigos/catalogos/colonias?cp=12345
const coloniasPorCp = async (req, res) => {
  try {
    const { cp } = req.query;
    if (!cp || !/^\d{5}$/.test(cp)) {
      return res.status(400).json({ error: 'CP inválido (debe tener 5 dígitos)' });
    }
    const colonias = await getColoniasPorCp(cp);
    res.json(colonias);
  } catch (err) {
    logger.error({ err }, 'Error al obtener colonias');
    res.status(500).json({ error: 'Error interno' });
  }
};

// GET /api/v1/codigos/:codigo/imagen
const getImagenHandler = async (req, res) => {
  try {
    const agencySchema = req.tenantSchema;
    if (!agencySchema) return res.status(400).json({ error: 'Agencia no definida en el token' });

    const padded = String(req.params.codigo).padStart(5, '0');
    const buffer = await getImagen(agencySchema, padded);
    if (!buffer) return res.status(404).json({ error: 'Sin imagen' });

    const b64 = buffer.toString('base64');
    res.json({ imagen: `data:image/jpeg;base64,${b64}` });
  } catch (err) {
    logger.error({ err }, 'Error al obtener imagen');
    res.status(500).json({ error: 'Error interno' });
  }
};

// PUT /api/v1/codigos/:codigo/imagen  — body: { imagen: 'data:image/...;base64,...' }
const putImagenHandler = async (req, res) => {
  try {
    const agencySchema = req.tenantSchema;
    if (!agencySchema) return res.status(400).json({ error: 'Agencia no definida en el token' });

    const padded = String(req.params.codigo).padStart(5, '0');
    if (!('imagen' in req.body)) return res.status(400).json({ error: 'Campo imagen requerido' });
    const { imagen } = req.body;

    // imagen: null → quitar la imagen existente; string → acepta data URL o base64 puro
    const buffer = imagen ? Buffer.from(imagen.includes(',') ? imagen.split(',')[1] : imagen, 'base64') : null;

    await saveImagen(agencySchema, padded, buffer);
    logger.info({ agencySchema, codigo: padded, user: req.user?.email }, 'Imagen actualizada');
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, 'Error al guardar imagen');
    res.status(500).json({ error: 'Error interno' });
  }
};

module.exports = {
  siguiente,
  buscar,
  getOne,
  create,
  confirmar,
  update,
  updateNombreHandler,
  getImagenHandler,
  putImagenHandler,
  catalogos,
  coloniasPorCp,
};
