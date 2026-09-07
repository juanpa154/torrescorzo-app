const { prisma } = require('../db/prismaClient');

// ─── Siguiente código disponible ─────────────────────────────────────────────

async function getSiguiente(agencySchema) {
  const counter = await prisma.codigo.findUnique({
    where: { agencySchema_codigo: { agencySchema, codigo: '99999' } },
    select: { codPos: true },
  });

  let next = counter?.codPos ? parseInt(counter.codPos, 10) : 1;
  if (isNaN(next) || next < 1) next = 1;

  // Bucle anti-colisión: avanza hasta encontrar un código libre
  for (let attempts = 0; attempts < 99998; attempts++) {
    const padded = String(next).padStart(5, '0');
    const existing = await prisma.codigo.findUnique({
      where: { agencySchema_codigo: { agencySchema, codigo: padded } },
      select: { id: true },
    });
    if (!existing) return padded;
    next++;
  }
  throw new Error('No hay códigos disponibles (rango agotado)');
}

// ─── Búsqueda LIKE paginada ───────────────────────────────────────────────────

async function buscarCodigos(agencySchema, { q, tipo, limit, offset }) {
  let where = { agencySchema, NOT: { codigo: '99999' } };

  if (tipo === 'rfc') {
    where.rfc = { contains: q.toUpperCase(), mode: 'insensitive' };
  } else if (tipo === 'razon') {
    where.razSoc = { contains: q, mode: 'insensitive' };
  } else {
    // tipo 'nombre': busca en nombre + paterno + materno
    where.OR = [
      { nombre:  { contains: q, mode: 'insensitive' } },
      { paterno: { contains: q, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.codigo.count({ where }),
    prisma.codigo.findMany({
      where,
      select: {
        codigo: true,
        paterno: true,
        materno: true,
        nombre: true,
        razSoc: true,
        rfc: true,
        tipo: true,
        email: true,
        telefono: true,
      },
      orderBy: [{ paterno: 'asc' }, { nombre: 'asc' }],
      take: limit,
      skip: offset,
    }),
  ]);

  return { total, rows };
}

// ─── Ficha completa ───────────────────────────────────────────────────────────

async function getCodigo(agencySchema, codigo) {
  return prisma.codigo.findUnique({
    where: { agencySchema_codigo: { agencySchema, codigo } },
    omit: { imgId: true }, // binario excluido del GET normal
  });
}

// ─── Crear ────────────────────────────────────────────────────────────────────

async function createCodigo(agencySchema, codigo, data) {
  const result = await prisma.$transaction(async (tx) => {
    const created = await tx.codigo.create({
      data: { agencySchema, codigo, ...data },
    });

    // Actualizar contador en registro "99999"
    const nextNum = parseInt(codigo, 10) + 1;
    const nextPadded = String(nextNum).padStart(5, '0');
    await tx.codigo.upsert({
      where:  { agencySchema_codigo: { agencySchema, codigo: '99999' } },
      update: { codPos: nextPadded },
      create: { agencySchema, codigo: '99999', codPos: nextPadded },
    });

    return created;
  });

  return result;
}

// ─── Actualizar (campos no protegidos) ───────────────────────────────────────

async function updateCodigo(agencySchema, codigo, data) {
  // Excluir explícitamente los campos de nombre (requieren MODCODIGO)
  const { paterno, materno, nombre, razSoc, ...rest } = data;
  return prisma.codigo.update({
    where: { agencySchema_codigo: { agencySchema, codigo } },
    data: rest,
  });
}

// ─── Actualizar nombre/razón social (requiere MODCODIGO) ─────────────────────

async function updateNombre(agencySchema, codigo, { paterno, materno, nombre, razSoc }) {
  return prisma.codigo.update({
    where: { agencySchema_codigo: { agencySchema, codigo } },
    data: { paterno, materno, nombre, razSoc },
  });
}

// ─── Catálogos ────────────────────────────────────────────────────────────────

// Catálogo SAT c_FormaPago (no existe en CODIGOS.MDB — se mantiene inline)
const FORMAS_PAGO_SAT = [
  { clave: '01', descrip: 'Efectivo' },
  { clave: '02', descrip: 'Cheque nominativo' },
  { clave: '03', descrip: 'Transferencia electrónica de fondos' },
  { clave: '04', descrip: 'Tarjeta de crédito' },
  { clave: '05', descrip: 'Monedero electrónico' },
  { clave: '06', descrip: 'Dinero electrónico' },
  { clave: '08', descrip: 'Vales de despensa' },
  { clave: '12', descrip: 'Dación en pago' },
  { clave: '13', descrip: 'Pago por subrogación' },
  { clave: '14', descrip: 'Pago por consignación' },
  { clave: '15', descrip: 'Condonación' },
  { clave: '17', descrip: 'Compensación' },
  { clave: '23', descrip: 'Novación' },
  { clave: '24', descrip: 'Confusión' },
  { clave: '25', descrip: 'Remisión de deuda' },
  { clave: '26', descrip: 'Prescripción o caducidad' },
  { clave: '27', descrip: 'A satisfacción del acreedor' },
  { clave: '28', descrip: 'Tarjeta de débito' },
  { clave: '29', descrip: 'Tarjeta de servicios' },
  { clave: '30', descrip: 'Aplicación de anticipos' },
  { clave: '31', descrip: 'Intermediario pagos' },
  { clave: '99', descrip: 'Por definir' },
];

async function getCatalogos() {
  const [tipos, estados, escolaridades, estadosCiviles, titulos, regimenFiscal, regimenSoc, comCred] =
    await Promise.all([
      prisma.tipoCod.findMany({ orderBy: { tipo: 'asc' } }),
      prisma.catEntidadFederativa.findMany({ orderBy: { nombreEstado: 'asc' } }),
      prisma.escolaridad.findMany({ orderBy: { clave: 'asc' } }),
      prisma.civil.findMany({ orderBy: { clave: 'asc' } }),
      prisma.titulo.findMany({ orderBy: { clave: 'asc' } }),
      prisma.catRegimenFis.findMany({ orderBy: { cRegimenFiscal: 'asc' } }),
      prisma.catRegimenSoc.findMany({ orderBy: { cRegimenSoc: 'asc' } }),
      prisma.comCred.findMany({ orderBy: { clasif: 'asc' } }),
    ]);
  return { tipos, formasPago: FORMAS_PAGO_SAT, estados, escolaridades, estadosCiviles, titulos, regimenFiscal, regimenSoc, comCred };
}

async function getColoniasPorCp(cp) {
  return prisma.catColonia.findMany({
    where: { cp },
    select: { nomColonia: true, codCiudad: true, codEstado: true },
    orderBy: { nomColonia: 'asc' },
  });
}

async function getImagen(agencySchema, codigo) {
  const row = await prisma.codigo.findUnique({
    where: { agencySchema_codigo: { agencySchema, codigo } },
    select: { imgId: true },
  });
  return row?.imgId ?? null;
}

async function saveImagen(agencySchema, codigo, buffer) {
  return prisma.codigo.update({
    where: { agencySchema_codigo: { agencySchema, codigo } },
    data: { imgId: buffer },
    select: { codigo: true },
  });
}

module.exports = {
  getSiguiente,
  buscarCodigos,
  getCodigo,
  createCodigo,
  updateCodigo,
  updateNombre,
  getImagen,
  saveImagen,
  getCatalogos,
  getColoniasPorCp,
};
