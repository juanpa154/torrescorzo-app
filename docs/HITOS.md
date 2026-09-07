# Roadmap 2026 — SIIA Cloud

## Leyenda de estados

```
- [x]  Completado
- [-]  Parcial — implementado pero con brechas
- [ ]  Pendiente
```

---

## Posición actual en el cronograma

**Fecha de referencia:** 2 de junio de 2026

Estamos al inicio de **Fase 1-B — Endurecimiento del núcleo**. La Fase 1-A (infraestructura base + módulo CFDI) está parcialmente completa. La prioridad actual es construir el núcleo sólido y expandible **antes** de agregar módulos de negocio nuevos.

---

## Fase 1-A — Infraestructura base (Q1–Q2 2026)

**Período:** enero – junio 2026 | **Estado:** EN PROCESO — avance parcial

### Objetivo
Infraestructura base: API CFDI funcional, frontend PWA, autenticación JWT inicial, migraciones de BD.

### Entregables

- [x] API Express funcional con rutas CFDI, empleados, auth
- [x] Módulo CFDI completo (sync ETL + clasificación IA + dashboard)
- [x] Frontend React PWA con rutas protegidas por rol
- [x] Migraciones de BD versionadas con Prisma (6 migraciones)
- [-] Multi-tenant por schema en BD CFDI — schemas en BD remota sí; validación en runtime no
- [ ] JWT aplicado en todas las rutas protegidas del backend — solo 2 de 12 rutas lo tienen
- [ ] Validación de agencia del usuario en JWT — `User` sin campo `agency`; schema en URL
- [ ] API Gateway con rate limiting, logging y auditoría
- [ ] Roles de negocio (Contador, Ventas, Consulta) — hoy solo `admin/editor/viewer`
- [ ] `.env.example` y gestión de secretos por entorno
- [ ] Tests unitarios / integración en módulos críticos
- [ ] Pipeline CI/CD
- [ ] Proceso automático de sincronización CFDI (cron)

---

## Fase 1-B — Endurecimiento del núcleo (junio–julio 2026)

**Período:** junio – julio 2026 | **Estado:** ACTIVO — prioridad actual

### Objetivo
Convertir la base existente en un núcleo sólido, seguro y expandible antes de agregar módulos. Cada módulo nuevo heredará automáticamente seguridad, validación, logging y tests.

---

### Semana 1 — Seguridad básica

- [x] JWT en todas las rutas del backend que lo requieren
- [x] Campo `agencySchema` en modelo `User` (migración Prisma)
- [x] Agencia incluida en el payload del JWT al hacer login
- [x] Middleware actualizado para inyectar `req.tenantSchema` desde el token
- [x] Validación de tenant: el schema del request debe coincidir con el del JWT
- [-] CORS con allowlist de orígenes — mecanismo implementado (`CORS_ORIGIN` en `.env`, ver [DESPLIEGUE.md](DESPLIEGUE.md)); falta configurar la URL real de Vercel en Railway al desplegar
- [x] `helmet` instalado y aplicado — HTTP security headers
- [x] `express-rate-limit` en todas las rutas
- [x] `JWT_SECRET` rotado a valor fuerte (`openssl rand -hex 32`)
- [x] `remoteClient.js` corregido — lazy connection en lugar de `connect()` al importar
- [x] Autorización por rol en backend — `requireRole()` middleware + `roles.js` con 6 roles DMS aplicado en todas las rutas

---

### Semana 2 — Calidad de código

- [x] TypeScript configurado en modo gradual (`tsconfig.json` con `allowJs: true`)
- [x] Archivos nuevos se escriben en `.ts`; existentes se migran al tocarlos
- [x] Zod — validación de variables de entorno al arrancar (falla rápido si falta alguna)
- [x] Zod — validación de inputs en rutas críticas (auth, CFDI, sync)
- [x] Pino instalado — logging estructurado JSON reemplaza `console.log/error`
- [x] Nivel de log configurable por entorno (`LOG_LEVEL` en `.env`)
- [x] `@xenova/transformers` eliminado — dependencia muerta
- [x] `file-saver` eliminado del `backend/package.json` — solo pertenece al frontend

