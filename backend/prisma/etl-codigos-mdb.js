// @ts-check
/**
 * ETL desde CODIGOS.MDB (Access) → PostgreSQL (Prisma)
 * Uso: node prisma/etl-codigos-mdb.js [--schema=nissan_tc] [--only-catalogos]
 *
 * Argumentos:
 *   --schema=<nombre>    schema de agencia destino en la tabla codigos (default: nissan_tc)
 *   --only-catalogos     solo migra catálogos geográficos, no la tabla principal
 *   --only-codigos       solo migra la tabla principal Codigos
 */

const ADODB = require('node-adodb');
const { PrismaClient } = require('../node_modules/.prisma/client');
const path = require('path');

// ─── Configuración ──────────────────────────────────────────────────────────
const MDB_PATH = path.resolve(process.env.CODIGOS_MDB_PATH || 'E:\\ProyectosKia\\Extras\\codigos\\CODIGOS.MDB');
const AGENCY_SCHEMA = parseArg('schema') || 'nissan_tc';
const ONLY_CATALOGOS = process.argv.includes('--only-catalogos');
const ONLY_CODIGOS   = process.argv.includes('--only-codigos');
const BATCH_SIZE = 100;

function parseArg(name) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
}

// Jet 4.0 funciona en este entorno; si se migra a .accdb usar ACE OLEDB 12.0
const conn = ADODB.open(`Provider=Microsoft.Jet.OLEDB.4.0;Data Source=${MDB_PATH};`);
const prisma = new PrismaClient();

async function query(sql) {
  return conn.query(sql);
}

// ─── Catálogos geográficos ───────────────────────────────────────────────────

async function etlTipoCod() {
  const rows = await query('SELECT Tipo, Descrip FROM Tipo_Cod');
  let count = 0;
  for (const r of rows) {
    if (!r.Tipo) continue;
    await prisma.tipoCod.upsert({
      where:  { tipo: String(r.Tipo).trim() },
      update: { descrip: String(r.Descrip || '').trim() },
      create: { tipo: String(r.Tipo).trim(), descrip: String(r.Descrip || '').trim() },
    });
    count++;
  }
  console.log(`  TipoCod: ${count}`);
}

async function etlComCred() {
  const rows = await query('SELECT Clasif, Descrip FROM ComCred');
  let count = 0;
  for (const r of rows) {
    if (!r.Clasif) continue;
    await prisma.comCred.upsert({
      where:  { clasif: String(r.Clasif).trim() },
      update: { descrip: String(r.Descrip || '').trim() },
      create: { clasif: String(r.Clasif).trim(), descrip: String(r.Descrip || '').trim() },
    });
    count++;
  }
  console.log(`  ComCred: ${count}`);
}

async function etlEstados() {
  const rows = await query('SELECT CodEstado, NombreEstado, Abreviacion FROM CatEntidadesFederativas');
  let count = 0;
  for (const r of rows) {
    if (!r.CodEstado) continue;
    await prisma.catEntidadFederativa.upsert({
      where:  { codEstado: String(r.CodEstado).trim() },
      update: { nombreEstado: String(r.NombreEstado || '').trim(), abreviacion: String(r.Abreviacion || '').trim() },
      create: { codEstado: String(r.CodEstado).trim(), nombreEstado: String(r.NombreEstado || '').trim(), abreviacion: String(r.Abreviacion || '').trim() },
    });
    count++;
  }
  console.log(`  CatEntidadesFederativas: ${count}`);
}

