# Despliegue — SIIA Cloud

## Entornos

### Estado actual: desarrollo local + despliegue objetivo definido

Desarrollo local vía `.env` en `backend/`. El frontend ya no hardcodea la URL del API — usa `VITE_API_URL` (default `/api` en dev, vía proxy de Vite).

**Plataforma elegida:** backend en **Railway**, frontend en **Vercel**.

| Entorno | Propósito | Estado |
|---------|-----------|--------|
| **Development** | Trabajo local de cada desarrollador | Implícito (localhost) |
| **Production** | Operación real de las agencias | Backend → Railway (root `backend/`), Frontend → Vercel (root `frontend/`) |

> **[PENDIENTE DE DEFINIR]** Si se usará un entorno de Staging separado en Railway/Vercel (ambas plataformas soportan preview deployments por rama/PR, que pueden cubrir ese rol sin un entorno formal aparte).

### Bloqueador resuelto: `node-adodb` / MDB legacy

`backend/src/db.js` abría una conexión ADODB a un `.mdb` vía red Windows (`Provider=Microsoft.ACE.OLEDB.12.0`) **a nivel de módulo**, y se montaba incondicionalmente en `index.js` como ruta `/api/ordenes`. Esa dependencia solo funciona en Windows y no se usaba desde el frontend — en Railway (Linux) tumbaba el arranque de todo el backend. Se removió el `require`/`app.use` de `ordenes.routes` en `index.js`; los archivos `db.js` y `ordenes.routes.js` quedan sin usar en el repo como referencia si se retoma esa integración desde un servicio Windows aparte (regla API-first de `CLAUDE.md`).

---

## Requisitos de entorno

### Backend (Node.js)
```
Node.js        >= 18 LTS  [POR CONFIRMAR versión exacta en uso]
npm            >= 9
PostgreSQL     >= 14       (BD local torrescorzo_local)
Acceso red     94.72.115.250:5432   (BD CFDI remota)
Acceso red     100.101.219.49:5432  (BD vencimientos remota)
Acceso red     \\gtcazac.webhop.net (MS Access legacy vía ADODB — solo Windows)
```

> **Nota:** `node-adodb` (MS Access) solo funciona en Windows con Microsoft ACE OLEDB instalado. Si el servidor de producción es Linux, la ruta de órdenes legacy no funcionará.

### Frontend (build estático)
```
Node.js        >= 18 LTS
npm            >= 9
Servidor web   Nginx / Apache / CDN capaz de servir SPA (con fallback a index.html)
```

---

## Variables de entorno por entorno

Crear un archivo `.env.[entorno]` o gestionar con el sistema de secretos elegido:

```bash
# ──────────────────────────────────────
# BD Local (Prisma)
# ──────────────────────────────────────
DATABASE_URL=postgresql://usuario:contraseña@host:5432/torrescorzo_[entorno]

# ──────────────────────────────────────
# BD CFDI remota
# ──────────────────────────────────────
PG_CFDI_HOST=
PG_CFDI_PORT=5432
PG_CFDI_USER=
PG_CFDI_PASSWORD=
PG_CFDI_DB=cfdi

# ──────────────────────────────────────
# BD Vencimientos remota
# ──────────────────────────────────────
TU_HOST_REMOTO=
TU_USUARIO=
TU_PASSWORD=
NOMBRE_DE_LA_BD=central_agencias

# ──────────────────────────────────────
# JWT (cambiar por entorno — nunca reutilizar)
# ──────────────────────────────────────
JWT_SECRET=<mínimo 32 chars aleatorios — generar con: openssl rand -hex 32>

# ──────────────────────────────────────
# OpenAI
# ──────────────────────────────────────
OPENAI_API_KEY=

# ──────────────────────────────────────
# Puerto
# ──────────────────────────────────────
PORT=3000
```

> **Gestión de secretos:** [PENDIENTE DE DEFINIR] si se usará un vault (HashiCorp Vault, AWS Secrets Manager, Azure Key Vault), variables de entorno del sistema operativo del host, o un gestor de configuración en el pipeline CI/CD.

---

## Proceso de despliegue actual

