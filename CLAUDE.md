# SIIA Cloud — DMS Grupo Torres Corzo (agencias Nissan/Kia)

## Comandos del proyecto

```bash
# Backend
cd backend
npm start                             # producción → tsx index.js (puerto 3000)
npm run dev                           # desarrollo con recarga automática → tsx --watch index.js
npx prisma migrate dev                # aplicar migraciones en BD local
npx prisma migrate deploy             # aplicar migraciones en producción
npx prisma studio                     # explorador visual de BD
node scripts/createAdmin.js           # crear usuario administrador inicial

# Frontend
cd frontend
npm run dev                           # servidor de desarrollo (Vite, con proxy a :3000)
npm run build                         # compilar para producción → dist/
npm run preview                       # previsualizar build de producción
npm run lint                          # ESLint
```

## Variables de entorno requeridas (backend/.env)

```
DATABASE_URL=          # PostgreSQL local (Prisma)
TU_HOST_REMOTO=        # IP BD remota vencimientos
TU_USUARIO=            # usuario BD vencimientos
TU_PASSWORD=           # contraseña BD vencimientos
NOMBRE_DE_LA_BD=       # nombre BD vencimientos
JWT_SECRET=            # secreto JWT (mínimo 32 chars en prod)
PG_CFDI_HOST=          # IP BD remota CFDI
PG_CFDI_PORT=          # puerto BD CFDI
PG_CFDI_USER=          # usuario BD CFDI
PG_CFDI_PASSWORD=      # contraseña BD CFDI
PG_CFDI_DB=            # nombre BD CFDI
OPENAI_API_KEY=        # clave API OpenAI (GPT-4o-mini)
PORT=                  # opcional, default 3000
```

## Convenciones detectadas

**Estructura de capas (backend):**
`routes/*.routes.js` → `controllers/*.controller.js` → `models/*.model.js` (Prisma)
Para CFDI: `routes` → `controllers` → `services/` + `jobs/` + `helpers/`

**Naming:**
- Archivos: `kebab-case.tipo.js` (ej: `cfdiSync.service.js`, `auth.middleware.js`)
- Modelos Prisma: `PascalCase` singular (ej: `CfdiEmitido`)
- Tablas BD: `snake_case` plural (ej: `cfdi_emitidos`)
- Variables y funciones JS: `camelCase`
- Constantes de categorías: arrays en UPPER_CASE (`CATEGORIAS_IA`, `TABLA_MAP`)

**Frontend:**
- Páginas en `src/pages/` — un archivo por pantalla, nombre `PascalCase.jsx`
- Componentes reutilizables en `src/components/`
- Llamadas API centralizadas en `src/services/api.js`
- Exportaciones a Excel en `src/utils/`

**Multi-tenancy:**
- El schema de agencia se pasa como parámetro de URL (`:schema` o `?schema=`)
- Schemas conocidos en `backend/config/schemas.js`
- Al agregar una agencia: actualizar `config/schemas.js` + verificar acceso a BD remota

**Autenticación:**
- JWT en header `Authorization: Bearer <token>`
- Token incluye: `{ id, email, role }`
- Roles actuales en código: `admin`, `editor`, `viewer`

## Reglas arquitectónicas no negociables

1. **API-first** — ningún componente accede directo a BD; todo pasa por el API Gateway (hoy: Express; objetivo: Gateway formal).
2. **Multi-tenancy lógico** — PostgreSQL con schema por agencia; validación de tenant obligatoria en cada request (hoy: parcial — el schema viene en URL, no del JWT).
3. **Integraciones por evento del negocio**, no polling.
4. **Migración progresiva** — convivencia híbrida con el legacy; prohibido big-bang.
5. **JWT centralizado** — roles y agencia validados antes de cualquier operación (hoy: solo en 2 de 12 rutas).
6. **Versionamiento de APIs** sin romper compatibilidad (hoy: no implementado).

## Archivos de referencia

