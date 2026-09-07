# Cliente: Grupo Torres Corzo

## Perfil del negocio

**Razón social:** Grupo Torres Corzo (por confirmar nombre legal exacto)  
**Giro:** Distribución y postventa de vehículos — agencias automotrices Nissan (y Kia, según evidencia en el código)  
**Producto interno:** SIIA Cloud — DMS (Dealer Management System) propietario en evolución  
**Idioma del producto:** Español (México)  
**País / Región:** México

### Agencias conocidas (detectadas en el código)

| Identificador en sistema | Nombre operativo | Estado en sistema |
|--------------------------|-----------------|-------------------|
| `kia_zacatecas` | Agencia Kia Zacatecas | Activa — datos CFDI en BD remota |
| `kia_celaya` | Agencia Kia Celaya | Activa — datos CFDI en BD remota |
| `kia_lomas` | Agencia Kia Lomas | Activa — datos CFDI en BD remota |

> **[POR CONFIRMAR]** Los identificadores en código dicen "kia_*" pero el contexto del proyecto refiere agencias Nissan. Confirmar si son agencias Nissan con ese naming legacy, agencias duales Nissan/Kia, o si la nomenclatura ya se actualizó.

---

## Stakeholders y gobernanza

| Rol | Responsabilidad frente al proyecto |
|-----|------------------------------------|
| **Dirección de Sistemas** | Estrategia tecnológica, aprobación de arquitectura, decisiones de inversión |
| **Equipo Desarrollo SIIA** | Implementación, mantenimiento del stack, migraciones |
| **Operación de Agencia** | Validación funcional, usuarios finales del DMS |
| **Nissan / ANDANAC** | Certificación del DMS — define los requisitos del RFP que el sistema debe cumplir |

> **[PENDIENTE DE DEFINIR]** Nombres y contactos de personas específicas en cada rol.

---

## Contexto del negocio

Un DMS (Dealer Management System) en una agencia automotriz gestiona el ciclo completo del negocio:

- **Ventas de unidades nuevas y seminuevos** — cotizaciones, apartados, crédito, entrega
- **Postventa / Taller** — órdenes de servicio, refacciones, garantías
- **Administración y contabilidad** — CFDI, cuentas por cobrar/pagar, nómina
- **CRM / Campañas** — seguimiento de clientes, campañas de fábrica (OEM)
- **Inventario** — unidades en piso, tránsito, consignación

El DMS de agencias Nissan debe cumplir con los requerimientos del **RFP ANDANAC** (Asociación de Distribuidores Automotrices Nacionales), que define estándares mínimos de funcionalidad, seguridad, integración y continuidad operativa.

---

## Glosario de negocio

| Término | Definición en contexto Torres Corzo |
|---------|--------------------------------------|
| **DMS** | Dealer Management System — sistema central de gestión de la agencia automotriz. Integra ventas, taller, administración e inventario. |
| **ANDANAC** | Asociación de Distribuidores Automotrices Nacionales. Define el RFP (pliego de requerimientos) que los DMS deben cumplir para operar en agencias Nissan certificadas. |
| **RFP ANDANAC** | Documento de requerimientos funcionales, técnicos y de integración que un DMS debe satisfacer para obtener certificación. |
| **OEM** | Original Equipment Manufacturer — en este contexto, Nissan. Las integraciones "OEM" son las conexiones directas con los sistemas de Nissan (campañas, FPV, inventario de fábrica). |
| **Agencia** | Unidad de negocio individual (distribuidor). Cada agencia opera de forma semi-independiente pero comparte la plataforma SIIA Cloud. En el sistema, cada agencia tiene su propio schema en PostgreSQL. |
| **CFDI** | Comprobante Fiscal Digital por Internet — factura electrónica mexicana. El SAT (Servicio de Administración Tributaria) es la autoridad. Los CFDI emitidos y recibidos son la base de la contabilidad. |
| **CFDI emitido** | Factura que la agencia expide a sus clientes (ventas de unidades, servicios de taller, refacciones). En BD: tabla `ing_eg_emi`. |
| **CFDI recibido** | Factura que la agencia recibe de sus proveedores. En BD: tabla `ing_eg_rec`. |
| **FPV** | Fleet Purchase Vehicle — programa de ventas de flotillas de Nissan. Genera eventos que el DMS debe procesar para actualizar estatus de unidades y pedidos. |
| **AutoVHC** | Plataforma de inspección de vehículos usados (Vehicle Health Check). Se integra vía SOAP para recibir reportes de estado de unidades. |
| **Symmetrical** | Proveedor de servicios de datos. Se integra vía FTP para intercambio de archivos (seguros, garantías extendidas u otros). |
| **Portal Seminuevos** | Portal de publicación de vehículos de segunda mano. La agencia envía un archivo diario con el inventario de seminuevos disponibles. |
| **Postventa** | Área de taller y refacciones. Incluye órdenes de servicio, diagnóstico, garantías y venta de partes. |
| **Seminuevos** | Vehículos usados en venta por la agencia. Pueden ser autos recibidos en parte de pago o adquiridos para comercialización. |
| **Campaña** | Programa comercial de Nissan (OEM) dirigido a propietarios de vehículos — recambios, servicios especiales, lanzamientos. El DMS debe distribuir y dar seguimiento a estas campañas. |
| **Socio de Negocios** | Entidad externa (cliente, proveedor, aseguradora, financiera) con la que la agencia tiene relación comercial. Equivalente al concepto de "Business Partner" en SAP. |
| **Vencimientos** | Documentos de cartera por cobrar con fecha límite de pago. En el sistema: tabla `ventas_gatlcelren` en BD `central_agencias`. |
| **Tenant** | En arquitectura multi-tenant: cada agencia es un tenant. En SIIA Cloud se implementa como schema separado en PostgreSQL. |
| **Schema** | En PostgreSQL: espacio de nombres dentro de una base de datos. Cada agencia tiene su propio schema (ej: `kia_zacatecas`) con sus tablas, aislado de otras agencias. |
| **ETL** | Extract, Transform, Load — proceso que extrae datos del sistema fuente (BD CFDI legacy), los transforma y los carga en la BD local de SIIA Cloud. |
| **Categoría IA** | Clasificación contable asignada automáticamente por GPT-4o-mini al concepto de un CFDI. Ejemplo: "Combustible", "Refacciones y mantenimiento". |
