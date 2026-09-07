-- CreateTable
CREATE TABLE "codigos" (
    "id" SERIAL NOT NULL,
    "agencySchema" VARCHAR(50) NOT NULL,
    "codigo" VARCHAR(5) NOT NULL,
    "razSoc" VARCHAR(200),
    "paterno" VARCHAR(100),
    "materno" VARCHAR(100),
    "nombre" VARCHAR(100),
    "rfc" VARCHAR(13),
    "regFis" VARCHAR(10),
    "regSoc" VARCHAR(10),
    "direccion" VARCHAR(200),
    "noExterior" VARCHAR(20),
    "colonia" VARCHAR(100),
    "codPos" VARCHAR(5),
    "ciudad" VARCHAR(100),
    "estado" VARCHAR(5),
    "municipio" VARCHAR(100),
    "lada" VARCHAR(5),
    "telefono" VARCHAR(20),
    "movil" VARCHAR(20),
    "formaPago" VARCHAR(5),
    "ctaPagadora" VARCHAR(50),
    "limCred" DECIMAL(18,2),
    "dias" INTEGER,
    "tipo" VARCHAR(5) DEFAULT 'P',
    "convenio" BOOLEAN NOT NULL DEFAULT false,
    "acumRef" DECIMAL(18,2),
    "acumSer" DECIMAL(18,2),
    "contado" BOOLEAN NOT NULL DEFAULT false,
    "stContacto" INTEGER,
    "clasif" VARCHAR(5),
    "fechaNac" TIMESTAMP(3),
    "fechaAlta" TIMESTAMP(3),
    "email" VARCHAR(100),
    "email2" VARCHAR(100),
    "noId" VARCHAR(50),
    "observaciones" TEXT,
    "curp" VARCHAR(18),
    "sexo" VARCHAR(1),
    "escolaridad" VARCHAR(5),
    "edoCivil" VARCHAR(5),
    "titulo" VARCHAR(5),
    "redSoc1" VARCHAR(200),
    "redSoc2" VARCHAR(200),
    "redSoc3" VARCHAR(200),
    "ladaOf" VARCHAR(5),
    "telOficina" VARCHAR(20),
    "extTelOfi" VARCHAR(10),
    "pasatiempo1" VARCHAR(100),
    "pasatiempo2" VARCHAR(100),
    "repLegal" VARCHAR(200),
    "dv" VARCHAR(20),
    "imgId" BYTEA,

    CONSTRAINT "codigos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_cod" (
    "tipo" VARCHAR(5) NOT NULL,
    "descrip" VARCHAR(100) NOT NULL,

    CONSTRAINT "tipo_cod_pkey" PRIMARY KEY ("tipo")
);

-- CreateTable
CREATE TABLE "com_cred" (
    "clasif" VARCHAR(5) NOT NULL,
    "descrip" VARCHAR(100) NOT NULL,

    CONSTRAINT "com_cred_pkey" PRIMARY KEY ("clasif")
);

-- CreateTable
CREATE TABLE "cat_entidades_federativas" (
    "codEstado" VARCHAR(3) NOT NULL,
    "nombreEstado" VARCHAR(100) NOT NULL,
    "abreviacion" VARCHAR(10) NOT NULL,

    CONSTRAINT "cat_entidades_federativas_pkey" PRIMARY KEY ("codEstado")
);

-- CreateTable
CREATE TABLE "escolaridades" (
    "clave" VARCHAR(5) NOT NULL,
    "descrip" VARCHAR(100) NOT NULL,
    "clNissan" VARCHAR(10),
    "clKia" VARCHAR(10),

    CONSTRAINT "escolaridades_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "estados_civiles" (
    "clave" VARCHAR(5) NOT NULL,
    "descrip" VARCHAR(100) NOT NULL,
    "clNissan" VARCHAR(10),
    "clKia" VARCHAR(10),

    CONSTRAINT "estados_civiles_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "titulos" (
    "clave" VARCHAR(5) NOT NULL,
    "descrip" VARCHAR(100) NOT NULL,
    "clNissan" VARCHAR(10),
    "clKia" VARCHAR(10),

    CONSTRAINT "titulos_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "cat_regimen_fiscal" (
    "cRegimenFiscal" VARCHAR(10) NOT NULL,
    "regimenFiscal" VARCHAR(200) NOT NULL,
    "fisica" BOOLEAN NOT NULL DEFAULT false,
    "moral" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cat_regimen_fiscal_pkey" PRIMARY KEY ("cRegimenFiscal")
);

-- CreateTable
CREATE TABLE "cat_regimen_societario" (
    "cRegimenSoc" VARCHAR(10) NOT NULL,
    "regimenSocietario" VARCHAR(200) NOT NULL,
    "abreviatura" VARCHAR(50) NOT NULL,

    CONSTRAINT "cat_regimen_societario_pkey" PRIMARY KEY ("cRegimenSoc")
);

-- CreateTable
CREATE TABLE "cat_colonias" (
    "id" SERIAL NOT NULL,
    "codColonia" VARCHAR(10) NOT NULL,
    "codCiudad" VARCHAR(10) NOT NULL,
    "codEstado" VARCHAR(3) NOT NULL,
    "nomColonia" VARCHAR(200) NOT NULL,
    "cp" VARCHAR(5) NOT NULL,

    CONSTRAINT "cat_colonias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat_cod_pos" (
    "cCodigoPostal" VARCHAR(5) NOT NULL,
    "cEstado" VARCHAR(3) NOT NULL,

    CONSTRAINT "cat_cod_pos_pkey" PRIMARY KEY ("cCodigoPostal")
);

-- CreateTable
CREATE TABLE "cat_ciudades" (
    "codCiudad" VARCHAR(10) NOT NULL,
    "codEstado" VARCHAR(3) NOT NULL,
    "nombreCiudad" VARCHAR(100) NOT NULL,

    CONSTRAINT "cat_ciudades_pkey" PRIMARY KEY ("codCiudad")
);

-- CreateIndex
CREATE INDEX "codigos_agencySchema_rfc_idx" ON "codigos"("agencySchema", "rfc");

-- CreateIndex
CREATE INDEX "codigos_agencySchema_nombre_idx" ON "codigos"("agencySchema", "nombre");

-- CreateIndex
CREATE INDEX "codigos_agencySchema_razSoc_idx" ON "codigos"("agencySchema", "razSoc");

-- CreateIndex
CREATE UNIQUE INDEX "codigos_agencySchema_codigo_key" ON "codigos"("agencySchema", "codigo");

-- CreateIndex
CREATE INDEX "cat_colonias_cp_idx" ON "cat_colonias"("cp");

-- CreateIndex
CREATE INDEX "cat_colonias_codEstado_codCiudad_idx" ON "cat_colonias"("codEstado", "codCiudad");
