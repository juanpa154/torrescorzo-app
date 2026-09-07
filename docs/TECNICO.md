# Documentación Técnica — SIIA Cloud

## Stack real (detectado en repo)

### Backend
| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Runtime | Node.js | [POR CONFIRMAR] |
| Framework web | Express | 5.1.0 |
| ORM | Prisma | 6.7.0 |
| Auth | jsonwebtoken + bcryptjs | 9.0.2 / 3.0.2 |
| Clasificación IA | OpenAI SDK → GPT-4o-mini | 6.2.0 |
| ML (sin uso activo) | @xenova/transformers | 2.17.2 |
| Acceso BD Access legacy | node-adodb | 5.0.3 |
| Driver PostgreSQL raw | pg | 8.16.0 |
| Env vars | dotenv | 16.5.0 |
| CORS | cors | 2.8.5 |

### Frontend
| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| Framework UI | React | 19.1.0 |
| Routing | React Router DOM | 7.5.3 |
| Build tool | Vite | 6.3.5 |
| Estilos | Tailwind CSS | 3.4.17 |
| Gráficas | Recharts | 2.15.3 |
| Exportación Excel | ExcelJS | 4.4.0 |
| HTTP client | Axios | 1.10.0 |
| PWA | vite-plugin-pwa | 1.0.0 |

### Bases de datos activas
| BD | Motor | Host | Propósito |
|----|-------|------|-----------|
| `torrescorzo_local` | PostgreSQL | localhost | BD principal — usuarios, empleados, CFDI cache |
| `cfdi` | PostgreSQL | 94.72.115.250:5432 | Fuente de verdad CFDI por agencia (schemas) |
| `central_agencias` | PostgreSQL | 100.101.219.49:5432 | Vencimientos de cartera |
| `Servicio.mdb` | MS Access | \\gtcazac.webhop.net\... | Órdenes de servicio legacy |

---

## Arquitectura objetivo

> Los puntos marcados como **[OBJETIVO]** son la visión hacia la que se evoluciona; los marcados **[IMPLEMENTADO]** son lo que existe hoy.

### Diagrama conceptual

```
Frontend PWA (React)
        │
        ▼
[ API Gateway ]  ← [OBJETIVO: componente formal] / [IMPLEMENTADO: Express plano]
        │
        ├── Validación JWT + agencia  ← [OBJETIVO: siempre] / [IMPLEMENTADO: solo 2 rutas]
        ├── Enrutamiento por servicio  ← [OBJETIVO]
        ├── Logs + auditoría          ← [OBJETIVO]
        │
        ├── Módulo CFDI               ← [IMPLEMENTADO]
        ├── Módulo Vencimientos       ← [IMPLEMENTADO parcial]
        ├── Módulo Empleados          ← [IMPLEMENTADO]
        ├── Módulo Unidades           ← [PENDIENTE]
        ├── Módulo Campañas           ← [PENDIENTE]
        ├── Módulo Facturación        ← [PENDIENTE]
        │
        └── Integraciones externas
                ├── BD CFDI remota    ← [IMPLEMENTADO]
                ├── Nissan APIs       ← [PENDIENTE]
                ├── FPV               ← [PENDIENTE]
                ├── AutoVHC SOAP      ← [PENDIENTE]
                ├── Symmetrical FTP   ← [PENDIENTE]
                └── Portal Seminuevos ← [PENDIENTE]
```

---

## Reglas arquitectónicas no negociables

> Estas reglas son fijas. Cualquier decisión de implementación debe respetarlas.

**1. API-first**
Ningún componente (frontend, job, script, integración) accede directamente a la base de datos. Todo pasa por el API Gateway. Hoy violado por: `ordenes.routes.js` (accede directo a ADODB), `remoteClient.js` (singleton de BD que se conecta al importar).

**2. Multi-tenancy lógico**
PostgreSQL con un schema por agencia. La agencia del usuario autenticado debe validarse en cada request y usarse para filtrar datos. Hoy violado por: el schema se pasa como parámetro en la URL, no proviene del JWT; el modelo `User` no tiene campo `agency`.

