# Bitácora de sesiones — SIIA Cloud

Log cronológico de sesiones de trabajo. La entrada más reciente va al inicio.

---

## 2026-09-07 — Deploy real en Railway: fix `node-adodb` + hallazgo Vencimientos desconectado

**Hecho:**
- Primer intento de deploy del backend en Railway falló en `npm install`: `EBADPLATFORM` — `node-adodb@5.0.3` (dependencia de `backend/src/db.js`, ya desconectado de `index.js` desde la sesión de auditoría) solo declara soporte `win32`, y npm rechaza instalarlo en cualquier plataforma sin importar si el código lo usa. Corregido moviéndolo de `dependencies` a `optionalDependencies` en `backend/package.json` — npm lo omite silenciosamente en Linux (Railway) pero lo sigue instalando en Windows (necesario para correr `prisma/etl-codigos-mdb.js` localmente). Lockfile regenerado, 97/97 tests siguen pasando.
- Al llenar las variables de entorno remanentes en Railway, se descubrió que **Vencimientos está desconectado del frontend**: `Vencimientos.jsx` y `VencimientosDashboard.jsx` existen y tienen historial real (commits "gráficas mejoradas", "versión con dashboard", última modificación ~2025-06-04), pero ni `App.jsx` tiene ruta `/vencimientos` ni `Navbar.jsx` tiene link — inalcanzable desde la UI actual. El backend (`/api/vencimientos`, `remoteClient.js`) sí está limpio y montado (usa `pg` normal, sin el riesgo de `node-adodb`).

**Decisiones:**
- No se toca código de Vencimientos por ahora — se rellenan `TU_HOST_REMOTO`/`TU_USUARIO`/`TU_PASSWORD`/`NOMBRE_DE_LA_BD` en Railway con los mismos valores del `.env` local (siguen siendo requeridos por `env.ts`, sin importar si el frontend enruta a la página) para no bloquear el arranque, y se decide después si se reconecta la ruta en el frontend o se retira la función.

**Bloqueos / dudas:**
- Pendiente decidir el futuro de Vencimientos: ¿reconectar `/vencimientos` en `App.jsx`/`Navbar.jsx`, o considerarla obsoleta y retirar ruta+páginas+variables de entorno?
- Los 73 archivos sin commitear (Fase 1-B, 1-C, sesión de hoy) siguen pendientes de revisión y push por parte del usuario — Railway está construyendo desde `origin/main` con código viejo hasta que eso se resuelva.

**Siguiente paso:**
- Terminar de llenar variables en Railway (paso 3 del checklist) y reintentar el deploy.
- Cuando el usuario termine de revisar el diff, commitear y pushear a `origin/main` para que Railway tome el código corregido de esta sesión.

---

## 2026-08-27 — Fix: `validateSchema.js` con ruta de require incorrecta (crash de arranque)

**Hecho:**
Al reiniciar el backend tras la auditoría de seguridad, `index.js` crasheaba en el arranque: `Cannot find module '../config/schemas'` desde `src/middlewares/validateSchema.js` (vía `cfdi.routes.js`). Causa: el repo tiene **dos carpetas `config/` distintas** — `backend/config/` (solo `schemas.js`) y `backend/src/config/` (env, logger, roles, openaiClient). `validateSchema.js` vive en `src/middlewares/`, dos niveles bajo `backend/`, así que necesita `../../config/schemas`, no `../config/schemas`. El bug era invisible porque el middleware estaba desconectado (código muerto) antes de la sesión de auditoría; al conectarlo a las 4 rutas CFDI, la ruta incorrecta se ejecutó por primera vez.

Corregido `require('../config/schemas')` → `require('../../config/schemas')`. Verificado: arranque limpio con `npx tsx index.js` (env dummy), los 4 route files que usan el middleware resuelven sin error, y `npx vitest run` sigue en 71/71.

**Decisiones:** ninguna nueva.

**Bloqueos / dudas:** ninguno — resuelto en la entrada siguiente (mismo día).

**Siguiente paso:**
- Retomar el checklist de despliegue de Railway/Vercel en DESPLIEGUE.md.

---

## 2026-08-27 — Tests de integración del árbol de rutas con supertest

**Hecho:**
A pedido del usuario, se cerró el gap detectado en la entrada anterior: se agregaron tests de integración que montan la app real de Express y verifican la cadena de middlewares (auth → rol → tenant → allowlist de schema) en los 13 archivos de rutas montados en `index.js`, usando `supertest`.

- `backend/index.js`: refactor mínimo para hacerlo testeable sin tocar el comportamiento en producción — `app.listen()` y el arranque del cron ahora están detrás de `if (require.main === module)`, y el archivo exporta `app` con `module.exports = app`. `npm start`/`npm run dev` corren exactamente igual (siguen siendo el entry point directo); un test que hace `require('../../../index.js')` obtiene la app sin levantar el listener.
- Instalado `supertest` como devDependency.
- Nuevo archivo `src/routes/__tests__/app.integration.test.ts` (26 tests): responden rutas públicas (`/`, `/api/health`) sin auth; 401 sin token en los 13 grupos de rutas; 403 con rol insuficiente (`user.controller`, `sync`, `settings`); 403 cuando el schema del request no coincide con el del JWT (gate de tenant); 400 en las 4 rutas CFDI con `schema` fuera de la allowlist (exactamente la clase de bug que tumbó el arranque); y que un schema válido sí atraviesa la cadena de middlewares (sin BD real disponible en este entorno, termina en 500 al llegar a Prisma, pero eso ya confirma que pasó auth+rol+schema).
- **Verificado que esta suite habría atrapado el bug de la entrada anterior:** se reintrodujo deliberadamente el `require('../config/schemas')` incorrecto, se confirmó que el archivo de tests fallaba, y se revirtió al fix correcto.
- Detalle técnico no obvio: requerir `index.js` desde un test necesitó el mismo patrón `createRequire(import.meta.url)` que ya usa `cfdiSync.service.test.ts` (la resolución de vite-node no resuelve bien los `require()` relativos *dentro* de un CJS requerido vía `import` ESM) — y además requirió registrar `require('tsx/cjs')` antes, porque `index.js` a su vez requiere `config/env.ts`/`config/logger.ts` (TypeScript), que el `require` nativo de Node no puede resolver sin el loader de tsx. `tsx/cjs` es el mismo loader que usa `tsx index.js` en producción, así que el comportamiento probado es fiel al real.

Verificado con `npx vitest run`: 6 archivos de test, 97/97 pasan (71 previos + 26 nuevos).