| Archivo | Contenido |
|---------|-----------|
| [docs/CLIENTE.md](docs/CLIENTE.md) | Grupo Torres Corzo, stakeholders, glosario de negocio |
| [docs/PRODUCTO.md](docs/PRODUCTO.md) | Visión SIIA Cloud, módulos, roles, integraciones desde el negocio |
| [docs/TECNICO.md](docs/TECNICO.md) | Stack real, arquitectura objetivo vs implementado, multi-tenant, Gateway |
| [docs/HITOS.md](docs/HITOS.md) | Roadmap 2026, fases, entregables, Matriz ANDANAC |
| [docs/BITACORA.md](docs/BITACORA.md) | Log cronológico de sesiones de trabajo |
| [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) | Entornos, estrategia de deploy, migraciones, rollback, secretos |
| [docs/MATRIZ-ANDANAC.md](docs/MATRIZ-ANDANAC.md) | Checklist vivo de cumplimiento ANDANAC 2026 |

## Protocolo de sesión

### Al iniciar — qué leer (en este orden)

1. Este archivo (`CLAUDE.md`) — ya lo estás leyendo
2. `docs/BITACORA.md` — **solo la entrada más reciente** — qué se hizo, qué sigue
3. `docs/HITOS.md` — identificar la fase activa y los próximos `[ ]` a completar
4. Solo si aplica a la tarea: `docs/TECNICO.md` (arquitectura/stack), `docs/DESPLIEGUE.md` (infra/secretos)
5. Los archivos de código relevantes al hito — el contexto del código siempre manda sobre la documentación

### Durante la sesión

- Trabajar solo en los checkboxes del hito activo — no implementar fuera de scope
- No inventar: si algo no está claro en el código, preguntar antes de asumir
- Si se descubre algo fuera de scope (bug, deuda, oportunidad), anotarlo en bitácora como bloqueo/duda, no implementarlo
- Marcar `[x]` en `docs/HITOS.md` conforme se completan las tareas — no al final, sino en el momento

### Al finalizar — qué actualizar

| Documento | Cuándo actualizarlo |
|-----------|-------------------|
| `docs/HITOS.md` | Marcar `[x]` en cada tarea completada |
| `docs/BITACORA.md` | Siempre — agregar entrada al inicio con el formato de abajo |
| `CLAUDE.md` | Si cambiaron comandos, convenciones o variables de entorno |
| `docs/TECNICO.md` | Si se tomaron decisiones de arquitectura o cambió el stack |
| `docs/DESPLIEGUE.md` | Si cambió la estrategia de despliegue, entornos o secretos |
| `docs/MATRIZ-ANDANAC.md` | Si un requerimiento ANDANAC pasó de estado |

### Formato de entrada en bitácora

Agregar al **inicio** de `docs/BITACORA.md` (la entrada más reciente siempre arriba):

```markdown
## YYYY-MM-DD — Título corto

**Hecho:** qué se implementó, analizó o decidió  
**Decisiones:** decisiones de diseño o arquitectura tomadas  
**Bloqueos / dudas:** qué quedó pendiente de resolver  
**Siguiente paso:** próxima acción concreta recomendada  
```

---

## Prompt de inicio de sesión (copiar y pegar en chat nuevo)

```
Proyecto: SIIA Cloud — DMS Grupo Torres Corzo (agencias Nissan/Kia)
Repo: e:\ProyectosKia\torrescorzo-app\torrescorzo-app\

Antes de responder cualquier cosa, lee estos archivos en este orden:
1. CLAUDE.md — contexto del proyecto, comandos, reglas arquitectónicas
2. docs/BITACORA.md — SOLO la entrada más reciente (la primera del archivo)
3. docs/HITOS.md — identifica la fase activa y los checkboxes [ ] pendientes

Luego dime:
- En qué fase y semana estamos según HITOS.md
- Cuál es el próximo bloque de tareas a completar
- Si hay algún bloqueo registrado en la bitácora que debamos resolver primero

Después de que me des ese resumen, [DESCRIBE AQUÍ LO QUE QUIERES HACER EN ESTA SESIÓN].

Al terminar la sesión:
- Marca [x] los checkboxes completados en docs/HITOS.md
- Agrega una entrada al inicio de docs/BITACORA.md
- Actualiza cualquier otro .md que corresponda según el protocolo en CLAUDE.md
```