async function etlEscolaridades() {
  const rows = await query('SELECT Clave, DESCRIP, Cl_Nissan, Cl_KIA FROM ESCOLARI');
  let count = 0;
  for (const r of rows) {
    if (!r.Clave) continue;
    await prisma.escolaridad.upsert({
      where:  { clave: String(r.Clave).trim() },
      update: { descrip: String(r.DESCRIP || '').trim(), clNissan: r.Cl_Nissan ? String(r.Cl_Nissan).trim() : null, clKia: r.Cl_KIA ? String(r.Cl_KIA).trim() : null },
      create: { clave: String(r.Clave).trim(), descrip: String(r.DESCRIP || '').trim(), clNissan: r.Cl_Nissan ? String(r.Cl_Nissan).trim() : null, clKia: r.Cl_KIA ? String(r.Cl_KIA).trim() : null },
    });
    count++;
  }
  console.log(`  Escolaridades: ${count}`);
}

async function etlCivil() {
  const rows = await query('SELECT CLAVE, DESCRIP, Cl_Nissan, Cl_KIA FROM CIVIL');
  let count = 0;
  for (const r of rows) {
    if (!r.CLAVE) continue;
    await prisma.civil.upsert({
      where:  { clave: String(r.CLAVE).trim() },
      update: { descrip: String(r.DESCRIP || '').trim(), clNissan: r.Cl_Nissan ? String(r.Cl_Nissan).trim() : null, clKia: r.Cl_KIA ? String(r.Cl_KIA).trim() : null },
      create: { clave: String(r.CLAVE).trim(), descrip: String(r.DESCRIP || '').trim(), clNissan: r.Cl_Nissan ? String(r.Cl_Nissan).trim() : null, clKia: r.Cl_KIA ? String(r.Cl_KIA).trim() : null },
    });
    count++;
  }
  console.log(`  Estados civiles: ${count}`);
}

async function etlTitulos() {
  const rows = await query('SELECT CLAVE, DESCRIP, Cl_Nissan, Cl_KIA FROM Titulo');
  let count = 0;
  for (const r of rows) {
    if (!r.CLAVE) continue;
    await prisma.titulo.upsert({
      where:  { clave: String(r.CLAVE).trim() },
      update: { descrip: String(r.DESCRIP || '').trim(), clNissan: r.Cl_Nissan ? String(r.Cl_Nissan).trim() : null, clKia: r.Cl_KIA ? String(r.Cl_KIA).trim() : null },
      create: { clave: String(r.CLAVE).trim(), descrip: String(r.DESCRIP || '').trim(), clNissan: r.Cl_Nissan ? String(r.Cl_Nissan).trim() : null, clKia: r.Cl_KIA ? String(r.Cl_KIA).trim() : null },
    });
    count++;
  }
  console.log(`  Títulos: ${count}`);
}

async function etlRegimenFiscal() {
  const rows = await query('SELECT C_Regimen_Fiscal, Regimen_Fiscal, Fisica, Moral FROM CatRegimenFis');
  let count = 0;
  for (const r of rows) {
    if (!r.C_Regimen_Fiscal) continue;
    await prisma.catRegimenFis.upsert({
      where:  { cRegimenFiscal: String(r.C_Regimen_Fiscal).trim() },
      update: { regimenFiscal: String(r.Regimen_Fiscal || '').trim(), fisica: Boolean(r.Fisica), moral: Boolean(r.Moral) },
      create: { cRegimenFiscal: String(r.C_Regimen_Fiscal).trim(), regimenFiscal: String(r.Regimen_Fiscal || '').trim(), fisica: Boolean(r.Fisica), moral: Boolean(r.Moral) },
    });
    count++;
  }
  console.log(`  CatRegimenFis: ${count}`);
}

async function etlRegimenSoc() {
  const rows = await query('SELECT C_Regimen_Soc, Regimen_Societario, Abreviatura FROM CatRegimenSoc');
  let count = 0;
  for (const r of rows) {
    if (!r.C_Regimen_Soc) continue;
    await prisma.catRegimenSoc.upsert({
      where:  { cRegimenSoc: String(r.C_Regimen_Soc).trim() },
      update: { regimenSocietario: String(r.Regimen_Societario || '').trim(), abreviatura: String(r.Abreviatura || '').trim() },
      create: { cRegimenSoc: String(r.C_Regimen_Soc).trim(), regimenSocietario: String(r.Regimen_Societario || '').trim(), abreviatura: String(r.Abreviatura || '').trim() },
    });
    count++;
  }
  console.log(`  CatRegimenSoc: ${count}`);
}