**Decisiones:**
- El patrón para testear rutas de Express en este repo es: `createRequire` + `require('tsx/cjs')` + `require('../../../index.js')` + `supertest`. Documentado como comentario en el propio archivo de test para que la próxima persona no tenga que redescubrirlo.
- Estos tests son de "wiring" (¿está la cadena de middlewares bien conectada?), no de lógica de negocio — no hay BD real en este entorno de tests. La cobertura de lógica de negocio sigue viviendo en los tests unitarios existentes con mocks de Prisma/pg.

**Bloqueos / dudas:** ninguno.

**Siguiente paso:**
- Retomar el checklist de despliegue de Railway/Vercel en DESPLIEGUE.md.

---

## 2026-08-26 — Auditoría de seguridad pre-despliegue: 2 vulnerabilidades críticas cerradas

**Hecho:**
Antes de proceder con el despliegue se pidió dejar el backend "con buenas bases" — se corrió una revisión (`code-review` a alto esfuerzo) sobre el diff pendiente de `backend/src` (el trabajo de endurecimiento de Fase 1-B: JWT por tenant, `requireRole`, validación Zod). Se confirmaron y corrigieron 4 hallazgos:

1. **Crítico — Inyección SQL vía parámetro `schema`:** `cfdiSync.service.js`, `cfdiDashboard.controller.js` (10 queries) y `db/cfdiClient.js` (search_path) interpolaban el `schema` de la request directo en SQL/opciones de conexión crudas; los schemas Zod solo validaban `z.string().min(1)`, sin restringir a un formato o allowlist. Se revivió y corrigió el middleware `validateSchema.js` (existía pero no se usaba en ninguna ruta) para validar contra la allowlist de `config/schemas.js`, y se montó en las 6 rutas afectadas (`cfdi.routes.js` x2, `cfdiDashboard.routes.js`, `cfdiClassifier.routes.js`, `sync.routes.js` x2).
2. **Crítico — Escalación de privilegios en `POST /auth/register`:** el endpoint (sin autenticación, como debe ser un registro público) aceptaba `role` y `agencySchema` directo del body — cualquier anónimo podía autoregistrarse como `role: 'admin'` con cualquier `agencySchema`, lo que además alimentaba el punto 1. Corregido: `auth.controller.js` y `auth.schema.ts` ya no aceptan esos campos del cliente; todo registro nuevo es `viewer`/`agencySchema: null`, y la promoción de rol se hace vía el endpoint ya existente `PUT /api/users/:id/role` (solo admin).
3. **Medio — Guard de código reservado faltante:** `POST /api/v1/codigos/:codigo/confirmar` no rechazaba el código sentinela `99999` (sí lo hacían `create` y `update`), permitiendo sobrescribir el contador de "siguiente código" de la agencia. Agregado el mismo guard.
4. **Limpieza — Prisma Client duplicado:** 11 archivos instanciaban su propio `new PrismaClient()` (una connection pool cada uno) en vez de usar el singleton `db/prismaClient.js`. Consolidados todos a un único cliente compartido — reduce el consumo de conexiones a Postgres, relevante para el límite de conexiones en Railway. De paso se eliminó `models/cfdi.model.js` — código muerto sin ningún import, con el mismo patrón de interpolación de `schema` sin sanitizar que el punto 1 (no explotable por estar desconectado, pero limpiado).

**Además (segunda pasada, a pedido del usuario):**
5. **`console.log`/`console.error` → logger Pino:** convertidos todos los usos reales en `vencimientos.controller.js`, `cfdi.controller.js`, `clasificarMasivo.js` y los `catch` de las 4 rutas CFDI (`cfdi.routes.js`, `cfdiDashboard.routes.js`, `cfdiClassifier.routes.js`, `sync.routes.js`). Quedan sin tocar, a propósito: `env.ts` (corre antes de que el logger pueda construirse — necesita `env` ya validado) y `db.js` (código muerto, desconectado desde la sesión anterior). **Excepción descubierta:** `cfdiSync.service.js` se revirtió a `console.log/error` porque su test (`cfdiSync.service.test.ts`) usa `createRequire(import.meta.url)` para compartir el module-cache nativo de Node con sus mocks — ese `require` nativo no puede resolver `.ts` (ni `config/logger.ts` ni, transitivamente, `config/env.ts`). Convertir esos dos archivos a CJS plano para destrabarlo era un cambio de mayor riesgo que no se justificaba solo por consistencia de logging.
6. **Checks de rol inline → `requireRole()`:** `user.controller.js` y `employee.controller.js` tenían validaciones de rol duplicadas dentro del controlador además de las ya aplicadas en la ruta vía `requireRole(...ROLE_GROUPS)`. Se quitaron (la ruta ya es la única fuente de verdad). De paso se corrigió un bug real: `employee.controller.js`'s `update` exigía `role !== "admin"` en el controlador, contradiciendo la política real de la ruta (`RRHH_WRITE` incluye también `editor`) — un `editor` quedaba bloqueado por el controlador aunque la ruta lo permitía. También se agregó validación Zod (`schemas/user.schema.ts`) al body de `PUT /api/users/:id/role`, que antes aceptaba cualquier string como `role` sin restricción.

Verificado con `npx vitest run` (71/71 tests pasan) tras cada cambio.

**Decisiones:**
- El endpoint `/auth/register` queda como registro público de solo-lectura; la asignación de rol y agencia es siempre un acto administrativo posterior, nunca auto-servicio.
- La validación de `schema` se resuelve en un middleware dedicado (`validateSchema.js`) reutilizado en todas las rutas CFDI, en vez de duplicar la lógica de allowlist en cada Zod schema — un solo punto de verdad (`config/schemas.js`).

**Bloqueos / dudas:**
- `cfdiSync.service.js` queda como única excepción documentada al estándar de logging Pino (ver punto 5 de "Hecho") — restricción del test harness, no deuda técnica a resolver con más refactor.

**Siguiente paso:**
- Retomar el checklist de despliegue de Railway/Vercel ya documentado en DESPLIEGUE.md.

---

## 2026-08-26 — Auditoría de frontend (`CodigosForm`, `Announcements`, `App`)

**Hecho:**
A pedido del usuario se corrió el mismo `code-review` a alto esfuerzo sobre `frontend/src`. 7 hallazgos confirmados y corregidos en `CodigosForm.jsx`, `Announcements.jsx` y `App.jsx`:

1. **`handleConfirmarUpsert` sin try/catch/finally** — a diferencia de `handleGuardar`. Si `confirmarCodigo()` fallaba (red caída, respuesta no-JSON), la excepción escapaba antes de cerrar el diálogo o soltar `loading`, dejando el formulario congelado en "Guardando…" hasta recargar la página. Envuelto en try/catch/finally.
2. **"Quitar imagen" no se persistía** — `handleGuardar` solo subía la imagen si `imgDirty && imgPreview`; al quitarla, `imgPreview` queda `null` así que la condición nunca se cumplía, y el toast decía "guardado correctamente" mientras la imagen vieja seguía en el backend. Además el backend (`PUT /:codigo/imagen`) rechazaba con 400 cualquier `imagen` falsy, sin forma de limpiarla. Corregidos ambos lados: frontend ahora sube siempre que `imgDirty` (con `imgPreview` en `null` si se quitó), backend distingue "campo ausente" (400, sin cambios) de "`imagen: null`" (limpia el campo).
3. **`Field` descartaba la prop `style`** — el componente solo desestructuraba `{label, error, children}`; "Razón Social" y "Dirección" pasaban `style={{gridColumn: "span 2"}}` para ocupar 2 columnas y se ignoraba silenciosamente, quedando en ancho normal. Corregido para reenviar `style`.
4. **`Announcements.jsx` tragaba errores de red/auth** — `.catch(() => {})` hacía que un fallo de fetch se viera igual que "no hay anuncios". Ahora se distingue con un estado `error` y un mensaje propio.
5. **`cargarCodigo` no cargaba colonias del CP existente** — solo `handleChange` disparaba `fetchColoniasPorCp`, así que al editar un registro con CP válido, el campo Colonia se veía como input libre en vez del select validado, hasta que el usuario retecleaba el CP. Corregido: `cargarCodigo` ahora dispara la misma carga de colonias.
6. **`decodeUser()` duplicado y recalculado en cada render** — la misma lógica de decodificar el JWT (split/atob/JSON.parse) ya existía en `App.jsx`; en `CodigosForm.jsx` se ejecutaba en el cuerpo del componente, es decir en cada re-render (cada tecla del formulario). Extraído a `utils/jwt.js` (`decodeToken`) compartido por ambos, y en `CodigosForm.jsx` ahora se calcula una sola vez vía inicializador perezoso de `useState`.
7. **Búsqueda con debounce sin guard de orden** — el debounce solo cancelaba el *timer* pendiente, no una petición ya en vuelo; si dos búsquedas quedaban en el aire y la más vieja respondía después que la más nueva, sus resultados podían pisar los de la búsqueda actual. Agregado un contador de secuencia (`searchSeqRef`) que descarta respuestas obsoletas.

Verificado con `npx vitest run` en frontend (7/7) y backend (71/71 — por el cambio en `codigos.controller.js`), y `npm run build` del frontend sin errores.

**Decisiones:**
- La lógica de decodificar el JWT del cliente vive en un solo lugar (`frontend/src/utils/jwt.js`); cualquier cambio futuro al formato del token (expiración, claims nuevos) se hace ahí una sola vez.
- Limpiar la imagen de identificación es ahora una operación explícita del contrato de la API (`imagen: null`), no una ausencia de campo — evita ambigüedad entre "no mandé nada" y "quiero borrar la imagen".

**Bloqueos / dudas:** ninguno nuevo.

**Siguiente paso:**
- Retomar el checklist de despliegue de Railway/Vercel en DESPLIEGUE.md — backend y frontend ya revisados y con buenas bases.

---

## 2026-08-26 — Preparación de despliegue en Railway (backend) + Vercel (frontend)

**Hecho:**
- Gap-analysis del repo contra los requisitos de Railway/Vercel: revisados `backend/index.js`, `db.js`, `env.ts`, `package.json` (back/front), `vite.config.js`, `api.js`.
- Detectado bloqueador crítico: `backend/src/db.js` abría una conexión `node-adodb` (Windows-only, MS ACE OLEDB vía red) **a nivel de módulo**, montada incondicionalmente en `index.js` como `/api/ordenes`. Confirmado por grep que el frontend no usa esa ruta. En Railway (Linux) esto tumbaba el arranque completo del backend.
- Removido el `require`/`app.use` de `ordenes.routes` en `backend/index.js`. Los archivos `db.js` y `ordenes.routes.js` quedan sin usar (no borrados) como referencia si se retoma esa integración vía un servicio Windows separado.
- Agregado `CORS_ORIGIN` (opcional, coma-separado) a `backend/src/config/env.ts` y `.env.example`; `index.js` ahora usa un allowlist de `cors()` si está definido, y sigue abierto si no (dev).
- Agregado `"postinstall": "prisma generate"` a `backend/package.json` para que Railway/Nixpacks genere el client Prisma en el build.
- Creado `frontend/vercel.json` con rewrite SPA a `index.html` (necesario por `BrowserRouter` de React Router — sin esto, refrescar una ruta interna da 404 en Vercel).
- Documentado en `docs/DESPLIEGUE.md`: setup paso a paso de Railway (root `backend/`, release command `prisma migrate deploy`, variables de entorno) y Vercel (root `frontend/`, `VITE_API_URL`), y corregidas filas desactualizadas de la tabla de seguridad por entorno (JWT_SECRET, rate limiting, HTTPS ya resueltos).

**Decisiones:**
- Backend en Railway, frontend en Vercel — sin entorno de Staging formal por ahora; se apoyará en preview deployments de ambas plataformas.
- El acceso legacy a MDB vía red Windows no se porta a Railway; si se necesita, debe exponerse como servicio HTTP aparte corriendo en Windows (regla API-first de `CLAUDE.md`), no como dependencia directa del backend cloud.

**Bloqueos / dudas:**
- Falta confirmar si las BDs remotas (`94.72.115.250` CFDI, `100.101.219.49` vencimientos) aceptan conexiones desde las IPs de salida de Railway (posible whitelisting de firewall) — requiere validarlo con quien administra esas BDs antes del primer deploy real.
- `git status` mostró varios archivos del backend modificados sin commitear al iniciar la sesión (previos a este cambio) — revisar y decidir si se commitean antes de conectar el repo a Railway/Vercel para autodeploy.
- Dominio final de Vercel aún no existe — `CORS_ORIGIN` queda sin configurar hasta tenerlo.

**Siguiente paso:**
- Commitear los cambios de esta sesión (y revisar los pendientes previos) antes de conectar el repo.
- Crear los servicios en Railway y Vercel, cargar variables de entorno, y una vez asignado el dominio de Vercel, setear `CORS_ORIGIN` en Railway.
- Validar conectividad de Railway a las dos BDs remotas.