**3. Integraciones por evento del negocio, no polling**
Las integraciones externas (Nissan, FPV, etc.) deben dispararse por eventos de negocio, no por timers o scraping. La sincronización de CFDI actual es polling manual; en el estado objetivo será event-driven.

**4. Migración progresiva**
Cada módulo migra de forma independiente. El legacy permanece funcional hasta que su sustituto esté validado en producción. Prohibido big-bang.

**5. JWT centralizado**
Roles y contexto de agencia se validan en el Gateway antes de cualquier operación. Hoy violado por: la mayoría de rutas no aplican `authenticateToken`; el JWT no contiene el campo `agency`.

**6. Versionamiento de APIs**
Las APIs se publican bajo `/v1/`, `/v2/`, etc. Los cambios que rompen compatibilidad crean una nueva versión sin eliminar la anterior. Hoy no implementado.

---

## Modelo multi-tenant

### Estado actual
- La BD remota CFDI (`94.72.115.250`) organiza datos en schemas PostgreSQL por agencia: `kia_zacatecas`, `kia_celaya`, `kia_lomas`.
- La BD local (Prisma) replica este modelo con el campo `schema` en las tablas CFDI.
- La lista de schemas válidos está hardcodeada en `backend/config/schemas.js`.
- **El tenant no se resuelve del JWT** — viene del parámetro de URL `?schema=` o `/:schema/`.

### Estado objetivo
1. El JWT incluye el campo `agency` (slug del schema PostgreSQL de la agencia del usuario).
2. El modelo `User` en Prisma tiene `agencySchema: String` (FK a `Agency.name`).
3. El middleware del Gateway extrae el schema del JWT y lo inyecta en el request.
4. Ninguna ruta acepta schema como parámetro público — lo toma del contexto autenticado.
5. Los usuarios globales (Dirección de Sistemas) pueden especificar schema con validación de rol.
6. El catálogo de agencias se gestiona vía API, no en `config/schemas.js`.

### Schemas conocidos
```javascript
// backend/config/schemas.js — HARDCODEADO, cambiar requiere deploy
['kia_zacatecas', 'kia_celaya', 'kia_lomas', 'cfdi']
// Nota: 'cfdi' es el nombre de la BD, no una agencia — posible error de nomenclatura
```

---

## Diseño del API Gateway

### Estado actual (Express plano)

`backend/index.js` registra las rutas directamente:

```
POST   /api/auth/register         ← pública
POST   /api/auth/login            ← pública
GET    /api/health                ← pública
GET    /api/profile               ← JWT ✅ + rol implícito (autenticado)
GET    /api/announcements         ← JWT ✅ + requireRole(ANUNCIOS_READ)
POST   /api/announcements         ← JWT ✅ + requireRole(ANUNCIOS_WRITE)
GET    /api/users                 ← JWT ✅ + requireRole(SOLO_ADMIN)
PUT    /api/users/:id/role        ← JWT ✅ + requireRole(SOLO_ADMIN)
GET    /api/employees             ← JWT ✅ + requireRole(RRHH_READ)
POST   /api/employees             ← JWT ✅ + requireRole(RRHH_WRITE)
DELETE /api/employees/:id         ← JWT ✅ + requireRole(SOLO_ADMIN)
GET    /api/settings              ← JWT ✅ + requireRole(CONFIG_READ)
POST/DELETE /api/settings/*       ← JWT ✅ + requireRole(SOLO_ADMIN)
GET    /api/ordenes               ← JWT ✅ + requireRole(ORDENES_READ)
GET    /api/cfdi/:schema/*        ← JWT ✅ + requireRole(FINANZAS_READ)
GET    /api/cfdi-dashboard        ← JWT ✅ + requireRole(FINANZAS_READ)
POST   /api/sync/ejecutar         ← JWT ✅ + requireRole(FINANZAS_WRITE)
GET    /api/sync/estado           ← JWT ✅ + requireRole(FINANZAS_READ)
GET    /api/ia/clasificar         ← JWT ✅ + requireRole(FINANZAS_WRITE)
GET    /api/vencimientos          ← JWT ✅ + requireRole(VENCIMIENTOS_READ)
```

