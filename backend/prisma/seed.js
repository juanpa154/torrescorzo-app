// @ts-check
const { PrismaClient } = require('../node_modules/.prisma/client');

const prisma = new PrismaClient();

async function main() {
  await seedEntidadesFederativas();
  await seedRegimenFiscal();
  await seedRegimenSocietario();
  await seedTipoCod();
  await seedComCred();
  await seedEscolaridades();
  await seedEstadosCiviles();
  await seedTitulos();
  console.log('Seed completado.');
}

async function seedEntidadesFederativas() {
  const estados = [
    { codEstado: 'AGS', nombreEstado: 'AGUASCALIENTES',       abreviacion: 'AGS' },
    { codEstado: 'BCN', nombreEstado: 'BAJA CALIFORNIA',      abreviacion: 'BC'  },
    { codEstado: 'BCS', nombreEstado: 'BAJA CALIFORNIA SUR',  abreviacion: 'BCS' },
    { codEstado: 'CAM', nombreEstado: 'CAMPECHE',             abreviacion: 'CAM' },
    { codEstado: 'CHS', nombreEstado: 'CHIAPAS',              abreviacion: 'CHIS'},
    { codEstado: 'CHI', nombreEstado: 'CHIHUAHUA',            abreviacion: 'CHIH'},
    { codEstado: 'COA', nombreEstado: 'COAHUILA',             abreviacion: 'COAH'},
    { codEstado: 'COL', nombreEstado: 'COLIMA',               abreviacion: 'COL' },
    { codEstado: 'DIF', nombreEstado: 'CIUDAD DE MEXICO',     abreviacion: 'CDMX'},
    { codEstado: 'DGO', nombreEstado: 'DURANGO',              abreviacion: 'DGO' },
    { codEstado: 'GTO', nombreEstado: 'GUANAJUATO',           abreviacion: 'GTO' },
    { codEstado: 'GRO', nombreEstado: 'GUERRERO',             abreviacion: 'GRO' },
    { codEstado: 'HGO', nombreEstado: 'HIDALGO',              abreviacion: 'HGO' },
    { codEstado: 'JAL', nombreEstado: 'JALISCO',              abreviacion: 'JAL' },
    { codEstado: 'MEX', nombreEstado: 'ESTADO DE MEXICO',     abreviacion: 'MEX' },
    { codEstado: 'MCH', nombreEstado: 'MICHOACAN',            abreviacion: 'MICH'},
    { codEstado: 'MOR', nombreEstado: 'MORELOS',              abreviacion: 'MOR' },
    { codEstado: 'NAY', nombreEstado: 'NAYARIT',              abreviacion: 'NAY' },
    { codEstado: 'NLE', nombreEstado: 'NUEVO LEON',           abreviacion: 'NL'  },
    { codEstado: 'OAX', nombreEstado: 'OAXACA',               abreviacion: 'OAX' },
    { codEstado: 'PUE', nombreEstado: 'PUEBLA',               abreviacion: 'PUE' },
    { codEstado: 'QRO', nombreEstado: 'QUERETARO',            abreviacion: 'QRO' },
    { codEstado: 'ROO', nombreEstado: 'QUINTANA ROO',         abreviacion: 'QROO'},
    { codEstado: 'SLP', nombreEstado: 'SAN LUIS POTOSI',      abreviacion: 'SLP' },
    { codEstado: 'SIN', nombreEstado: 'SINALOA',              abreviacion: 'SIN' },
    { codEstado: 'SON', nombreEstado: 'SONORA',               abreviacion: 'SON' },
    { codEstado: 'TAB', nombreEstado: 'TABASCO',              abreviacion: 'TAB' },
    { codEstado: 'TAM', nombreEstado: 'TAMAULIPAS',           abreviacion: 'TAMS'},
    { codEstado: 'TLX', nombreEstado: 'TLAXCALA',             abreviacion: 'TLAX'},
    { codEstado: 'VER', nombreEstado: 'VERACRUZ',             abreviacion: 'VER' },
    { codEstado: 'YUC', nombreEstado: 'YUCATAN',              abreviacion: 'YUC' },
    { codEstado: 'ZAC', nombreEstado: 'ZACATECAS',            abreviacion: 'ZAC' },
  ];

  for (const e of estados) {
    await prisma.catEntidadFederativa.upsert({
      where:  { codEstado: e.codEstado },
      update: { nombreEstado: e.nombreEstado, abreviacion: e.abreviacion },
      create: e,
    });
  }
  console.log(`  Entidades federativas: ${estados.length}`);
}