**Adenda — alcance del primer despliegue:**
Se evaluó dejar fuera del primer despliegue el catálogo de Códigos (95,748 CPs, 10,450 colonias, 32,270 registros) por posible consumo de BD en Railway. Estimado desde el schema de Prisma (`Codigo`, `CatCodPos`, `CatColonia`): todo texto corto, sin imágenes pobladas (`imgId` queda `null` en el ETL) → bien por debajo de 200 MB en total, costo de almacenamiento insignificante en Railway. Se decidió **desplegar todo desde el inicio**, incluyendo el ETL de Códigos. Ver checklist completo en [DESPLIEGUE.md](DESPLIEGUE.md#checklist-de-despliegue).

## 2026-06-25 — Fase 1-C Bloque 4: ETL + validación de integridad + bugs runtime

**Hecho:**
- Corregidos 2 bugs runtime del formulario CodigosForm: (1) crash `busqResults.rows.map()` cuando la API devuelve 400 sin `rows`; (2) `cats?.field.map()` → `cats?.field?.map()` en todos los selects de catálogos
- Causa raíz del 400: usuarios creados antes de `agencySchema` tenían `null` en JWT → todos los endpoints de códigos rechazaban. Fix en `auth.middleware.js`: admin sin schema puede operar pasando `?schema=` como query param
- Actualizado `api.js`: todas las funciones de códigos aceptan `schema` opcional
- Actualizado `CodigosForm.jsx`: selector de agencia en banner cuando `user.agencySchema` es null; schema propagado a todas las llamadas API
- ETL tabla principal `Codigos`: 32,270/32,270 registros migrados a schema `nissan_tc`; 0 omitidos en segunda pasada
- Fixes ETL: (1) RFC con guiones (`RIDR-610701-Q74`) → stripear guiones antes de insertar; (2) campo `estado` contenía nombres completos (`BAJA CALIFORNIA SUR`, 19 chars) en vez de códigos → migración Prisma `20260625062110_expand_estado_varchar` de VarChar(5) a VarChar(50)
- Validación post-ETL (`prisma/validate-etl.js`): 32,270 registros, 25,059 con RFC, 2,653 morales, 29,593 físicas, 284 RFCs duplicados (data quality legacy, no error ETL)
- Asignado `agencySchema = nissan_tc` a todos los usuarios (2 usuarios actualizados)

**Decisiones:**
- Schema de agencia: `nissan_tc` para la base de datos de Nissan Torres Corzo
- ETL con `upsert` → re-ejecutable como sincronización manual sin perder datos
- `estado` almacena nombre completo del legacy (no código SAT) — compatibilidad con datos históricos
- RFC se normaliza quitando guiones (formato canónico SAT)

**Bloqueos / dudas:**
- 284 RFCs duplicados en el legacy — no afectan el ETL pero son candidatos a deduplicación en UAT
- 2 registros sin ningún nombre — revisar con operación si se eliminan o preservan

**Siguiente paso:**
- Reiniciar sesión en el browser (logout + login) para obtener JWT con `agencySchema: nissan_tc`
- Validar formulario en UAT: buscar, crear, editar registros con datos reales
- Probar el flujo completo de la Fase 1-C antes de marcar criterio de salida

## 2026-06-24 — Fase 1-C Bloque 3: Frontend React CodigosForm

**Hecho:**
- Creado `frontend/src/pages/CodigosForm.jsx` — formulario completo del maestro de códigos:
  - Toggle Persona Física / Moral con cambio condicional de secciones (nombre ↔ razSoc, CURP, sexo, escolaridad, estado civil, título, pasatiempos, régimen societario, representante legal).
  - Auto-carga del siguiente código disponible al montar la página.
  - Búsqueda en tiempo real con debounce 300 ms (por nombre, razSoc o RFC); carga directa si hay 1 resultado exacto; grid de resultados si hay múltiples.
  - Todos los selects de catálogos cargados desde `GET /api/v1/codigos/catalogos`: Tipo, Forma de Pago SAT, Estado, Escolaridad, Estado Civil, Título, Régimen Fiscal (filtrado por tipo de persona), Régimen Societario, Clasificación de Crédito.
  - Colonias por CP: cuando el campo CP tiene 5 dígitos, el select de Colonia se llena desde `GET /catalogos/colonias?cp=XXXXX`; si no hay colonias, vuelve a texto libre.
  - Convenio visible solo cuando Tipo = "CS".
  - RFC XAXX010101000 → RegFis forzado a "616", campo CP bloqueado.
  - Guard MODCODIGO: campos Paterno/Materno/Nombre/RazSoc deshabilitados en modo edición; botón ✎ abre diálogo; admin puede habilitar edición; si no es admin, mensaje de "Contacta al administrador".
  - Upload de imagen: `<input type="file">` oculto → FileReader → preview `<img>`; al Guardar se llama `PUT /:codigo/imagen` con base64.
  - Diálogo de confirmación para upsert (409 del backend): muestra datos del registro existente y pide confirmación.
  - Validaciones inline: RFC (12/13/XAXX), CURP (18 chars), teléfono (≥7 dígitos), lada (3 dígitos), email (@), CP (5 dígitos), abreviaturas societarias.
- Agregadas 10 funciones en `frontend/src/services/api.js`: `fetchCodigosCatalogos`, `fetchColoniasPorCp`, `fetchSiguienteCodigo`, `buscarCodigos`, `fetchCodigo`, `createCodigo`, `confirmarCodigo`, `updateCodigo`, `updateCodigoNombre`, `fetchCodigoImagen`, `uploadCodigoImagen`.
- Agregados endpoints backend `GET /api/v1/codigos/:codigo/imagen` y `PUT /api/v1/codigos/:codigo/imagen` (base64 ↔ Buffer bytea).
- Ruta `/codigos` registrada en `App.jsx` con `PrivateRoute`.
- Módulo "DMS / Registro de Códigos" agregado al Navbar para todos los roles.
- Build de producción Vite: ✓ sin errores de compilación.

**Decisiones:**
- `PrivateRoute` en lugar de `RoleProtectedRoute` — el Bloque 2 ya protege el acceso por rol a nivel de API; todos los usuarios autenticados pueden ver el formulario pero la API rechazará operaciones fuera de su rol.
- Régimen Fiscal se filtra por `fisica`/`moral` desde el catálogo retornado — consistente con el catálogo SAT real.
- `buscarCodigos` no ejecuta en tiempo real cuando el campo está vacío — evita llamadas innecesarias.
- La imagen se envía como base64 en el body JSON (no multipart) — más simple dado que imgId ya es `Bytes` en Prisma y el backend convierte con `Buffer.from(b64, 'base64')`.

**Bloqueos / dudas:**
- El formulario no tiene foco automático en el primer campo con error — al validar, hace scroll arriba pero no lleva el foco al campo específico (mejora menor pendiente).
- `fechaAlta` (fecha de registro) se auto-asigna a hoy en "Nuevo" pero el campo queda editable — considerar si debería ser readonly.

**Siguiente paso:**
- Bloque 4 — Migración de datos: ejecutar `etl-codigos-mdb.js` para migrar la tabla `Codigos` del legacy y validar integridad post-ETL.

---

## 2026-06-24 — Fase 1-C Bloques 1 y 2: Modelo Prisma + API REST de Códigos

**Hecho:**
- **Bloque 1 completado** (ver sesión anterior en esta misma fecha).
- **Bloque 2 completado — API REST:**
  - `GET /api/v1/codigos/siguiente` — lógica de contador vía registro "99999" + bucle anti-colisión.
  - `GET /api/v1/codigos/buscar?q=&tipo=nombre|razon|rfc` — búsqueda LIKE paginada con total.
  - `GET /api/v1/codigos/:codigo` — ficha completa (imgId excluido del payload JSON).
  - `POST /api/v1/codigos` — crea y actualiza contador; devuelve 409 si ya existe (el frontend confirma vía `POST /:codigo/confirmar`).
  - `PUT /api/v1/codigos/:codigo` — actualiza campos no protegidos (nombre/razSoc excluidos internamente).
  - `PUT /api/v1/codigos/:codigo/nombre` — protegido por `CODIGOS_MOD_NOMBRE` (solo admin = equivalente a `MODCODIGO` del legacy).
  - `GET /api/v1/codigos/catalogos` — devuelve todos los catálogos en una llamada (tipos, formasPago SAT, estados, escolaridades, estadosCiviles, titulos, regimenFiscal, regimenSoc, comCred).
  - `GET /api/v1/codigos/catalogos/colonias?cp=XXXXX` — colonias por CP.
  - Validaciones Zod en `codigos.schema.ts`: RFC (12/13/XAXX), CURP (18 chars), teléfono (≥7 dígitos), lada (3 dígitos), email, CP (5 dígitos), abreviaturas societarias en razSoc, regSoc solo para morales.
  - RFC genérico XAXX010101000 → regFis forzado a "616" en create/update (controller).
  - 3 grupos de rol nuevos en `roles.js`: `CODIGOS_READ`, `CODIGOS_WRITE`, `CODIGOS_MOD_NOMBRE`.
  - 71 tests pasan: 41 unitarios de validaciones + 11 de integración (Prisma mock) + 19 existentes.

**Decisiones:**
- Endpoint `/catalogos` único en lugar de 8 endpoints separados — el frontend necesita todos al cargar el formulario; un solo fetch es más eficiente.
- Formas de pago SAT (c_FormaPago) hardcodeadas en el model — no existen en CODIGOS.MDB ni en otra tabla del sistema.
- 409 + payload del registro existente en `POST /` — permite al frontend mostrar diálogo de confirmación antes del upsert, reproduciendo el comportamiento del VB6 (`MsgBox "Codigo ya existe... ¿Deseas guardar los cambios?"`)
- `CODIGOS_MOD_NOMBRE = [admin]` — el permiso MODCODIGO del VB6 era por usuario; en el sistema actual se simplifica a rol admin. Se puede refinar con un campo de permisos granulares en User en una iteración futura.
- imgId (`Bytes`) excluido del GET de ficha — se sirve por un endpoint separado cuando el frontend lo necesite (evita serialización de binarios en respuestas JSON normales).

**Bloqueos / dudas:**
- `GET /:codigo` usa `omit: { imgId: true }` (Prisma 6 API estable) — verificar si la versión instalada lo soporta antes de deploy.
- Falta endpoint `GET /api/v1/codigos/:codigo/imagen` para recuperar el blob. Queda pendiente para Bloque 3 (cuando el frontend implemente el upload/preview).

**Siguiente paso:**
- Iniciar Bloque 3 de Fase 1-C: Frontend React — página `CodigosForm.jsx` con toggle Física/Moral, carga de catálogos, búsqueda en tiempo real y CRUD completo.

---

## 2026-06-24 — Fase 1-C Bloque 1: Modelo de datos Prisma + seed desde CODIGOS.MDB

**Hecho:**
- Agregados 12 modelos Prisma a `schema.prisma`: `Codigo` (tabla principal, 50+ campos, multi-tenant con `agencySchema`) + 11 catálogos (`TipoCod`, `ComCred`, `CatEntidadFederativa`, `Escolaridad`, `Civil`, `Titulo`, `CatRegimenFis`, `CatRegimenSoc`, `CatColonia`, `CatCodPos`, `CatCiudad`).
- Migración `20260624185906_add_codigos_catalogos` aplicada en dev con Prisma. Prisma Client regenerado (v6.7.0).
- Creado `prisma/seed.js` — popula catálogos de dominio con valores estándar (SAT, estados civiles, escolaridades, títulos).
- Creado `prisma/etl-codigos-mdb.js` — ETL completo desde `CODIGOS.MDB` (Access/Jet OLEDB 4.0) hacia PostgreSQL. Ejecutado exitosamente: 10 tipos de código, 3 com. crédito, 32 estados, 11 escolaridades, 6 estados civiles, 6 títulos, 19 regímenes fiscales SAT, 20 regímenes societarios, 178 ciudades, 95,748 CPs, 10,450 colonias.
- ETL acepta argumento `--schema=<nombre>` para seleccionar agencia destino y `--only-catalogos` / `--only-codigos` para ejecución parcial.
- Decisión: imagen ID como `Bytes` (bytea PostgreSQL), espejo del legacy sin dependencias externas.

**Decisiones:**
- `Codigo` usa PK surrogate (`id SERIAL`) + `@@unique([agencySchema, codigo])` — consistente con patrón CFDI del proyecto y evita colisiones entre agencias (cada agencia puede tener su "00001").
- Registro especial "99999" de counter se preserva en PostgreSQL para compatibilidad con la lógica del VB6 y facilitar la migración incremental.
- Provider Jet OLEDB 4.0 en lugar de ACE OLEDB 12.0 — el driver ACE no está instalado en el entorno de desarrollo; Jet funciona para `.mdb` y es suficiente hasta producción.
- Catálogos geográficos (CatColonias, CatCodPos, CatCiudades) se migran vía ETL real desde el .mdb — no se inventa data.
- Índices en `codigos`: `(agencySchema, rfc)`, `(agencySchema, nombre)`, `(agencySchema, razSoc)` — soportan las búsquedas LIKE que hará el Bloque 2.

**Bloqueos / dudas:**
- Para producción: instalar Microsoft Access Database Engine 2016 Redistributable (64-bit) si el servidor es 64-bit y no tiene ACE OLEDB. El ETL usará `ACE OLEDB 12.0` en ese entorno; ajustar el connection string en `etl-codigos-mdb.js`.
- La tabla `Imagenes` del legacy (binaria en BD separada `c_ConexIds`) no se migró aún — queda pendiente para Bloque 4 o cuando se requiera.
- `FormaPago` en `Codigos` es string libre (no tiene tabla catálogo en CODIGOS.MDB) — el Bloque 2 deberá aclarar si se valida contra el catálogo SAT `c_FormaPago` o se deja libre.

**Siguiente paso:**
- Iniciar Bloque 2 de Fase 1-C: API REST. Comenzar con `GET /api/v1/codigos/siguiente` y `GET /api/v1/codigos/buscar?q=`.

---

## 2026-06-09 — Definición hito Fase 1-C: Módulo Registro de Códigos (FrmCodigos)

**Hecho:**
- Analizado el formulario original `FrmCodigos.txt` (VB6/CODIGOS.MDB) y su schema de referencia `CODIGOS_schema.md`.
- Identificada y documentada toda la lógica de negocio clave: siguiente código disponible (registro "99999"), toggle persona física/moral, upsert con confirmación, búsqueda LIKE con grid de duplicados, guard MODCODIGO para nombre, reglas de RFC genérico, validación de razón social sin abreviaturas societarias, imagen de ID binaria, 11 catálogos dependientes.
- Creado hito **Fase 1-C** en `docs/HITOS.md` con 4 bloques: modelo de datos (Prisma), API REST (backend), frontend React y migración ETL desde Access.

**Decisiones:**
- La Fase 1-C se ubica entre Fase 1-B y Fase 2 (Unidades) porque Registro de Códigos es el maestro de clientes que otros módulos referencian — su implementación antes de Unidades evita dependencias inversas.
- El endpoint de modificar nombre (`PUT /api/v1/codigos/:codigo/nombre`) se separa del endpoint general para poder aplicar el permiso `MODCODIGO` de forma explícita, reflejando la misma protección del VB6 original.
- Se mantiene el legacy FrmCodigos activo durante la transición (Bloque 4) — alineado con la regla arquitectónica de migración progresiva sin big-bang.

**Bloqueos / dudas:**
- Ninguno. El hito quedó definido; no se implementó código aún.
- Por confirmar: ¿la imagen de ID se guarda como blob en PostgreSQL, URL S3/MinIO, o base64 en campo texto? Decidir antes de iniciar Bloque 1.

**Siguiente paso:**
- Iniciar Bloque 1 de Fase 1-C: crear modelos Prisma para `Codigos` y los 11 catálogos, generar migración, y preparar seed de catálogos desde Access.

---

## 2026-06-08 — Autorización por rol en backend (RBAC)

**Hecho:**
- Creado `src/config/roles.js` — define 6 roles DMS (`admin`, `gerente`, `contador`, `ventas`, `servicio`, `consulta`) más los roles legacy (`editor`, `viewer`) con compatibilidad hacia atrás. Incluye `ROLE_GROUPS` con grupos reutilizables (`FINANZAS_READ`, `FINANZAS_WRITE`, `RRHH_READ`, `RRHH_WRITE`, `ORDENES_READ`, `VENCIMIENTOS_READ`, `ANUNCIOS_READ`, `ANUNCIOS_WRITE`, `CONFIG_READ`, `SOLO_ADMIN`).
- Creado `src/middlewares/authorize.middleware.js` — `requireRole(...roles)` que se encadena después de `authenticateToken` y responde 403 si el rol no está en la lista permitida.
- `requireRole` aplicado en las 10 rutas del sistema: `user`, `settings`, `employee`, `cfdi`, `cfdiDashboard`, `sync`, `cfdiClassifier`, `ordenes`, `vencimientos`, `announcement`.
- `docs/TECNICO.md` actualizado: tabla de rutas con JWT + rol, tabla de roles DMS, matriz de permisos completa.
- Verificado en código que JWT ya está en todas las rutas (la memoria de 2026-06-02 estaba desactualizada).

**Decisiones:**
- `ROLE_GROUPS` en lugar de listas inline en cada ruta — permite cambiar permisos en un solo lugar sin tocar archivos de rutas.
- Los roles legacy `editor`/`viewer` se incluyen en los mismos grupos que `contador`/`consulta` — los usuarios existentes no se rompen sin migración de BD.
- No se usó enum de Prisma para `User.role` — se mantiene como `String` para permitir agregar roles futuros sin migración.

**Bloqueos / dudas:**
- CORS allowlist sigue pendiente hasta tener dominio de producción (no es un bloqueo de código).

**Siguiente paso:**
- Fase 1-B funcionalmente completa. Iniciar diseño de Fase 2 — modelo de datos de Unidades en Prisma (VIN, modelo, color, precio, estatus, agencia).

---

## 2026-06-03 — Corrección bug 401 en módulo CFDI

**Hecho:**
- Diagnóstico: todas las páginas CFDI (`CfdiDashboard.jsx`, `CfdiViewer.jsx`) usaban `axios` sin el header `Authorization: Bearer <token>`, mientras que el backend exige `authenticateToken` en todas las rutas CFDI (`/api/cfdi-dashboard`, `/api/cfdi/:schema/ingresos`, `/api/cfdi/:schema/recibidos`, `/api/sync/*`, `/api/ia/clasificar`).
- Solución: interceptor global de axios en `frontend/src/main.jsx`. Lee el token de `localStorage` y lo inyecta en cada request automáticamente. Cero cambios en los componentes.

**Decisiones:**
- Interceptor en `main.jsx` (punto de entrada único) en lugar de modificar cada componente o crear un axios instance separado — mínima superficie de cambio, máxima cobertura.

**Bloqueos / dudas:**
- Ninguno.

**Siguiente paso:**
- Fase 1-B completa. Siguiente: Fase 2 — módulo Unidades (agosto 2026).

---

## 2026-06-02 — Semana 4 Fase 1-B: tests del núcleo (completa) — Fase 1-B cerrada

**Hecho:**
- Vitest instalado en backend (`pool: 'forks'`) y frontend (jsdom). Runner único para ambos proyectos.
- 19 tests pasan (3 archivos): auth middleware (8), cfdiSync service (6), cfdiClassifier (5).
- Patrón de mocking: `createRequire(import.meta.url)` para que test y service compartan el mismo module cache nativo de Node.js. `vi.spyOn` sobre los singletons (`prisma`, `openai`, `pool.query`).
- Singletons extraídos: `src/db/prismaClient.js` + `src/config/openaiClient.js` — singleton pattern que permite spy sin module-level mocking.
- `.github/workflows/ci.yml` — CI con dos jobs: backend tests + frontend lint, disparado en push/PR a main.
- Scripts `npm test` y `npm run test:watch` en backend y frontend.

**Decisiones:**
- `pool: 'forks'` en vitest.config — necesario para que `createRequire` comparta el module cache con el proceso padre correcto.
- `vi.spyOn(prisma, '$transaction').mockResolvedValue([])` — retorna `[]` sin ejecutar los PrismaPromises del batch (evita conexión real a BD).
- Singletons en `.js` (no `.ts`) para que `require()` en los servicios CJS los encuentre sin necesidad de extensión `.ts`.

**Bloqueos / dudas:**
- Los singletons se migraron a módulos `.js` separados — mejora de arquitectura para testabilidad. Sin impacto en producción.
- CI asume que el repositorio tiene remote GitHub. Si aún no hay remote, el workflow estará presente pero no se disparará.

**Siguiente paso:**
**Fase 1-B completa.** Todos los checkboxes de las 4 semanas marcados `[x]`. Listo para avanzar a Fase 2 — migración módulo Unidades (agosto 2026).

---

## 2026-06-02 — Semana 3 Fase 1-B: operabilidad (completa)

**Hecho:**
- `GET /api/health` — endpoint público que responde `{ status, version, uptime, db }`. Consulta Prisma para verificar estado de BD.
- `node-cron` instalado. `src/jobs/cfdiCron.ts` — sincroniza todos los schemas (emitidos + recibidos) en el schedule configurado. `CFDI_CRON_ENABLED` y `CFDI_CRON_SCHEDULE` en `.env`.
- `backend/.env.example` creado con todas las variables documentadas y comentadas en español.
- Separación dev/prod: `NODE_ENV` validado por Zod (`development|production|test`); `JWT_SECRET` forzado a mínimo 32 chars; logger usa pino-pretty en dev, JSON en prod.
- Frontend: `VITE_API_URL` como variable de entorno. `frontend/.env` (`/api` relativo para dev via proxy Vite) + `frontend/.env.example`.
- `src/services/api.js` refactorizado: todas las URLs hardcodeadas → `${API_URL}`, helper `authHeaders()` para deduplicar headers, `fetchAnnouncements` centralizado.
- `Announcements.jsx` actualizado: usa `fetchAnnouncements` de `api.js` (incluye token auth).
- `CLAUDE.md` actualizado con nuevos scripts (`npm start`, `npm run dev`).
- Semana 3 completa al 100%.

**Decisiones:**
- `GET /api/health` es público (sin auth) — diseñado para monitoreo externo y health checks de PM2.
- Cron arranca condicionalmente según `CFDI_CRON_ENABLED=true` en `.env`, para poder deshabilitarlo en dev sin cambiar código.
- `VITE_API_URL=/api` en dev aprovecha el proxy de Vite ya configurado — el frontend nunca sabe en qué puerto está el backend.

**Bloqueos / dudas:**
- Ninguno. Semanas 1, 2 y 3 completas.

**Siguiente paso:**
Semana 4: Vitest + tests del middleware de auth + tests del servicio cfdiSync + CI básico (lint + tests en PR).

---

## 2026-06-02 — Semana 2 Fase 1-B: calidad de código (completa) + Semana 1 casi completa

**Hecho:**
- `@xenova/transformers` y `file-saver` eliminados del backend — 0 vulnerabilidades en `npm audit`.
- TypeScript instalado y configurado en modo gradual (`tsconfig.json`, `allowJs: true`, `checkJs: false`).
- `tsx` como runtime (reemplaza `node`): `npm start` → `tsx index.js`, `npm run dev` → `tsx --watch index.js`.
- `zod` instalado. `src/config/env.ts` — valida todas las variables de entorno al arrancar; el proceso termina con mensaje claro si falta alguna.
- `pino` + `pino-pretty` instalados. `src/config/logger.ts` — logs JSON en producción, pretty en desarrollo. `LOG_LEVEL` configurable por `.env`.
- `index.js` usa logger de Pino en lugar de `console.log`.
- Validación de inputs con Zod en rutas críticas: `src/middlewares/validate.ts` + schemas en `src/schemas/` (auth, cfdi, sync). Aplicado en `auth.routes.js`, `cfdi.routes.js`, `sync.routes.js`, `cfdiDashboard.routes.js`, `cfdiClassifier.routes.js`.
- `dotenv.config()` movido al inicio de `index.js` (antes de la validación de env).

**Decisiones:**
- `tsx` en deps de producción (no devDep) para que PM2 pueda usarlo en Windows sin build step.
- `env.ts` valida con mensajes en español consistentes con el proyecto.
- `validateQuery` expone datos validados en `req.validatedQuery` (sin mutar `req.query` que es readonly en Express 5).
- Semana 2 completa al 100%.

**Bloqueos / dudas:**
- `JWT_SECRET` en `.env` actual tiene menos de 32 caracteres — la validación Zod lo rechaza y el servidor no arranca. **El usuario debe rotar el secret** (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) y actualizar `.env`.

**Siguiente paso:**
Semana 3: endpoint `GET /api/health`, cron CFDI, `.env.example`, separación dev/prod. Todo el código está listo para implementarse.

---

## 2026-06-02 — Semana 1 Fase 1-B: seguridad básica (8/10 completados)

**Hecho:**
- `agencySchema String?` agregado al modelo `User` en Prisma; migración aplicada (`20260602065623_add_agency_schema_to_user`).
- `user.model.js` — `createUser` acepta `agencySchema`.
- `auth.controller.js` — JWT ahora incluye `agencySchema` en el payload; `expiresIn` cambiado de `1h` a `8h`.
- `auth.controller.js` — `register` acepta y devuelve `agencySchema`.
- `auth.middleware.js` — inyecta `req.tenantSchema` desde el token; valida que el schema del request coincida con el del usuario (admin bypassa la validación).
- Rutas protegidas con `authenticateToken`: `cfdi.routes.js` (2 rutas), `cfdiDashboard.routes.js`, `cfdiClassifier.routes.js`, `sync.routes.js` (2 rutas), `ordenes.routes.js`, `announcement.routes.js` (GET / y GET /:id). Total: 9 rutas nuevas protegidas.
- `remoteClient.js` — migrado de `pg.Client` con `connect()` al importar a `pg.Pool` (lazy connection).
- `vencimientos.routes.js` descomentada en `index.js`.

**Decisiones:**
- `admin` role bypassa la validación de tenant — puede acceder a cualquier schema.
- `agencySchema` es `String?` (nullable) — usuarios existentes y admin no requieren agencia.
- `pg.Pool` en lugar de `pg.Client` para la conexión remota — misma interfaz `.query()`, sin cambios en el controller de vencimientos.
- Schemas Nissan y Kia confirmados sin diferencias estructurales. CORS: sin producción activa, se deja para cuando haya dominio asignado.

**Bloqueos / dudas:**
- `JWT_SECRET` actual no verificado — debe rotarse a valor fuerte antes de pasar a producción (`openssl rand -hex 32`). Pendiente: el usuario debe actualizar el `.env` local manualmente.
- `POST /api/auth/register` sigue siendo público — cualquiera puede crear usuarios. Pendiente decidir si se protege con rol `admin` o se deja como está.

- `helmet` instalado y aplicado en `index.js` (cabeceras HTTP de seguridad).
- `express-rate-limit` configurado: límite general 200 req/15 min en `/api`; límite estricto 20 req/15 min en `/api/auth` (anti-brute-force).
- `npm audit fix` ejecutado: vulnerabilidades reducidas de 9 a 4 (las 4 restantes son de `@xenova/transformers`, se eliminan en Semana 2).

**Siguiente paso:**
Semana 1 casi completa. Pendientes manuales del usuario: rotar `JWT_SECRET` y definir allowlist CORS cuando haya dominio de producción. Siguiente tarea de código: Semana 2 (TypeScript + Zod + Pino + eliminar dependencias muertas).

---

## 2026-06-02 — Definición de Fase 1-B: endurecimiento del núcleo

**Hecho:**
- Confirmadas aclaraciones del proyecto: agencias son Nissan Y Kia (mismo corporativo); schemas actuales son Kia. El servidor CFDI remoto es un servidor de contabilidad separado donde se descarga del SAT — no hay descarga directa en este repo. Despliegue en Windows + PM2. Sin staging activo. Sin documento RFP ANDANAC I.3 disponible.
- Evaluación del stack: las tecnologías elegidas son correctas para 2026. El problema no es el stack sino lo que le falta encima.
- Decisión: agregar Fase 1-B al roadmap — endurecimiento del núcleo con TypeScript + Zod + Helmet + Pino + tests — antes de abordar módulos de negocio (Unidades, Campañas, etc.).
- Actualizado `HITOS.md` con la nueva Fase 1-B (4 semanas, 20+ tareas detalladas).

**Decisiones:**
- Prioridad actual: Fase 1-B (núcleo sólido) antes que cualquier módulo nuevo.
- TypeScript en modo gradual (`allowJs: true`): archivos nuevos en `.ts`, existentes se migran al tocarlos.
- Zod para validación de entradas Y para validación de variables de entorno al arrancar.
- Pino reemplaza a `console.log` — logs JSON estructurados desde el inicio.
- Vitest como runner único para backend y frontend.
- CI mínimo: lint + tests en cada PR antes de merge.

**Bloqueos / dudas:**
- Confirmar si las agencias Nissan tendrán el mismo modelo de schemas PostgreSQL que las Kia, o si hay diferencias estructurales en las BDs remotas.
- Definir lista completa de orígenes para el allowlist de CORS (¿hay dominio de producción ya asignado?).

**Siguiente paso:**
Iniciar Semana 1 de Fase 1-B: seguridad básica. Comenzar por JWT en todas las rutas + campo `agencySchema` en `User` + validación de tenant en middleware.

---

## 2026-06-02 — Auditoría inicial y bootstrap de documentación

**Hecho:**
- Auditoría completa del repositorio: estructura, stack, módulos, seguridad, integraciones, deuda técnica.
- Generación del kit de documentación inicial: `CLAUDE.md`, `docs/CLIENTE.md`, `docs/PRODUCTO.md`, `docs/TECNICO.md`, `docs/HITOS.md`, `docs/BITACORA.md`, `docs/DESPLIEGUE.md`, `docs/MATRIZ-ANDANAC.md`.

**Hallazgos principales de la auditoría:**
- El módulo CFDI (sync ETL → clasificación IA → APIs + dashboard) es el único módulo completamente modernizado en el nuevo stack. Está bien estructurado.
- La plataforma base tiene brechas de seguridad importantes: la mayoría de las rutas del backend no tienen autenticación JWT; el schema de agencia viene en la URL sin validación contra el usuario autenticado.
- No existe API Gateway formal: hay Express plano con CORS abierto, sin rate limiting, sin logging centralizado, sin bitácora de auditoría.
- Los roles en código (`admin/editor/viewer`) no corresponden a los roles de negocio requeridos por ANDANAC (`Administrador/Contador/Ventas/Consulta`).
- No hay tests, no hay CI/CD, no hay separación de entornos dev/staging/prod.
- Las integraciones OEM (Nissan APIs, FPV, AutoVHC, Symmetrical, Portal Seminuevos) no existen en este repo.
- El proceso de sincronización CFDI es manual vía HTTP, sin automatización.

**Decisiones:**
- Se documenta el estado real del sistema sin idealizar. Los gaps se marcan explícitamente.
- Los archivos de documentación se crean en `/docs` (no existía la carpeta).
- Se mantiene `CLAUDE.md` en la raíz como punto de entrada para futuras sesiones.

**Bloqueos / dudas:**
- Los identificadores de agencia en código usan `kia_*` pero el contexto refiere agencias Nissan — confirmar si es naming legacy o si hay agencias Kia activas.
- No hay documentación del RFP ANDANAC I.3 disponible en el repo — la Matriz ANDANAC se construyó con los 7 ejes documentados en el contexto del proyecto.
- No se conocen los nombres de personas en los roles de stakeholders.
- Se desconoce si hay un entorno de staging o solo dev/prod.

**Siguiente paso:**
Cerrar las brechas de seguridad de la Fase 1 antes de avanzar al módulo de Unidades. Prioridad recomendada:
1. Agregar `authenticateToken` a todas las rutas del backend que lo requieren.
2. Agregar campo `agencySchema` al modelo `User` en Prisma + migración.
3. Modificar el JWT para incluir `agency` en el payload y validarlo en el middleware.
4. Corregir `remoteClient.js` para lazy connection (evita caída del servidor si BD de vencimientos no responde).
5. Rotar `JWT_SECRET` a un valor fuerte (mínimo 32 chars aleatorios).

