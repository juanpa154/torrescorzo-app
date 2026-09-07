# Producto: SIIA Cloud

## Visión

SIIA Cloud es la evolución del DMS legacy SIIA hacia una plataforma **modular, API-first y multi-tenant** que centraliza la operación de las agencias de Grupo Torres Corzo bajo un modelo de datos unificado, con integraciones reales al ecosistema Nissan y capacidad de certificación ANDANAC 2026.

La estrategia es de **migración progresiva**: convivencia con el legacy durante la transición, sin big-bang, moviendo dominio por dominio al nuevo stack.

---

## Módulos funcionales

| Módulo | Estado actual | Descripción |
|--------|--------------|-------------|
| **CFDI** | **Modernizado / Operativo** | Descarga desde BD SAT legacy → ETL → caché local → clasificación contable IA → APIs REST + dashboard. Es el módulo más maduro del nuevo stack. |
| **Vencimientos de cartera** | **Parcialmente portado** | Consulta protegida con JWT contra BD remota `central_agencias`. Sin sincronización local, sin dashboard. |
| **Directorio de empleados** | **Operativo (nuevo)** | CRUD completo con roles, agencia y ubicación. No es funcionalidad DMS central pero está implementado. |
| **Anuncios internos** | **Operativo (nuevo)** | Publicación de avisos por parte de administradores. No es funcionalidad DMS central. |
| **Órdenes de servicio** | **Legacy activo** | Consulta directa a la BD MS Access del SIIA legacy (\\gtcazac.webhop.net\...\Servicio.mdb). Sin migración al nuevo stack. |
| **Campañas** | **Pendiente** | No existe en este repo. Requiere integración con Nissan OEM. |
| **Socio de Negocios** | **Pendiente** | No existe en este repo. |
| **Facturación / Ventas** | **Pendiente** | No existe en este repo. Los CFDI actuales son consulta contable, no generación de facturas. |
| **Unidades (inventario)** | **Pendiente — crítico** | No existe en este repo. Identificado como el módulo más crítico a migrar (Q2–Q3 2026). |
| **Postventa / Taller** | **Legacy activo** | Parcialmente expuesto vía las Órdenes desde MS Access. Sin migración al nuevo stack. |
| **Seminuevos** | **Pendiente** | No existe en este repo. Requiere integración con Portal Seminuevos. |
| **Dashboard / Analítica** | **Parcial** | Dashboard de CFDI implementado (Recharts). No hay dashboard operativo general ni de unidades. |

---

## Roles del sistema

### Roles implementados actualmente en código

| Rol (código) | Acceso | Rutas protegidas |
|-------------|--------|-----------------|
| `admin` | Total — todas las rutas | Registro de usuarios, panel admin, edición de empleados, settings, CFDI, vencimientos |
| `editor` | Operativo — lectura y escritura, sin gestión de usuarios | Anuncios, directorio, settings, CFDI, vencimientos |
| `viewer` | Solo lectura — anuncios, directorio | No puede crear ni modificar |

### Roles de negocio objetivo (ANDANAC / visión SIIA Cloud)

| Rol negocio | Equivalencia código actual | Brecha |
|-------------|---------------------------|--------|
| **Administrador** | `admin` | Coincide en nombre lógico |
| **Contador** | No existe | Necesita acceso a CFDI, vencimientos, reportes contables — sin acceso a unidades o taller |
| **Ventas** | No existe | Necesita acceso a unidades, campañas, clientes — sin acceso a contabilidad |
| **Consulta** | `viewer` | Parcialmente cubierto — solo anuncios y directorio |

> Los roles actuales son genéricos (`admin/editor/viewer`). Para ANDANAC se requieren roles con semántica de negocio y permisos por módulo funcional.

---

## Matriz de permisos por módulo (objetivo)

| Módulo | Administrador | Contador | Ventas | Consulta |
|--------|:---:|:---:|:---:|:---:|
| CFDI emitidos / recibidos | ✅ | ✅ | — | — |
| Dashboard CFDI | ✅ | ✅ | — | — |
| Vencimientos de cartera | ✅ | ✅ | — | — |
| Unidades (inventario) | ✅ | — | ✅ | 👁 |
| Órdenes de servicio | ✅ | — | ✅ | 👁 |
| Campañas | ✅ | — | ✅ | — |
| Facturación | ✅ | ✅ | ✅ | — |
| Directorio empleados | ✅ | — | — | 👁 |
| Gestión de usuarios | ✅ | — | — | — |
| Panel de administración | ✅ | — | — | — |
| Anuncios | ✅ | ✅ | ✅ | 👁 |

> ✅ = Lectura y escritura / 👁 = Solo lectura / — = Sin acceso

---

## Integraciones externas (perspectiva de negocio)

| Integración | Para qué sirve | Estado |
|-------------|---------------|--------|
| **SAT / CFDI** | Obtener los CFDI emitidos y recibidos de la agencia para contabilidad y cumplimiento fiscal | **Activa** (indirecta — los CFDI ya vienen procesados en BD legacy remota) |
| **Nissan APIs (REST)** | Sincronizar inventario de unidades, estatus de pedidos, campañas activas | **Pendiente** — no existe en el repo |
| **FPV (Fleet Purchase Vehicle)** | Procesar eventos de ventas de flotillas para actualizar unidades y comisiones | **Pendiente** — no existe en el repo |
| **AutoVHC (SOAP)** | Recibir reportes de inspección de vehículos de seminuevos | **Pendiente** — no existe en el repo |
| **Symmetrical (FTP)** | Intercambio de archivos de seguros, garantías extendidas u otros servicios financieros | **Pendiente** — no existe en el repo |
| **Portal Seminuevos** | Publicar inventario diario de seminuevos disponibles | **Pendiente** — no existe en el repo |
| **OpenAI GPT-4o-mini** | Clasificación contable automática de los conceptos de CFDI | **Activa** |

---

## Criterios de éxito

### Continuidad operativa
- Las agencias operan sin interrupciones durante la migración progresiva.
- El legacy permanece funcional hasta que cada módulo migrado esté validado en producción.
- Tiempo de respuesta del API < 2 segundos en operaciones de consulta estándar.

### Cumplimiento RFP ANDANAC
- El sistema cubre los 7 ejes del RFP: Arquitectura, Base de Datos, Seguridad, Integraciones, Automatización, Reportes, Continuidad.
- Ver checklist detallado en [MATRIZ-ANDANAC.md](MATRIZ-ANDANAC.md).

### Certificación ANDANAC 2026
- Fecha objetivo: Q4 2026.
- Requisito previo: módulo de Unidades migrado y funcionando (Q2–Q3 2026).
- Requisito previo: integraciones OEM activas (Nissan APIs, FPV).
- Requisito previo: API Gateway formal con JWT, roles de negocio y auditoría.

### Calidad técnica
- Cobertura de tests en módulos críticos (CFDI, Unidades) antes de certificación.
- Pipeline CI/CD activo antes de Q2 2026.
- Sin credenciales en repositorio; secretos gestionados por entorno.