### Estado objetivo (Gateway formal)

El Gateway es el único punto de entrada al sistema. Responsabilidades:

| Función | Descripción |
|---------|-------------|
| **Autenticación JWT** | Valida token en todas las rutas protegidas; rechaza sin token o token inválido. |
| **Contexto de agencia** | Extrae `agency` del JWT y lo propaga al servicio correspondiente. |
| **Autorización por rol** | Valida que el rol del usuario tiene permiso para la operación (`admin`, `contador`, `ventas`, `consulta`). |
| **Enrutamiento** | Dirige cada request al microservicio o módulo correcto. |
| **Versionamiento** | Prefijo `/v1/` en todas las rutas. |
| **Rate limiting** | Límite de requests por IP y por usuario. |
| **Logging centralizado** | Registra cada request con usuario, agencia, endpoint, status code, latencia. |
| **Bitácora de auditoría** | Persiste operaciones de escritura (quién, qué, cuándo, qué datos). |

---

## Estructura de microservicios (objetivo)

Cada dominio funcional es un módulo independiente con su propio conjunto de rutas, controladores, servicios y modelos. Hoy todos coexisten en un solo proceso Express.

| Dominio | Rutas actuales | Estado |
|---------|---------------|--------|
| Auth | `/api/auth/*` | Implementado |
| CFDI | `/api/cfdi/*`, `/api/cfdi-dashboard`, `/api/sync/*`, `/api/ia/*` | Implementado |
| Empleados | `/api/employees/*` | Implementado |
| Usuarios | `/api/users/*` | Implementado |
| Anuncios | `/api/announcements/*` | Implementado |
| Configuración | `/api/settings/*` | Implementado |
| Vencimientos | `/api/vencimientos/*` | Implementado |
| Órdenes (legacy) | `/api/ordenes/*` | Implementado (proxy a Access) |
| Unidades | — | Pendiente |
| Campañas | — | Pendiente |
| Facturación | — | Pendiente |
| Socio de Negocios | — | Pendiente |

---

## Flujo CFDI detallado (único módulo completo)

```
BD remota CFDI (94.72.115.250)
  schemas: kia_zacatecas, kia_celaya, kia_lomas
  tablas:  ing_eg_emi (emitidos), ing_eg_rec (recibidos)
        │
        │  POST /api/sync/ejecutar?schema=X&tipo=Y
        ▼
  cfdiSync.service.js
  - Consulta ultimaSync de SyncEstado (Prisma)
  - Si existe: query incremental (desde ultimaSync - 1 día)
  - Si no existe: query completo
  - Upsert por lotes de 50 en Prisma (uuid+schema como clave única)
  - Actualiza SyncEstado.ultimaSync
        │
        ▼
  BD local Prisma (torrescorzo_local)
  tablas: cfdi_emitidos, cfdi_recibidos, sync_estados
        │
        │  GET /api/ia/clasificar?schema=X&tipo=Y&limit=N
        ▼
  clasificarMasivo.js
  - Busca registros con categoriaIa = null y conceptos != null
  - Si hay sync local → clasificarDesdeLocal
  - Si no → clasificarDesdeRemoto (solo recibidos)
        │
        ▼
  cfdiClassifier.js → OpenAI GPT-4o-mini
  - Prompt: contador experto en CFDI de agencias automotrices
  - Modelo: gpt-4o-mini, temperature: 0.1
  - Lotes de 50 conceptos por llamada
  - Retorna lista numerada de categorías
  - 14 categorías contables predefinidas + "Otro"
        │
        ▼
  UPDATE categoriaIa en BD local (siempre)
  UPDATE categoria_ia en BD remota ing_eg_rec (solo recibidos, para mantener sincronía)
        │
        │  GET /api/cfdi/:schema/ingresos
        │  GET /api/cfdi/:schema/recibidos
        │  GET /api/cfdi-dashboard?schema=X&anio=Y
        ▼
  cfdi.controller.js / cfdiDashboard.controller.js
  - Si hay sync local (tieneDatosLocales): sirve desde Prisma
  - Si no: query directo a BD remota
  - Filtros: mes, año, tipo, RFC, montos, categoriaIa
  - Dashboard: agregados, series mensuales, top clientes/proveedores, por tipo
```