No existe pipeline automatizado (CI/CD sigue pendiente en HITOS.md). El despliegue a Railway/Vercel es por autodeploy de cada plataforma al hacer push a `main` (o por PR preview).

### Setup Railway (backend)

1. Nuevo servicio → conectar el repo de GitHub → **root directory** `backend/`.
2. Build/start los detecta Nixpacks vía `package.json` (`npm start` → `tsx index.js`). `postinstall` corre `prisma generate` automáticamente.
3. Configurar **Release command**: `npx prisma migrate deploy` (aplica migraciones antes de cada release, sin generar una nueva).
4. Variables de entorno: cargar todas las de `backend/.env.example`, con `JWT_SECRET` nuevo (no reusar el de dev) y `CORS_ORIGIN` con la URL pública de Vercel una vez asignada.
5. Railway inyecta `PORT` automáticamente — `index.js` ya lo lee de `env.PORT`, sin cambios necesarios.
6. Confirmar que las BDs remotas (`94.72.115.250` CFDI, `100.101.219.49` vencimientos) aceptan conexiones desde las IPs de salida de Railway — **[PENDIENTE DE DEFINIR]**, requiere validarlo con quien administra esos firewalls.

### Setup Vercel (frontend)

1. Nuevo proyecto → conectar el repo → **root directory** `frontend/`.
2. Build command `npm run build`, output `dist/` (autodetectado por el framework Vite).
3. Variable de entorno `VITE_API_URL` = URL pública del backend en Railway + `/api` (ej. `https://siia-cloud-backend.up.railway.app/api`).
4. `vercel.json` ya incluye el rewrite SPA a `index.html` para que las rutas de React Router no den 404 al refrescar.
5. Tras el primer deploy, revisar en incógnito que el service worker de `vite-plugin-pwa` no sirva una versión cacheada vieja del API.

---

## Checklist de despliegue

Orden recomendado para el primer despliegue completo (incluye el catálogo de Códigos — se evaluó su tamaño en BITACORA 2026-08-26: bien por debajo de 200 MB, sin costo relevante).

1. **Commitear el estado actual del repo.** Al iniciar esta sesión había varios archivos modificados/sin trackear en `backend/` y `frontend/` — revisarlos y decidir qué se commitea antes de conectar Railway/Vercel para autodeploy.
2. **Railway → Postgres:** crear el plugin de Postgres del proyecto. Railway expone `DATABASE_URL` como variable referenciable (`${{Postgres.DATABASE_URL}}`) para el servicio de backend.
3. **Railway → servicio backend:** nuevo servicio desde el repo de GitHub, root directory `backend/`. Cargar variables de entorno (todas las de `.env.example`): `DATABASE_URL` (referencia al plugin), `JWT_SECRET` (nuevo, no reusar el de dev), `OPENAI_API_KEY`, `PG_CFDI_*`, `TU_*`, `NODE_ENV=production`, `LOG_LEVEL=info`, `CFDI_CRON_ENABLED`/`CFDI_CRON_SCHEDULE`. Dejar `CORS_ORIGIN` pendiente hasta el paso 8.
4. **Railway → Release command:** configurar `npx prisma migrate deploy` en Settings → Deploy, para que cada release aplique migraciones antes de arrancar.
5. **Deploy y verificación:** confirmar `GET /api/health` responde `{ status, version, uptime, db }`.
6. **Crear el usuario admin inicial en producción** — `scripts/createAdmin.js` corre localmente pero contra la BD de Railway usando Railway CLI: `railway link` (vincular al proyecto) y luego `railway run node scripts/createAdmin.js` (inyecta las env vars del servicio sin exponerlas).
7. **Migrar el catálogo de Códigos (ETL):** `prisma/etl-codigos-mdb.js` usa `node-adodb`/Jet OLEDB para leer `CODIGOS.MDB` desde el share Windows (`\\gtcazac.webhop.net\...`) — **solo puede correr desde una PC Windows con acceso a ese share**, nunca desde Railway (Linux). Pasos:
   - En Railway, habilitar temporalmente "Public Networking" en el plugin de Postgres para obtener una connection string pública.
   - En la PC Windows, en `backend/.env` local, apuntar `DATABASE_URL` a esa connection string pública de Railway (temporalmente).
   - Correr `node prisma/seed.js` (catálogos de dominio) y `node prisma/etl-codigos-mdb.js --schema=nissan_tc --only-codigos` (32,270 registros), luego `node prisma/validate-etl.js` para confirmar integridad.
   - Revertir `DATABASE_URL` local a la BD de desarrollo y, si no se va a reusar pronto, desactivar el "Public Networking" del Postgres en Railway.