---

### Semana 3 — Operabilidad

- [x] Endpoint `GET /api/health` — responde `{ status, version, uptime, db }`
- [x] Cron de sincronización CFDI automático (`node-cron`) — configurable por entorno
- [x] `.env.example` completo con todas las variables documentadas
- [x] Separación de configuración dev/prod — `JWT_SECRET` diferente por entorno
- [x] URL del API en frontend como variable de entorno (`VITE_API_URL` en Vite)
- [x] Scripts npm documentados en `CLAUDE.md` si cambian

---

### Semana 4 — Tests del núcleo

- [x] Vitest configurado (runner único para backend y frontend)
- [x] Tests del middleware de auth — token válido, inválido, expirado, sin agencia, sin token
- [x] Tests del servicio de sincronización CFDI — incremental, full, manejo de errores
- [x] Tests del clasificador IA — lotes, respuestas cortas de OpenAI (mock), categorías válidas
- [x] CI básico configurado — lint + tests en cada PR antes de merge

### Criterio de salida
Todos los checkboxes de las 4 semanas marcados como `[x]`. Solo entonces se avanza a Fase 2.

---

## Fase 1-C — Módulo Registro de Códigos / FrmCodigos (julio–agosto 2026)

**Período:** julio – agosto 2026 | **Estado:** PENDIENTE

### Objetivo
Reimplementar el formulario de Registro de Códigos (FrmCodigos — VB6/CODIGOS.MDB) en el stack SIIA Cloud, preservando toda la lógica de negocio existente. Es el maestro de clientes/proveedores que otros módulos del DMS referencian.

### Fuentes de referencia
- Legacy: `FrmCodigos.txt` — formulario VB6 original con lógica de negocio completa
- Schema: `CODIGOS_schema.md` — estructura de la BD Access (tabla principal + 10 catálogos)

### Prerrequisitos
- [x] Fase 1-B completa (JWT + roles + TypeScript + Zod + tests)

---

### Bloque 1 — Modelo de datos (Prisma)

- [x] Tabla `Codigos` en schema Prisma — todos los campos, tipos correctos (50+ columnas)
- [x] Catálogos: `TipoCod`, `ComCred`, `CatEntidadesFederativas`, `Escolaridad`, `Civil`, `Titulo`, `CatRegimenFis`, `CatRegimenSoc`, `CatColonias`, `CatCodPos`, `CatCiudades`
- [x] Migraciones Prisma versionadas y aplicadas en dev
- [x] Seed de catálogos con script ETL desde Access — `prisma/seed.js` (catálogos de dominio) + `prisma/etl-codigos-mdb.js` (ETL completo desde CODIGOS.MDB vía Jet OLEDB: 10 tipos, 19 regímenes fiscales, 20 reg. societarios, 32 estados, 178 ciudades, 95,748 CPs, 10,450 colonias)

---

### Bloque 2 — API REST (backend)

- [x] `GET /api/v1/codigos/siguiente` — próximo código disponible (lógica registro "99999" + bucle anti-colisión)
- [x] `GET /api/v1/codigos/buscar?q=&tipo=nombre|razon|rfc` — búsqueda LIKE paginada
- [x] `GET /api/v1/codigos/:codigo` — ficha completa del cliente
- [x] `POST /api/v1/codigos` — crear nuevo; devuelve 409 si existe (frontend confirma con POST /:codigo/confirmar)
- [x] `PUT /api/v1/codigos/:codigo` — actualizar campos no protegidos
- [x] `PUT /api/v1/codigos/:codigo/nombre` — actualizar nombre/razón social — requiere rol `admin` (MODCODIGO)
- [x] Endpoints de catálogos: `GET /api/v1/codigos/catalogos` — todos en una llamada (tipos, formasPago SAT, estados, escolaridades, estadosCiviles, titulos, regimenFiscal, regimenSoc, comCred, colonias por CP)
- [x] Validaciones Zod: RFC (12 moral / 13 física), CURP (18 chars), teléfono (mín. 7 dígitos), lada (3 dígitos), email, CP (5 dígitos)
- [x] Regla RFC genérico `XAXX010101000` → régimen fiscal 616 forzado; no válido para personas morales
- [x] Regla razón social: rechazar abreviaturas de régimen societario embebidas (SA DE, S.A, CV, SAPI, A.C, SC, RL, S.A.B)
- [x] Tests unitarios de validaciones RFC / CURP / teléfono / email (41 tests en `codigos.validaciones.test.ts`)
- [x] Tests de integración: getSiguiente, buscarCodigos, getCodigo, createCodigo con Prisma mock (11 tests en `codigos.model.test.ts`)

