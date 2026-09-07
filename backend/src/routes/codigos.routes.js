const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { validateBody, validateQuery } = require('../middlewares/validate');
const { ROLE_GROUPS } = require('../config/roles');
const {
  codigoBodySchema,
  nombreBodySchema,
  buscarQuerySchema,
} = require('../schemas/codigos.schema');
const {
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
} = require('../controllers/codigos.controller');

// ─── Catálogos (sin tenant, datos compartidos) ───────────────────────────────
router.get('/catalogos',          authenticateToken, requireRole(...ROLE_GROUPS.CODIGOS_READ), catalogos);
router.get('/catalogos/colonias', authenticateToken, requireRole(...ROLE_GROUPS.CODIGOS_READ), coloniasPorCp);

// ─── Siguiente código disponible ─────────────────────────────────────────────
router.get('/siguiente', authenticateToken, requireRole(...ROLE_GROUPS.CODIGOS_READ), siguiente);

// ─── Búsqueda ─────────────────────────────────────────────────────────────────
router.get('/buscar', authenticateToken, requireRole(...ROLE_GROUPS.CODIGOS_READ), validateQuery(buscarQuerySchema), buscar);

// ─── Ficha completa ───────────────────────────────────────────────────────────
router.get('/:codigo', authenticateToken, requireRole(...ROLE_GROUPS.CODIGOS_READ), getOne);

// ─── Crear ────────────────────────────────────────────────────────────────────
router.post('/', authenticateToken, requireRole(...ROLE_GROUPS.CODIGOS_WRITE), validateBody(codigoBodySchema), create);

// ─── Upsert confirmado (el frontend confirma sobreescribir código existente) ──
router.post('/:codigo/confirmar', authenticateToken, requireRole(...ROLE_GROUPS.CODIGOS_WRITE), validateBody(codigoBodySchema), confirmar);

// ─── Actualizar (campos no protegidos) ───────────────────────────────────────
router.put('/:codigo', authenticateToken, requireRole(...ROLE_GROUPS.CODIGOS_WRITE), validateBody(codigoBodySchema), update);

// ─── Actualizar nombre/razón social — requiere permiso MODCODIGO (solo admin) ─
router.put('/:codigo/nombre', authenticateToken, requireRole(...ROLE_GROUPS.CODIGOS_MOD_NOMBRE), validateBody(nombreBodySchema), updateNombreHandler);

// ─── Imagen de identificación ────────────────────────────────────────────────
router.get('/:codigo/imagen', authenticateToken, requireRole(...ROLE_GROUPS.CODIGOS_READ),  getImagenHandler);
router.put('/:codigo/imagen', authenticateToken, requireRole(...ROLE_GROUPS.CODIGOS_WRITE), putImagenHandler);

module.exports = router;
