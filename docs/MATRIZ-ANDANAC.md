# Matriz de Cumplimiento ANDANAC 2026

Checklist vivo basado en los 7 ejes del RFP ANDANAC I.3. Actualizar al avanzar en la implementación.

**Estados:**
- ✅ **Cumplido** — implementado y verificado en el repo
- 🔶 **Parcial** — implementado en parte; hay brechas documentadas
- 🔄 **En proceso** — trabajo activo en este sprint/fase
- 📅 **Planificado** — en el roadmap con fase asignada
- ❌ **No iniciado** — no existe en el repo, sin plan de trabajo asignado

**Última actualización:** 2026-06-03 (post Fase 1-B completa)

---

## Eje 1 — Arquitectura y Plataforma

| Requerimiento | Estado | Evidencia en repo | Notas |
|--------------|--------|-------------------|-------|
| Arquitectura modular (separación por dominio funcional) | 🔶 Parcial | `src/controllers/`, `src/services/`, `src/routes/` — separación por dominio dentro de un único proceso | Módulos definidos pero no desacoplados como servicios independientes |
| API-first: toda operación expuesta vía API REST | 🔶 Parcial | `backend/src/routes/` — 12 rutas | `ordenes.routes.js` accede a ADODB directamente sin abstracción propia |
| Versionamiento de APIs | ❌ No iniciado | — | No hay prefijo `/v1/` en ninguna ruta |
| Frontend PWA | 🔶 Parcial | `frontend/package.json` (`vite-plugin-pwa 1.0.0`), `frontend/vite.config.js` | Plugin instalado; configuración PWA completa [POR CONFIRMAR] |
| Multi-tenant lógico (un tenant por agencia) | 🔶 Parcial | `backend/prisma/schema.prisma` (campo `schema`), `backend/config/schemas.js` | Schema no se valida contra usuario autenticado; schemas hardcodeados |
| Separación de entornos dev/staging/prod | 🔶 Parcial | `backend/.env.example`, `NODE_ENV` validado con Zod, `JWT_SECRET` y `LOG_LEVEL` por entorno | Dev/prod separados; entorno staging no existe |
| Health check / estado del servicio | ✅ Cumplido | `GET /api/health` — responde `{ status, version, uptime, db }`, público para monitoreo externo | Implementado en Fase 1-B Semana 3 |

---

## Eje 2 — Base de Datos

| Requerimiento | Estado | Evidencia en repo | Notas |
|--------------|--------|-------------------|-------|
| Motor de BD relacional (PostgreSQL) | ✅ Cumplido | `backend/package.json` (`pg`, `@prisma/client`), `prisma/schema.prisma` | PostgreSQL como motor principal |
| Schema separado por agencia (aislamiento de datos) | ✅ Cumplido | BD CFDI remota: schemas `kia_zacatecas`, `kia_celaya`, `kia_lomas` | Dato físico aislado por schema en BD CFDI |
| Migraciones versionadas | ✅ Cumplido | `backend/prisma/migrations/` (6 migraciones) | Solo aplica a BD local; BD remota CFDI sin sistema de migración formal |
| Índices en campos de consulta frecuente | ✅ Cumplido | `schema.prisma` — índices en `[schema, fechaEmision]`, `[schema, tipo]`, `[schema, categoriaIa]` | Solo en tablas CFDI de BD local |
| Modelo de datos para módulos principales (CFDI, Unidades, Facturación) | 🔶 Parcial | CFDI: `CfdiEmitido`, `CfdiRecibido`, `SyncEstado` en Prisma | Unidades, Facturación, Socio de Negocios: no existen |
| Backups automáticos de BD | ❌ No iniciado | — | [PENDIENTE DE DEFINIR] política de backups |
| Auditoría de cambios en BD (quién cambió qué) | ❌ No iniciado | — | No hay tablas de auditoría ni triggers |

---

## Eje 3 — Seguridad y Control de Acceso