---

## Manejo de JWT y autorización

### Implementación actual

**Generación del token** (`auth.controller.js`):
```javascript
jwt.sign(
  { id: user.id, email: user.email, role: user.role, agencySchema: user.agencySchema },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
)
```

**Autenticación** (`auth.middleware.js` → `authenticateToken`):
- Verifica el JWT en el header `Authorization: Bearer <token>`.
- Inyecta `req.user` y `req.tenantSchema` (del campo `agencySchema` del token).
- Valida que el schema solicitado (`req.params.schema` o `req.query.schema`) coincida con el del JWT; los `admin` pueden acceder a cualquier schema.

**Autorización por rol** (`authorize.middleware.js` → `requireRole(...roles)`):
- Se encadena después de `authenticateToken` en cada ruta.
- Verifica que `req.user.role` esté en la lista de roles permitidos.
- Responde 403 si el rol no tiene permiso.

---

### Roles del sistema (`src/config/roles.js`)

| Rol | Perfil | Notas |
|-----|--------|-------|
| `admin` | Dirección de Sistemas / IT | Acceso total |
| `gerente` | Gerente de agencia / Director | Lectura total, sin operaciones técnicas |
| `contador` | Contador / Administración | CFDI, sync, IA, empleados lectura/escritura |
| `ventas` | Asesor / Jefe de ventas | Vencimientos, unidades (futuro), anuncios |
| `servicio` | Jefe de servicio / Recepción | Órdenes de servicio, anuncios |
| `consulta` | Solo lectura | Dashboards y reportes |
| `editor` | Legacy — equivalente a `contador` | Compatibilidad hacia atrás |
| `viewer` | Legacy — equivalente a `consulta` | Compatibilidad hacia atrás |

### Matriz de permisos por ruta

| Ruta | Método | admin | gerente | contador | ventas | servicio | consulta |
|------|--------|:-----:|:-------:|:--------:|:------:|:--------:|:--------:|
| `/users` | GET | ✓ | | | | | |
| `/users/:id/role` | PUT | ✓ | | | | | |
| `/settings` | GET | ✓ | ✓ | ✓ | | | |
| `/settings/agency\|location` | POST/DELETE | ✓ | | | | | |
| `/employees` | GET | ✓ | ✓ | ✓ | | | |
| `/employees` | POST/PUT | ✓ | | ✓ | | | |
| `/employees` | DELETE | ✓ | | | | | |
| `/cfdi/*` + `/cfdi-dashboard` | GET | ✓ | ✓ | ✓ | | | ✓ |
| `/sync/ejecutar` | POST | ✓ | | ✓ | | | |
| `/sync/estado` | GET | ✓ | ✓ | ✓ | | | ✓ |
| `/ia/clasificar` | GET | ✓ | | ✓ | | | |
| `/ordenes` | GET | ✓ | ✓ | ✓ | | ✓ | ✓ |
| `/vencimientos` | GET | ✓ | ✓ | ✓ | ✓ | | ✓ |
| `/announcements` | GET | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `/announcements` | POST | ✓ | ✓ | | | | |

> Los roles legacy `editor` y `viewer` tienen los mismos permisos que `contador` y `consulta` respectivamente.

### Gaps pendientes
1. JWT expira en 8h sin refresh token — estrategia de refresh pendiente (Fase 3).
2. CORS allowlist — pendiente hasta tener dominio de producción.

---

## Integraciones técnicas

### BD CFDI remota — PostgreSQL pool (`cfdiPool.js`)
- Conexión persistente por pool (máx. 10 conexiones)
- `statement_timeout: 120s`, `connectionTimeoutMillis: 10s`
- Acceso por schema: `SET search_path = kia_zacatecas` vía `options` del cliente
- **Por qué pool**: volumen alto de consultas de lectura en dashboard y listados

