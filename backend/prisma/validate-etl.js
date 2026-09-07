const { PrismaClient } = require('../node_modules/.prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schema = 'nissan_tc';
  const total    = await prisma.codigo.count({ where: { agencySchema: schema } });
  const sinNombre = await prisma.codigo.count({ where: { agencySchema: schema, paterno: null, materno: null, nombre: null, razSoc: null } });
  const conRfc   = await prisma.codigo.count({ where: { agencySchema: schema, rfc: { not: null } } });
  const morales  = await prisma.codigo.count({ where: { agencySchema: schema, razSoc: { not: null } } });
  const fisicas  = await prisma.codigo.count({ where: { agencySchema: schema, paterno: { not: null } } });
  const rfcDups  = await prisma.codigo.groupBy({
    by: ['rfc'],
    where: { agencySchema: schema, rfc: { not: null } },
    having: { rfc: { _count: { gt: 1 } } },
    _count: { rfc: true },
  });

  console.log('=== Validación ETL nissan_tc ===');
  console.log(`Total registros:          ${total}`);
  console.log(`Sin nombre ni razón social: ${sinNombre}`);
  console.log(`Con RFC:                  ${conRfc}`);
  console.log(`Personas morales (razSoc):  ${morales}`);
  console.log(`Personas físicas (paterno): ${fisicas}`);
  console.log(`RFCs duplicados:          ${rfcDups.length}`);
  if (rfcDups.length > 0) rfcDups.slice(0, 5).forEach(d => console.log(`  RFC "${d.rfc}" aparece ${d._count.rfc} veces`));
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
