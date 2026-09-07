/**
 * Roles del sistema DMS — Grupo Torres Corzo
 *
 * Cada rol representa un perfil funcional de la agencia.
 * Los roles legacy (editor, viewer) se mantienen por compatibilidad hacia atrás.
 */

const ROLES = {
  // ── Roles actuales ────────────────────────────────────────────────────────
  admin:    'admin',    // Dirección de Sistemas / IT — acceso total
  gerente:  'gerente',  // Gerente de agencia / Director — lectura total, sin ops técnicas
  contador: 'contador', // Contador / Administración — CFDI, sync, IA, empleados
  ventas:   'ventas',   // Asesor / Jefe de ventas — unidades, vencimientos (futuro)
  servicio: 'servicio', // Jefe de servicio / Recepción — órdenes de servicio
  consulta: 'consulta', // Solo lectura — dashboards y reportes

  // ── Legacy (compatibilidad hacia atrás) ──────────────────────────────────
  editor:   'editor',   // Equivalente funcional a contador
  viewer:   'viewer',   // Equivalente funcional a consulta
};

/**
 * Grupos de roles reutilizables para asignar permisos en rutas.
 * Usar estos grupos en requireRole() en lugar de listar roles sueltos.
 */
const ROLE_GROUPS = {
  // Puede leer datos financieros (CFDI, dashboard, sync estado)
  FINANZAS_READ:  [ROLES.admin, ROLES.gerente, ROLES.contador, ROLES.editor, ROLES.consulta, ROLES.viewer],

  // Puede ejecutar operaciones financieras (sync, clasificación IA)
  FINANZAS_WRITE: [ROLES.admin, ROLES.contador, ROLES.editor],

  // Puede leer datos de RR.HH.
  RRHH_READ:      [ROLES.admin, ROLES.gerente, ROLES.contador, ROLES.editor],

  // Puede escribir datos de RR.HH.
  RRHH_WRITE:     [ROLES.admin, ROLES.editor],

  // Puede leer órdenes de servicio
  ORDENES_READ:   [ROLES.admin, ROLES.gerente, ROLES.contador, ROLES.editor, ROLES.servicio, ROLES.consulta, ROLES.viewer],

  // Puede leer vencimientos de cartera
  VENCIMIENTOS_READ: [ROLES.admin, ROLES.gerente, ROLES.contador, ROLES.editor, ROLES.ventas, ROLES.consulta, ROLES.viewer],

  // Puede leer y escribir anuncios
  ANUNCIOS_READ:  [ROLES.admin, ROLES.gerente, ROLES.contador, ROLES.editor, ROLES.ventas, ROLES.servicio, ROLES.consulta, ROLES.viewer],
  ANUNCIOS_WRITE: [ROLES.admin, ROLES.gerente, ROLES.editor],

  // Acceso a configuración general (lectura)
  CONFIG_READ:    [ROLES.admin, ROLES.gerente, ROLES.contador, ROLES.editor],

  // Solo administradores del sistema
  SOLO_ADMIN:     [ROLES.admin],

  // Puede leer el maestro de códigos (clientes/proveedores)
  CODIGOS_READ:   [ROLES.admin, ROLES.gerente, ROLES.contador, ROLES.editor, ROLES.ventas, ROLES.servicio, ROLES.consulta, ROLES.viewer],

  // Puede crear y editar códigos (campos no protegidos)
  CODIGOS_WRITE:  [ROLES.admin, ROLES.contador, ROLES.editor, ROLES.ventas],

  // Puede modificar nombre/razón social — equivalente al permiso MODCODIGO del legacy
  CODIGOS_MOD_NOMBRE: [ROLES.admin],
};

module.exports = { ROLES, ROLE_GROUPS };