| Requerimiento | Estado | Evidencia en repo | Notas |
|--------------|--------|-------------------|-------|
| Autenticación con JWT | ✅ Cumplido | `src/middlewares/auth.middleware.js` aplicado en las 12 rutas del backend | Fase 1-B Semana 1 — 100% de rutas protegidas |
| Autorización basada en roles | 🔶 Parcial | `frontend/src/components/RoleProtectedRoute.jsx` | Solo en frontend; el backend no valida roles aún |
| Roles con semántica de negocio (Administrador, Contador, Ventas, Consulta) | ❌ No iniciado | Roles actuales: `admin/editor/viewer` | Roles de negocio ANDANAC no implementados |
| Validación de tenant en cada request (usuario solo ve datos de su agencia) | ✅ Cumplido | Campo `agencySchema` en `User`, middleware inyecta `req.tenantSchema` desde JWT, validación de coincidencia schema-request | Fase 1-B Semana 1 |
| HTTPS en todos los entornos de no-desarrollo | ❌ No iniciado | — | [PENDIENTE DE DEFINIR] |
| CORS restrictivo (allowlist de orígenes) | ❌ No iniciado | `backend/index.js`: `app.use(cors())` sin configuración | Único checkbox pendiente de Semana 1 |
| Rate limiting | ✅ Cumplido | `express-rate-limit` aplicado en todas las rutas | Fase 1-B Semana 1 |
| Contraseñas hasheadas | ✅ Cumplido | `src/controllers/auth.controller.js` (`bcrypt.compare`), `src/models/user.model.js` | bcryptjs con hash correcto |
| Secrets fuera del repositorio | ✅ Cumplido | `.gitignore` incluye `.env`; `JWT_SECRET` rotado a 64 chars aleatorios | Fase 1-B Semana 1 — secreto fuerte activo |
| Bitácora de auditoría de operaciones | ❌ No iniciado | — | No hay logging de operaciones por usuario |
| Expiración de sesión / refresh token | 🔶 Parcial | JWT expira en `1h` | Sin refresh token; sin estrategia de renovación |

---

## Eje 4 — Integraciones y Conectividad

| Requerimiento | Estado | Evidencia en repo | Notas |
|--------------|--------|-------------------|-------|
| Integración CFDI / SAT | 🔶 Parcial | `src/services/cfdiSync.service.js` — ETL desde BD remota | Indirecto: los CFDI vienen ya procesados de BD legacy; no hay descarga directa al SAT |
| Integración Nissan APIs (REST) | ❌ No iniciado | — | No existe en repo |
| Integración FPV (eventos de flotillas) | ❌ No iniciado | — | No existe en repo |
| Integración AutoVHC (SOAP, inspección vehículos) | ❌ No iniciado | — | No existe en repo |
| Integración Symmetrical (FTP) | ❌ No iniciado | — | No existe en repo |
| Integración Portal Seminuevos (archivo diario) | ❌ No iniciado | — | No existe en repo |
| Manejo de errores en integraciones externas | 🔶 Parcial | `try/catch` en servicios CFDI | Sin circuit breaker, sin retry, sin alertas |
| Convivencia con sistema legacy (migración progresiva) | 🔶 Parcial | `src/db.js` (ADODB → Access legacy), BD CFDI remota | No hay capa de abstracción formal para el legacy |

---

## Eje 5 — Automatización de Procesos

| Requerimiento | Estado | Evidencia en repo | Notas |
|--------------|--------|-------------------|-------|
| Proceso automático de descarga/sync de CFDI | ✅ Cumplido | `src/jobs/cfdiCron.ts` — sincroniza todos los schemas en schedule configurable (`CFDI_CRON_SCHEDULE`) | Fase 1-B Semana 3 |
| Clasificación contable automática de CFDI con IA | 🔶 Parcial | `src/helpers/cfdiClassifier.js` (GPT-4o-mini), `src/jobs/clasificarMasivo.js` | La clasificación funciona pero se dispara manualmente vía HTTP |
| Alertas automáticas (vencimientos, errores de sync) | ❌ No iniciado | — | No existe |
| Procesos programados (cron jobs) | ✅ Cumplido | `node-cron` instalado; `cfdiCron.ts` activo, habilitado por `CFDI_CRON_ENABLED=true` | Fase 1-B Semana 3 |
| ETL de datos legacy hacia nuevo stack | 🔶 Parcial | `cfdiSync.service.js` — ETL de CFDI | Solo para CFDI; el resto de módulos no tiene ETL |
| Procesamiento por lotes (batch) | ✅ Cumplido | `clasificarMasivo.js` — procesamiento en lotes de 50 CFDIs | Implementado para clasificación CFDI |

---

## Eje 6 — Reportes y Explotación

