-- CreateTable
CREATE TABLE "cfdi_emitidos" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "schema" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3),
    "tipo" TEXT,
    "rfcReceptor" TEXT,
    "rfcEmisor" TEXT,
    "subtotal" DECIMAL(18,2),
    "iva16" DECIMAL(18,2),
    "totalRetenidos" DECIMAL(18,2),
    "total" DECIMAL(18,2),
    "conceptos" TEXT,
    "categoriaIa" TEXT,
    "datos" JSONB NOT NULL,
    "sincronizadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cfdi_emitidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cfdi_recibidos" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "schema" TEXT NOT NULL,
    "fechaEmision" TIMESTAMP(3),
    "tipo" TEXT,
    "rfcEmisor" TEXT,
    "rfcReceptor" TEXT,
    "subtotal" DECIMAL(18,2),
    "iva16" DECIMAL(18,2),
    "totalRetenidos" DECIMAL(18,2),
    "total" DECIMAL(18,2),
    "conceptos" TEXT,
    "categoriaIa" TEXT,
    "datos" JSONB NOT NULL,
    "sincronizadoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cfdi_recibidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_estados" (
    "id" SERIAL NOT NULL,
    "schema" TEXT NOT NULL,
    "tipoCfdi" TEXT NOT NULL,
    "ultimaSync" TIMESTAMP(3),
    "totalSincronizados" INTEGER NOT NULL DEFAULT 0,
    "enProgreso" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sync_estados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cfdi_emitidos_schema_fechaEmision_idx" ON "cfdi_emitidos"("schema", "fechaEmision");

-- CreateIndex
CREATE INDEX "cfdi_emitidos_schema_tipo_idx" ON "cfdi_emitidos"("schema", "tipo");

-- CreateIndex
CREATE INDEX "cfdi_emitidos_schema_categoriaIa_idx" ON "cfdi_emitidos"("schema", "categoriaIa");

-- CreateIndex
CREATE UNIQUE INDEX "cfdi_emitidos_uuid_schema_key" ON "cfdi_emitidos"("uuid", "schema");

-- CreateIndex
CREATE INDEX "cfdi_recibidos_schema_fechaEmision_idx" ON "cfdi_recibidos"("schema", "fechaEmision");

-- CreateIndex
CREATE INDEX "cfdi_recibidos_schema_tipo_idx" ON "cfdi_recibidos"("schema", "tipo");

-- CreateIndex
CREATE INDEX "cfdi_recibidos_schema_categoriaIa_idx" ON "cfdi_recibidos"("schema", "categoriaIa");

-- CreateIndex
CREATE UNIQUE INDEX "cfdi_recibidos_uuid_schema_key" ON "cfdi_recibidos"("uuid", "schema");

-- CreateIndex
CREATE UNIQUE INDEX "sync_estados_schema_tipoCfdi_key" ON "sync_estados"("schema", "tipoCfdi");