### BD CFDI remota — cliente por request (`cfdiClient.js`)
- Cliente `pg.Client` nuevo por operación de escritura
- Se conecta, opera y desconecta (connect/query/end)
- **Por qué client**: escrituras puntuales (UPDATE categoria_ia) que no justifican conexión persistente

### BD Vencimientos — cliente singleton persistente (`remoteClient.js`)
- **Problema grave**: `remoteClient.connect()` se llama al importar el módulo
- Si la BD no está disponible en el arranque, el servidor falla
- **Solución objetivo**: lazy connection o pool igual que CFDI

### OpenAI — REST vía SDK
- Modelo: `gpt-4o-mini` (menor costo, suficiente para clasificación)
- Temperatura: `0.1` (resultados deterministas para contabilidad)
- Lotes de 50 conceptos por llamada para no exceder `max_tokens`
- **Por qué REST**: OpenAI no ofrece alternativa SOAP/FTP

### MS Access legacy — ADODB
- Acceso vía red a archivo `.mdb` en servidor legacy
- **Por qué ADODB**: el sistema legacy usa MS Access; no hay migración aún
- Sin autenticación ni manejo de errores robusto en la ruta de órdenes

### Integraciones pendientes — mecanismos previstos

| Integración | Mecanismo previsto | Justificación |
|------------|-------------------|---------------|
| Nissan APIs | REST + webhook/evento | API moderna, event-driven |
| FPV | Webhook / suscripción eventos | Modelo event-driven del OEM |
| AutoVHC | SOAP | Sistema legado del proveedor, no ofrece REST |
| Symmetrical | FTP / SFTP | Protocolo de intercambio de archivos definido por el proveedor |
| Portal Seminuevos | Archivo diario (FTP/HTTP upload) | Portal acepta archivo estructurado, no API |

---

## Versionamiento de APIs

**Estado actual:** no implementado. Todas las rutas son `/api/recurso`.

**Estado objetivo:**
- Rutas bajo `/api/v1/recurso`
- Cambios que rompen compatibilidad → `/api/v2/recurso` sin eliminar v1
- Headers de deprecación en versiones antiguas: `Deprecation: true`, `Sunset: YYYY-MM-DD`

---

## Glosario técnico

| Término | Definición |
|---------|-----------|
| **Prisma** | ORM para Node.js/TypeScript. Gestiona el schema de la BD local, las migraciones y genera el cliente tipado. |
| **Upsert** | Operación de BD: INSERT si no existe, UPDATE si ya existe (por clave única). Usado en la sincronización CFDI para evitar duplicados. |
| **Pool de conexiones** | Conjunto de conexiones abiertas reutilizables. Evita el costo de abrir/cerrar conexión en cada request. |
| **Schema PostgreSQL** | Espacio de nombres dentro de una BD PostgreSQL. Permite tener tablas con el mismo nombre aisladas por namespace (ej: `kia_zacatecas.ing_eg_emi`). |
| **JWT** | JSON Web Token — token firmado que contiene el payload del usuario. No se almacena en BD; se verifica con el secret. |
| **CORS** | Cross-Origin Resource Sharing — mecanismo que controla qué orígenes pueden hacer requests al API. |
| **ETL** | Extract, Transform, Load — en CFDI: extrae de BD remota, transforma estructura, carga en BD local. |
| **GPT-4o-mini** | Modelo de OpenAI — variante económica de GPT-4o, suficiente para clasificación con prompts estructurados. |
| **ADODB** | ActiveX Data Objects for Database — tecnología Microsoft para acceder a fuentes de datos OLE DB, incluyendo MS Access. |
| **Multi-tenant lógico** | Arquitectura donde múltiples clientes (tenants) comparten la misma instancia de la aplicación pero sus datos están aislados (en este caso, por schema PostgreSQL). |
| **vite-plugin-pwa** | Plugin de Vite que convierte la app React en Progressive Web App — permite instalación en dispositivos y funcionamiento offline básico. |