| Requerimiento | Estado | Evidencia en repo | Notas |
|--------------|--------|-------------------|-------|
| Dashboard de CFDI (emitidos, recibidos, tendencias) | ✅ Cumplido | `frontend/src/pages/CfdiDashboard.jsx`, `src/controllers/cfdiDashboard.controller.js` | Series mensuales, top clientes/proveedores, categorías IA |
| Exportación a Excel | ✅ Cumplido | `frontend/src/utils/exportToExcel.js`, `exportVencimientosExcelJS.js` | Implementado con ExcelJS |
| Filtros avanzados en consultas CFDI | ✅ Cumplido | `src/routes/cfdi.routes.js` — filtros: mes, año, tipo, RFC, monto, categoriaIa | Paginación incluida |
| Dashboard de vencimientos de cartera | 🔶 Parcial | `frontend/src/pages/VencimientosDashboard.jsx` — página existe | Consulta BD remota, sin dashboard analítico robusto |
| Dashboard operativo de unidades | ❌ No iniciado | — | Módulo Unidades pendiente |
| Dashboard multi-agencia (vista consolidada) | ❌ No iniciado | — | Cada schema se consulta por separado; sin vista consolidada |
| Reportes de auditoría y accesos | ❌ No iniciado | — | No existe bitácora de auditoría |

---

## Eje 7 — Continuidad Operativa

| Requerimiento | Estado | Evidencia en repo | Notas |
|--------------|--------|-------------------|-------|
| Convivencia con legacy durante migración | 🔶 Parcial | Órdenes vía ADODB, CFDI vía BD remota | Sin documentación formal del plan de convivencia |
| Rollback de módulos | ❌ No iniciado | — | Sin estrategia de rollback documentada ni implementada |
| Tests automatizados | 🔶 Parcial | Vitest — 19 tests en 3 archivos: auth middleware, cfdiSync service, cfdiClassifier | Fase 1-B Semana 4 — núcleo cubierto; sin tests de controllers, rutas ni frontend |
| Pipeline CI/CD | 🔶 Parcial | `.github/workflows/ci.yml` — backend tests + frontend lint en push/PR a main | Fase 1-B Semana 4 — CI activo; CD (deploy automático) no implementado |
| Monitoreo y alertas de producción | 🔶 Parcial | Pino logging estructurado JSON; `GET /api/health`; nivel configurable por `LOG_LEVEL` | Sin APM ni agregador de logs centralizado |
| Plan de recuperación ante desastres | ❌ No iniciado | — | [PENDIENTE DE DEFINIR] |
| Documentación técnica actualizada | ✅ Cumplido | CLAUDE.md, TECNICO.md, HITOS.md, BITACORA.md, DESPLIEGUE.md, MATRIZ-ANDANAC.md | Kit completo, actualizado al cierre de Fase 1-B |
| SLA de disponibilidad definido | ❌ No iniciado | — | [PENDIENTE DE DEFINIR] |

---

## Resumen por eje

| Eje | Cumplido | Parcial | En proceso | Planificado | No iniciado |
|-----|:--------:|:-------:|:----------:|:-----------:|:-----------:|
| 1. Arquitectura y Plataforma | 1 | 5 | 0 | 0 | 1 |
| 2. Base de Datos | 4 | 1 | 0 | 0 | 2 |
| 3. Seguridad y Control de Acceso | 5 | 2 | 0 | 0 | 4 |
| 4. Integraciones y Conectividad | 0 | 3 | 0 | 0 | 5 |
| 5. Automatización de Procesos | 3 | 2 | 0 | 0 | 1 |
| 6. Reportes y Explotación | 3 | 2 | 0 | 0 | 2 |
| 7. Continuidad Operativa | 1 | 5 | 0 | 0 | 2 |
| **TOTAL** | **17** | **20** | **0** | **0** | **17** |

> **Cobertura actual:** 17 cumplidos + 20 parciales de 54 requerimientos identificados (+7 cumplidos vs auditoría inicial del 2 jun). Los ejes de mayor brecha son Integraciones OEM y Continuidad Operativa (CI/CD completo, backups, rollback).

---

> **Nota:** Esta matriz se basa en los 7 ejes documentados en el contexto del proyecto. Los requerimientos específicos y su ponderación en el RFP ANDANAC I.3 oficial pueden diferir. Validar contra el documento oficial cuando esté disponible y ajustar este checklist.