async function etlColonias() {
  console.log('  CatColonias: leyendo desde Access (puede tardar)...');
  const rows = await query('SELECT CodColonia, CodCiudad, CodEstado, NomColonia, CP FROM CatColonias');
  console.log(`  CatColonias: ${rows.length} registros encontrados`);

  // Inserción por lotes para no saturar la memoria
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      batch
        .filter(r => r.CodColonia)
        .map(r =>
          prisma.catColonia.create({
            data: {
              codColonia: String(r.CodColonia).trim(),
              codCiudad:  String(r.CodCiudad || '').trim(),
              codEstado:  String(r.CodEstado || '').trim(),
              nomColonia: String(r.NomColonia || '').trim(),
              cp:         String(r.CP || '').trim(),
            },
          })
        )
    );
    if ((i + BATCH_SIZE) % 1000 === 0) process.stdout.write(`\r  CatColonias: ${i + BATCH_SIZE}/${rows.length}...`);
  }
  console.log(`\n  CatColonias: ${rows.length} insertadas`);
}

async function etlCodPos() {
  const rows = await query('SELECT C_CodigoPostal, C_Estado FROM CatCodPos');
  let count = 0;
  for (const r of rows) {
    if (!r.C_CodigoPostal) continue;
    await prisma.catCodPos.upsert({
      where:  { cCodigoPostal: String(r.C_CodigoPostal).trim() },
      update: { cEstado: String(r.C_Estado || '').trim() },
      create: { cCodigoPostal: String(r.C_CodigoPostal).trim(), cEstado: String(r.C_Estado || '').trim() },
    });
    count++;
  }
  console.log(`  CatCodPos: ${count}`);
}

async function etlCiudades() {
  const rows = await query('SELECT CodCiudad, CodEstado, NombreCiudad FROM CatCiudades');
  let count = 0;
  for (const r of rows) {
    if (!r.CodCiudad) continue;
    await prisma.catCiudad.upsert({
      where:  { codCiudad: String(r.CodCiudad).trim() },
      update: { codEstado: String(r.CodEstado || '').trim(), nombreCiudad: String(r.NombreCiudad || '').trim() },
      create: { codCiudad: String(r.CodCiudad).trim(), codEstado: String(r.CodEstado || '').trim(), nombreCiudad: String(r.NombreCiudad || '').trim() },
    });
    count++;
  }
  console.log(`  CatCiudades: ${count}`);
}

// ─── Tabla principal Codigos ─────────────────────────────────────────────────

async function etlCodigos() {
  console.log(`\nMigrando tabla Codigos → agencySchema="${AGENCY_SCHEMA}"...`);
  const rows = await query('SELECT * FROM Codigos');
  console.log(`  ${rows.length} registros encontrados`);

  let inserted = 0, skipped = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    for (const r of batch) {
      if (!r.Codigo) { skipped++; continue; }
      const codigo = String(r.Codigo).padStart(5, '0').trim();
      try {
        await prisma.codigo.upsert({
          where:  { agencySchema_codigo: { agencySchema: AGENCY_SCHEMA, codigo } },
          update: mapCodigo(r, AGENCY_SCHEMA, codigo),
          create: { agencySchema: AGENCY_SCHEMA, codigo, ...mapCodigo(r, AGENCY_SCHEMA, codigo) },
        });
        inserted++;
      } catch (e) {
        console.error(`  Error en código ${codigo}: ${e.message}`);
        skipped++;
      }
    }
    if ((i + BATCH_SIZE) % 500 === 0) process.stdout.write(`\r  Codigos: ${inserted}/${rows.length}...`);
  }
  console.log(`\n  Codigos: ${inserted} insertados, ${skipped} omitidos`);
}