async function seedRegimenFiscal() {
  // Catálogo SAT c_RegimenFiscal (vigente 2024)
  const regimenes = [
    { cRegimenFiscal: '601', regimenFiscal: 'General de Ley Personas Morales',                                             fisica: false, moral: true  },
    { cRegimenFiscal: '603', regimenFiscal: 'Personas Morales con Fines no Lucrativos',                                    fisica: false, moral: true  },
    { cRegimenFiscal: '605', regimenFiscal: 'Sueldos y Salarios e Ingresos Asimilados a Salarios',                         fisica: true,  moral: false },
    { cRegimenFiscal: '606', regimenFiscal: 'Arrendamiento',                                                               fisica: true,  moral: false },
    { cRegimenFiscal: '607', regimenFiscal: 'Régimen de Enajenación o Adquisición de Bienes',                              fisica: true,  moral: false },
    { cRegimenFiscal: '608', regimenFiscal: 'Demás ingresos',                                                              fisica: true,  moral: false },
    { cRegimenFiscal: '610', regimenFiscal: 'Residentes en el Extranjero sin Establecimiento Permanente en México',        fisica: true,  moral: true  },
    { cRegimenFiscal: '611', regimenFiscal: 'Ingresos por Dividendos (socios y accionistas)',                               fisica: true,  moral: false },
    { cRegimenFiscal: '612', regimenFiscal: 'Personas Físicas con Actividades Empresariales y Profesionales',              fisica: true,  moral: false },
    { cRegimenFiscal: '614', regimenFiscal: 'Ingresos por intereses',                                                      fisica: true,  moral: false },
    { cRegimenFiscal: '615', regimenFiscal: 'Régimen de los ingresos por obtención de premios',                            fisica: true,  moral: false },
    { cRegimenFiscal: '616', regimenFiscal: 'Sin obligaciones fiscales',                                                   fisica: true,  moral: false },
    { cRegimenFiscal: '620', regimenFiscal: 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos',   fisica: false, moral: true  },
    { cRegimenFiscal: '621', regimenFiscal: 'Incorporación Fiscal',                                                        fisica: true,  moral: false },
    { cRegimenFiscal: '622', regimenFiscal: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',                   fisica: true,  moral: true  },
    { cRegimenFiscal: '623', regimenFiscal: 'Opcional para Grupos de Sociedades',                                          fisica: false, moral: true  },
    { cRegimenFiscal: '624', regimenFiscal: 'Coordinados',                                                                 fisica: false, moral: true  },
    { cRegimenFiscal: '625', regimenFiscal: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas', fisica: true, moral: false },
    { cRegimenFiscal: '626', regimenFiscal: 'Régimen Simplificado de Confianza',                                           fisica: true,  moral: true  },
  ];

  for (const r of regimenes) {
    await prisma.catRegimenFis.upsert({
      where:  { cRegimenFiscal: r.cRegimenFiscal },
      update: { regimenFiscal: r.regimenFiscal, fisica: r.fisica, moral: r.moral },
      create: r,
    });
  }
  console.log(`  Regímenes fiscales SAT: ${regimenes.length}`);
}

async function seedRegimenSocietario() {
  const regimenes = [
    { cRegimenSoc: 'SA',   regimenSocietario: 'Sociedad Anónima',                              abreviatura: 'S.A.'     },
    { cRegimenSoc: 'SADEC', regimenSocietario: 'Sociedad Anónima de Capital Variable',         abreviatura: 'S.A. DE C.V.' },
    { cRegimenSoc: 'SAPI', regimenSocietario: 'Sociedad Anónima Promotora de Inversión',       abreviatura: 'S.A.P.I.' },
    { cRegimenSoc: 'SAPID', regimenSocietario: 'Sociedad Anónima Promotora de Inversión de Capital Variable', abreviatura: 'S.A.P.I. DE C.V.' },
    { cRegimenSoc: 'SRL',  regimenSocietario: 'Sociedad de Responsabilidad Limitada',          abreviatura: 'S. DE R.L.' },
    { cRegimenSoc: 'SRLCV', regimenSocietario: 'Sociedad de Responsabilidad Limitada de Capital Variable', abreviatura: 'S. DE R.L. DE C.V.' },
    { cRegimenSoc: 'SC',   regimenSocietario: 'Sociedad Civil',                                abreviatura: 'S.C.'     },
    { cRegimenSoc: 'AC',   regimenSocietario: 'Asociación Civil',                              abreviatura: 'A.C.'     },
    { cRegimenSoc: 'IAP',  regimenSocietario: 'Institución de Asistencia Privada',             abreviatura: 'I.A.P.'   },
    { cRegimenSoc: 'SNC',  regimenSocietario: 'Sociedad en Nombre Colectivo',                  abreviatura: 'S.N.C.'   },
    { cRegimenSoc: 'SCO',  regimenSocietario: 'Sociedad Cooperativa',                          abreviatura: 'S. CO.'   },
    { cRegimenSoc: 'FID',  regimenSocietario: 'Fideicomiso',                                   abreviatura: 'FID.'     },
    { cRegimenSoc: 'SPR',  regimenSocietario: 'Sociedad de Producción Rural',                  abreviatura: 'S.P.R.'   },
    { cRegimenSoc: 'EMP',  regimenSocietario: 'Empresa Individual',                            abreviatura: 'EMP.'     },
  ];

  for (const r of regimenes) {
    await prisma.catRegimenSoc.upsert({
      where:  { cRegimenSoc: r.cRegimenSoc },
      update: { regimenSocietario: r.regimenSocietario, abreviatura: r.abreviatura },
      create: r,
    });
  }
  console.log(`  Regímenes societarios: ${regimenes.length}`);
}

async function seedTipoCod() {
  // Tipos de código de cliente/proveedor típicos del DMS
  const tipos = [
    { tipo: 'P',  descrip: 'PUBLICO EN GENERAL' },
    { tipo: 'CS', descrip: 'CLIENTE CON CONVENIO' },
    { tipo: 'CL', descrip: 'CLIENTE' },
    { tipo: 'PR', descrip: 'PROVEEDOR' },
    { tipo: 'GF', descrip: 'GOBIERNO FEDERAL' },
    { tipo: 'GE', descrip: 'GOBIERNO ESTATAL' },
    { tipo: 'GM', descrip: 'GOBIERNO MUNICIPAL' },
    { tipo: 'EX', descrip: 'EXTRANJERO' },
  ];

  for (const t of tipos) {
    await prisma.tipoCod.upsert({
      where:  { tipo: t.tipo },
      update: { descrip: t.descrip },
      create: t,
    });
  }
  console.log(`  Tipos de código: ${tipos.length}`);
}

async function seedComCred() {
  const clasificaciones = [
    { clasif: 'A', descrip: 'EXCELENTE' },
    { clasif: 'B', descrip: 'BUENO' },
    { clasif: 'C', descrip: 'REGULAR' },
    { clasif: 'D', descrip: 'MALO' },
    { clasif: 'E', descrip: 'SIN CLASIFICAR' },
  ];

  for (const c of clasificaciones) {
    await prisma.comCred.upsert({
      where:  { clasif: c.clasif },
      update: { descrip: c.descrip },
      create: c,
    });
  }
  console.log(`  Clasificaciones de crédito: ${clasificaciones.length}`);
}

async function seedEscolaridades() {
  const escolaridades = [
    { clave: 'SIN',  descrip: 'SIN ESCOLARIDAD',         clNissan: null, clKia: null },
    { clave: 'PRI',  descrip: 'PRIMARIA',                clNissan: null, clKia: null },
    { clave: 'SEC',  descrip: 'SECUNDARIA',              clNissan: null, clKia: null },
    { clave: 'PRE',  descrip: 'PREPARATORIA/BACHILLER',  clNissan: null, clKia: null },
    { clave: 'TEC',  descrip: 'TECNICO/VOCACIONAL',      clNissan: null, clKia: null },
    { clave: 'LIC',  descrip: 'LICENCIATURA',            clNissan: null, clKia: null },
    { clave: 'POS',  descrip: 'POSGRADO',                clNissan: null, clKia: null },
    { clave: 'DOC',  descrip: 'DOCTORADO',               clNissan: null, clKia: null },
  ];

  for (const e of escolaridades) {
    await prisma.escolaridad.upsert({
      where:  { clave: e.clave },
      update: { descrip: e.descrip },
      create: e,
    });
  }
  console.log(`  Escolaridades: ${escolaridades.length}`);
}

async function seedEstadosCiviles() {
  const estados = [
    { clave: 'SOL', descrip: 'SOLTERO(A)',   clNissan: null, clKia: null },
    { clave: 'CAS', descrip: 'CASADO(A)',    clNissan: null, clKia: null },
    { clave: 'DIV', descrip: 'DIVORCIADO(A)', clNissan: null, clKia: null },
    { clave: 'VIU', descrip: 'VIUDO(A)',     clNissan: null, clKia: null },
    { clave: 'UNI', descrip: 'UNION LIBRE',  clNissan: null, clKia: null },
    { clave: 'SEP', descrip: 'SEPARADO(A)',  clNissan: null, clKia: null },
  ];

  for (const e of estados) {
    await prisma.civil.upsert({
      where:  { clave: e.clave },
      update: { descrip: e.descrip },
      create: e,
    });
  }
  console.log(`  Estados civiles: ${estados.length}`);
}

async function seedTitulos() {
  const titulos = [
    { clave: 'SR',  descrip: 'SEÑOR',     clNissan: null, clKia: null },
    { clave: 'SRA', descrip: 'SEÑORA',    clNissan: null, clKia: null },
    { clave: 'SRT', descrip: 'SEÑORITA',  clNissan: null, clKia: null },
    { clave: 'LIC', descrip: 'LICENCIADO(A)', clNissan: null, clKia: null },
    { clave: 'ING', descrip: 'INGENIERO(A)',  clNissan: null, clKia: null },
    { clave: 'DR',  descrip: 'DOCTOR(A)', clNissan: null, clKia: null },
    { clave: 'ARQ', descrip: 'ARQUITECTO(A)', clNissan: null, clKia: null },
    { clave: 'CP',  descrip: 'CONTADOR(A) PUBLICO(A)', clNissan: null, clKia: null },
  ];

  for (const t of titulos) {
    await prisma.titulo.upsert({
      where:  { clave: t.clave },
      update: { descrip: t.descrip },
      create: t,
    });
  }
  console.log(`  Títulos: ${titulos.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