---

### Bloque 3 — Frontend React

- [x] Página `CodigosForm.jsx` — estructura base con rutas protegidas (`/codigos`, `PrivateRoute`)
- [x] Toggle Persona Física / Persona Moral — secciones condicionales (nombre ↔ razón social, CURP, sexo, escolaridad, estado civil, título, pasatiempos, régimen societario, representante legal)
- [x] Auto-carga del siguiente código disponible al entrar en modo "Nuevo"
- [x] Búsqueda en tiempo real con debounce (300 ms) — por nombre, razón social o RFC
- [x] Grid de resultados cuando hay múltiples coincidencias; carga directa si hay 1 exacto
- [x] Selects de catálogos cargados desde API (Tipo, Forma de Pago SAT, Estado, Escolaridad, Estado Civil, Título, Régimen Fiscal filtrado por tipo persona, Régimen Societario, Com. Crédito)
- [x] Campo "Convenio" solo visible cuando Tipo = "CS"
- [x] Régimen Societario habilitado solo para personas morales
- [x] RFC `XAXX010101000` → bloquea régimen fiscal (616 forzado) y CP al cargar
- [x] Guard "Modificar nombre/razón social" — diálogo de confirmación + verificación rol admin (MODCODIGO)
- [x] Upload y preview de imagen de ID (FileReader → base64 preview; PUT /:codigo/imagen al guardar)
- [x] Validaciones en frontend con mensajes inline por campo (RFC, CURP, teléfono, lada, email, CP, abreviaturas societarias)

---

### Bloque 4 — Migración de datos y convivencia

- [x] Script ETL: lectura de `CODIGOS.MDB` (Access) → transformación → inserción en PostgreSQL — `prisma/etl-codigos-mdb.js --schema=nissan_tc --only-codigos`; 32,270/32,270 registros migrados
- [x] Validación de integridad post-ETL: 32,270 total, 25,059 con RFC, 2,653 morales, 29,593 físicas, 2 sin nombre (fantasmas), 284 RFCs duplicados (data quality legacy) — `prisma/validate-etl.js`
- [x] Legacy FrmCodigos sigue operando durante la transición — convivencia garantizada por multi-tenancy (Access intacto, Cloud en schema `nissan_tc`)
- [x] Sincronización incremental: ETL usa `upsert` → re-ejecutable en cualquier momento como sincronización manual

---

### Criterio de salida
Todos los checkboxes de los 4 bloques marcados `[x]`. Operación de agencia valida el formulario en UAT antes de apagar el legacy.

---

## Fase 2 — Migración módulo Unidades (Q3 2026)

**Período:** agosto – septiembre 2026 | **Estado:** PENDIENTE

### Objetivo
Migrar el módulo más crítico del DMS: inventario de unidades (nuevas, seminuevos, tránsito).

### Prerrequisitos (Fase 1-B completa)
- [ ] JWT con agencia en todas las rutas
- [ ] TypeScript + Zod activos
- [ ] Pipeline CI/CD con tests

### Entregables