function mapCodigo(r, agencySchema, codigo) {
  return {
    agencySchema,
    codigo,
    razSoc:        strOr(r.Raz_Soc),
    paterno:       strOr(r.Paterno),
    materno:       strOr(r.Materno),
    nombre:        strOr(r.Nombre),
    rfc:           r.RFC ? String(r.RFC).trim().replace(/-/g, '').substring(0, 13) || null : null,
    regFis:        strOr(r.REG_FIS),
    regSoc:        strOr(r.REG_SOC),
    direccion:     strOr(r.Direccion),
    noExterior:    strOr(r.Noexterior),
    colonia:       strOr(r.Colonia),
    codPos:        strOr(r.Cod_Pos),
    ciudad:        strOr(r.Ciudad),
    estado:        strOr(r.Estado),
    municipio:     strOr(r.Municipio),
    lada:          strOr(r.Lada),
    telefono:      strOr(r.Telefono),
    movil:         strOr(r.Movil),
    formaPago:     strOr(r.FormaPago),
    ctaPagadora:   strOr(r.Ctapagadora),
    limCred:       r.Lim_Cred != null ? parseFloat(r.Lim_Cred) : null,
    dias:          r.Dias != null ? parseInt(r.Dias) : null,
    tipo:          strOr(r.Tipo) || 'P',
    convenio:      Boolean(r.Convenio),
    acumRef:       r.Acum_Ref != null ? parseFloat(r.Acum_Ref) : null,
    acumSer:       r.Acum_Ser != null ? parseFloat(r.Acum_Ser) : null,
    contado:       Boolean(r.Contado),
    stContacto:    r.St_Contacto != null ? parseInt(r.St_Contacto) : null,
    clasif:        strOr(r.Clasif),
    fechaNac:      r.fechaNac ? new Date(r.fechaNac) : null,
    fechaAlta:     r.Fecha_Alta ? new Date(r.Fecha_Alta) : null,
    email:         strOr(r.Email),
    email2:        strOr(r.Email2),
    noId:          strOr(r.Noid),
    observaciones: strOr(r.Observaciones),
    curp:          strOr(r.CURP),
    sexo:          strOr(r.Sexo),
    escolaridad:   strOr(r.Escolaridad),
    edoCivil:      strOr(r.Edocivil),
    titulo:        strOr(r.Titulo),
    redSoc1:       strOr(r.RedSoc1),
    redSoc2:       strOr(r.RedSoc2),
    redSoc3:       strOr(r.RedSoc3),
    ladaOf:        strOr(r.Lada_Of),
    telOficina:    strOr(r.Tel_Oficina),
    extTelOfi:     strOr(r.Ext_TelOfi),
    pasatiempo1:   strOr(r.Pasatiempo1),
    pasatiempo2:   strOr(r.Pasatiempo2),
    repLegal:      strOr(r.RepLegal),
    dv:            strOr(r.DV),
  };
}

function strOr(val) {
  if (val == null) return null;
  const s = String(val).trim();
  return s.length > 0 ? s : null;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`ETL CODIGOS.MDB → PostgreSQL`);
  console.log(`  Fuente: ${MDB_PATH}`);
  console.log(`  Agencia destino: ${AGENCY_SCHEMA}\n`);

  if (!ONLY_CODIGOS) {
    console.log('Migrando catálogos...');
    await etlTipoCod();
    await etlComCred();
    await etlEstados();
    await etlEscolaridades();
    await etlCivil();
    await etlTitulos();
    await etlRegimenFiscal();
    await etlRegimenSoc();
    await etlCiudades();
    await etlCodPos();
    await etlColonias();
    console.log('\nCatálogos completados.');
  }

  if (!ONLY_CATALOGOS) {
    await etlCodigos();
  }

  console.log('\nETL finalizado.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