8. **Vercel → proyecto frontend:** conectar el repo, root directory `frontend/`, variable `VITE_API_URL` = URL pública del backend en Railway + `/api`. Deploy.
9. **Railway → `CORS_ORIGIN`:** una vez asignado el dominio de Vercel, setear esa URL en `CORS_ORIGIN` del backend y redeploy.
10. **Smoke test end-to-end:** login con el admin creado en el paso 6, búsqueda en el módulo Códigos, CFDI dashboard, vencimientos.
11. **Validar conectividad a BDs remotas:** confirmar que `94.72.115.250` (CFDI) y `100.101.219.49` (vencimientos) aceptan conexiones desde las IPs de salida de Railway. Railway no tiene IP de salida fija por defecto — si esas BDs restringen por IP (whitelisting), se necesita el add-on de "Static Outbound IP" de Railway o coordinar con quien administra esos firewalls.

---

## Estrategia de despliegue objetivo (por módulo)

Dado el principio de migración progresiva, cada módulo se despliega independientemente sin detener el sistema.

### Backend

```bash
# 1. Verificar que no hay migraciones destructivas pendientes
npx prisma migrate status

# 2. Aplicar migraciones (sin downtime si son aditivas)
npx prisma migrate deploy

# 3. Reiniciar el servidor con zero-downtime
# Opción A — PM2 (recomendado para servidor VPS):
pm2 reload siia-cloud --update-env

# Opción B — systemd:
sudo systemctl restart siia-cloud
```

### Frontend

```bash
# Compilar
cd frontend && npm run build

# Copiar dist/ al servidor web
# [PENDIENTE DE DEFINIR] mecanismo: rsync, S3 sync, Nginx root, etc.
```

---

## Migraciones de BD por schema/agencia

### BD local (Prisma)

Prisma gestiona las migraciones de la BD local (`torrescorzo_local`). Las migraciones son versionadas en `backend/prisma/migrations/`.

```bash
# Crear nueva migración durante desarrollo
cd backend && npx prisma migrate dev --name nombre_descriptivo

# Aplicar en staging/producción (sin generar nueva migración)
npx prisma migrate deploy

# Verificar estado de migraciones
npx prisma migrate status
```

**Reglas:**
- Nunca editar una migración ya aplicada en producción.
- Las migraciones deben ser aditivas siempre que sea posible (añadir columnas/tablas, no eliminar ni renombrar directamente).
- Para cambios destructivos (drop column, rename): crear migración de compatibilidad hacia atrás primero, luego la migración real.

### BD CFDI remota (schemas por agencia)

**No hay sistema de migración para la BD remota.** Los schemas `kia_zacatecas`, `kia_celaya`, `kia_lomas` en `94.72.115.250` son gestionados fuera de este repo (probablemente por el sistema SIIA legacy).

> **[PENDIENTE DE DEFINIR]** Proceso para:
> - Agregar un nuevo schema de agencia en la BD CFDI remota
> - Actualizar `config/schemas.js` de forma dinámica (actualmente hardcodeado)
> - Verificar que la estructura de tablas (`ing_eg_emi`, `ing_eg_rec`) es idéntica en todos los schemas

---

## Convivencia con el legacy

El sistema legacy SIIA sigue operando en paralelo durante la migración. Las reglas de convivencia:

| Situación | Regla |
|-----------|-------|
| Módulo no migrado | El frontend redirige al legacy para esa funcionalidad |
| Módulo en migración | El nuevo módulo opera en paralelo; se valida contra el legacy antes de apagar |
| Datos compartidos | El nuevo sistema lee de la BD legacy (remota) mediante ETL — no modifica los datos de origen |
| Apagado del legacy | Solo cuando el nuevo módulo ha operado en producción sin incidentes por al menos 30 días |

> **[PENDIENTE DE DEFINIR]** URL y acceso al sistema legacy SIIA para referencia de los desarrolladores.

---

## Estrategia de rollback

### Rollback de código (backend)

```bash
# Con PM2:
pm2 list                          # ver versión en ejecución
# Volver al release anterior:
git checkout <commit-anterior>
pm2 reload siia-cloud --update-env
```

### Rollback de migraciones Prisma

Prisma no soporta rollback automático de migraciones. Opciones:

1. **Migración inversa manual:** crear una nueva migración que deshaga el cambio (opción preferida).
2. **Restore de BD:** restaurar desde backup previo a la migración (solo en casos críticos, con pérdida de datos posteriores al backup).

> **[PENDIENTE DE DEFINIR]** Política de backups de la BD local `torrescorzo_local`: frecuencia, retención, almacenamiento.

### Rollback de frontend

El frontend es estático (`dist/`). Rollback = reemplazar el directorio con el build anterior.

> **[PENDIENTE DE DEFINIR]** Si se mantienen builds anteriores en el servidor o en un sistema de almacenamiento.

---

## Monitoreo y logs

### Estado actual

Solo `console.log/error` en los servicios del backend. No hay:
- Logging estructurado (JSON logs)
- Agregación de logs en servidor central
- Alertas automáticas
- Health check endpoint
- Dashboard de métricas

### Estado objetivo

| Componente | Herramienta sugerida | Prioridad |
|-----------|---------------------|-----------|
| Logging estructurado | `pino` o `winston` (JSON) | Alta |
| Health check | `GET /api/health` → `{ status: "ok", version, uptime }` | Alta |
| Agregación de logs | **[PENDIENTE DE DEFINIR]** (Datadog, Grafana Loki, Papertrail) | Media |
| Métricas de performance | **[PENDIENTE DE DEFINIR]** | Media |
| Alertas | **[PENDIENTE DE DEFINIR]** | Media |
| Uptime monitoring | **[PENDIENTE DE DEFINIR]** | Media |

---

## CI/CD

### Estado actual

No existe pipeline. Todo es manual.

### Estado objetivo

**[PENDIENTE DE DEFINIR]** plataforma CI/CD (GitHub Actions, GitLab CI, Jenkins, etc.).

Pipeline mínimo recomendado:

```yaml
# Por cada PR o push a main:
1. install dependencies
2. lint (ESLint backend + frontend)
3. run tests (cuando existan)
4. build frontend
5. prisma migrate status (verificar sin migraciones pendientes no aplicadas)

# Por cada merge a main (deploy a staging):
6. prisma migrate deploy (staging)
7. pm2 reload (staging)
8. smoke test automático

# Deploy a producción: manual con aprobación
9. prisma migrate deploy (producción)
10. pm2 reload (producción)
11. notificación al equipo
```

---

## Seguridad por entorno

| Medida | Dev | Staging | Prod | Estado actual |
|--------|:---:|:-------:|:----:|--------------|
| JWT_SECRET único por entorno | ⚠ | ✅ | ✅ | Rotado a valor fuerte; generar uno nuevo distinto para Railway prod |
| CORS restrictivo (allowlist de orígenes) | ⚠ | ✅ | ✅ | Mecanismo listo (`CORS_ORIGIN`); falta configurar la URL de Vercel en Railway |
| HTTPS | No requerido | ✅ | ✅ | Automático — Railway y Vercel sirven HTTPS por defecto |
| Secrets en vault / env CI | ⚠ | ✅ | ✅ | `.env` local en dev; variables de entorno del dashboard de Railway/Vercel en prod (sin vault dedicado) |
| Rate limiting | ✅ | ✅ | ✅ | `express-rate-limit` activo en todas las rutas |
| `.env` fuera del repo | ✅ | ✅ | ✅ | Correcto (en `.gitignore`) |