- [ ] Modelo de datos de Unidades en Prisma (VIN, modelo, color, precio, estatus, agencia)
- [ ] APIs CRUD de Unidades (`/api/v1/unidades`) con autenticación y validación de agencia
- [ ] Migración ETL desde el legacy (Access / SIIA) — mapeo de campos
- [ ] Integración Nissan APIs (inventario, pedidos) — requiere credenciales OEM
- [ ] Vista frontend de inventario de unidades con filtros por agencia y estatus
- [ ] Convivencia con legacy durante transición — SIIA legacy sigue operando en paralelo
- [ ] Tests de integración del módulo Unidades
- [ ] Validado por operación de agencia antes de apagar el legacy

---

## Fase 3 — Optimización operativa y analítica (Q3–Q4 2026)

**Período:** septiembre – noviembre 2026 | **Estado:** PENDIENTE

### Objetivo
Visibilidad operativa centralizada e integraciones OEM restantes.

### Entregables

- [ ] Dashboard operativo centralizado multi-agencia (CFDI + unidades + vencimientos)
- [ ] Monitoreo centralizado con logs estructurados (Pino → agregador por definir)
- [ ] Alertas operativas (vencimientos vencidos, errores de sync)
- [ ] Integración FPV — eventos de flotillas Nissan
- [ ] Integración AutoVHC — inspección de seminuevos (SOAP)
- [ ] Integración Symmetrical — intercambio de archivos (FTP/SFTP)
- [ ] Integración Portal Seminuevos — archivo diario de inventario
- [ ] Módulo Campañas OEM
- [ ] Módulo Socio de Negocios

---

## Fase 4 — Certificación ANDANAC (Q4 2026)

**Período:** octubre – diciembre 2026 | **Estado:** PENDIENTE

### Objetivo
Completar el checklist del RFP ANDANAC y obtener la certificación oficial.

### Entregables

- [ ] Todos los módulos obligatorios del RFP operativos — ver [MATRIZ-ANDANAC.md](MATRIZ-ANDANAC.md)
- [ ] Auditoría de seguridad completa
- [ ] Documentación técnica para ANDANAC
- [ ] Pruebas de aceptación con operación de agencia
- [ ] Proceso de certificación formal con Nissan / ANDANAC — fecha exacta por confirmar
- [ ] Plan de contingencia y continuidad operativa documentado

---

## Resumen de fases

```
2026
Q1 ──────── Q2 ──────────────── Q3 ──────────────── Q4
│                                                     │
│  Fase 1-A (infraestructura base)                    │
│  ════════════                                       │
│                                                     │
│             Fase 1-B (núcleo sólido)  ✓             │
│             ══════════                              │
│                                                     │
│                    Fase 1-C (Reg. Códigos/FrmCodigos)
│                    ══════════════                   │
│                                                     │
│                              Fase 2 (Unidades)      │
│                              ═══════════════        │
│                                                     │
│                                     Fase 3 (analítica + OEM)
│                                     ═══════════════════════ │
│                                                             │
│                                             Fase 4 (ANDANAC)
│                                             ════════════════
                                                             │
                                                Certificación
```

---

## Mapeo Roadmap → Matriz ANDANAC

| Eje ANDANAC | Fase principal | Entregable clave |
|------------|---------------|-----------------|
| Arquitectura y Plataforma | Fase 1-B | TypeScript, Zod, health check, versionamiento de APIs |
| Base de Datos | Fase 1-A / 1-B | Multi-tenant completo (agencia en JWT), migraciones Unidades |
| Seguridad y Control de Acceso | Fase 1-B | JWT completo, Helmet, rate limiting, roles de negocio |
| Integraciones y Conectividad | Fase 2–3 | Nissan APIs, FPV, AutoVHC, Symmetrical |
| Automatización de Procesos | Fase 1-B / 3 | Cron CFDI (1-B), alertas y pipelines OEM (3) |
| Reportes y Explotación | Fase 3 | Dashboard multi-agencia, exportaciones |
| Continuidad Operativa | Fase 1-B / 4 | CI/CD + tests (1-B), rollback, monitoreo (4) |
