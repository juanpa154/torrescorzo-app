import { z } from 'zod';

const RFC_GENERICO = 'XAXX010101000';

// Abreviaturas societarias que no pueden estar embebidas en la razón social
const ABREVIATURAS_SOC = /\b(SA\s+DE|S\.?\s*A\.?|C\.?\s*V\.?|SAPI|A\.?\s*C\.?|S\.?\s*C\.?|R\.?\s*L\.?|S\.?\s*A\.?\s*B\.?)\b/i;

// ─── Primitivas reutilizables ────────────────────────────────────────────────

const telefonoSchema = z
  .string()
  .regex(/^\d+$/, 'Teléfono solo puede contener dígitos')
  .min(7, 'Teléfono debe tener al menos 7 dígitos')
  .max(20)
  .nullish();

const ladaSchema = z
  .string()
  .regex(/^\d{3}$/, 'Lada debe tener exactamente 3 dígitos')
  .nullish();

const cpSchema = z
  .string()
  .regex(/^\d{5}$/, 'Código postal debe tener 5 dígitos')
  .nullish();

const emailFieldSchema = z.string().email('Email inválido').max(100).nullish();

const rfcSchema = z
  .string()
  .regex(
    /^([A-ZÑ&]{3}\d{6}[A-Z\d]{3}|[A-ZÑ&]{4}\d{6}[A-Z\d]{3}|XAXX010101000)$/,
    'RFC inválido (12 chars moral / 13 chars física / XAXX010101000 genérico)',
  )
  .nullish();

const curpSchema = z
  .string()
  .length(18, 'CURP debe tener 18 caracteres')
  .regex(/^[A-Z\d]{18}$/, 'CURP contiene caracteres inválidos')
  .nullish();

// ─── Schema principal del cuerpo de Codigo (POST / PUT) ─────────────────────

export const codigoBodySchema = z
  .object({
    // Persona física
    paterno:      z.string().max(100).nullish(),
    materno:      z.string().max(100).nullish(),
    nombre:       z.string().max(100).nullish(),
    curp:         curpSchema,
    sexo:         z.enum(['M', 'F', 'O']).nullish(),
    escolaridad:  z.string().max(5).nullish(),
    edoCivil:     z.string().max(5).nullish(),
    titulo:       z.string().max(5).nullish(),
    pasatiempo1:  z.string().max(100).nullish(),
    pasatiempo2:  z.string().max(100).nullish(),

    // Persona moral
    razSoc:  z.string().max(200).nullish(),
    regSoc:  z.string().max(10).nullish(),
    repLegal: z.string().max(200).nullish(),

    // Campos comunes
    rfc:          rfcSchema,
    regFis:       z.string().max(10).nullish(),
    direccion:    z.string().max(200).nullish(),
    noExterior:   z.string().max(20).nullish(),
    colonia:      z.string().max(100).nullish(),
    codPos:       cpSchema,
    ciudad:       z.string().max(100).nullish(),
    estado:       z.string().max(5).nullish(),
    municipio:    z.string().max(100).nullish(),
    lada:         ladaSchema,
    telefono:     telefonoSchema,
    movil:        z.string().max(20).nullish(),
    ladaOf:       ladaSchema,
    telOficina:   telefonoSchema,
    extTelOfi:    z.string().max(10).nullish(),
    formaPago:    z.string().max(5).nullish(),
    ctaPagadora:  z.string().max(50).nullish(),
    limCred:      z.number().min(0).nullish(),
    dias:         z.number().int().min(0).nullish(),
    tipo:         z.string().max(5).nullish(),
    convenio:     z.boolean().default(false),
    clasif:       z.string().max(5).nullish(),
    fechaNac:     z.string().datetime({ offset: true }).nullish(),
    fechaAlta:    z.string().datetime({ offset: true }).nullish(),
    email:        emailFieldSchema,
    email2:       emailFieldSchema,
    noId:         z.string().max(50).nullish(),
    observaciones: z.string().nullish(),
    redSoc1:      z.string().max(200).nullish(),
    redSoc2:      z.string().max(200).nullish(),
    redSoc3:      z.string().max(200).nullish(),
  })
  .superRefine((data, ctx) => {
    const esMoral = !!data.razSoc;

    // Razón social no puede contener abreviaturas societarias embebidas
    if (data.razSoc && ABREVIATURAS_SOC.test(data.razSoc)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['razSoc'],
        message:
          'La razón social no puede contener abreviaturas societarias (SA DE, S.A, CV, SAPI, A.C, SC, RL, S.A.B)',
      });
    }

    // RFC genérico no válido para personas morales
    if (data.rfc === RFC_GENERICO && esMoral) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rfc'],
        message: 'RFC genérico XAXX010101000 no es válido para personas morales',
      });
    }

    // RFC: longitud exacta según tipo de persona
    if (data.rfc && data.rfc !== RFC_GENERICO) {
      if (esMoral && data.rfc.length !== 12) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rfc'],
          message: 'RFC de persona moral debe tener exactamente 12 caracteres',
        });
      }
      if (!esMoral && data.rfc.length !== 13) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rfc'],
          message: 'RFC de persona física debe tener exactamente 13 caracteres',
        });
      }
    }

    // Régimen societario: solo aplica para personas morales
    if (data.regSoc && !esMoral) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['regSoc'],
        message: 'Régimen societario solo aplica para personas morales',
      });
    }
  });

// ─── Schema para actualizar nombre/razón social (PUT /:codigo/nombre) ────────

export const nombreBodySchema = z
  .object({
    paterno: z.string().max(100).nullish(),
    materno: z.string().max(100).nullish(),
    nombre:  z.string().max(100).nullish(),
    razSoc:  z.string().max(200).nullish(),
  })
  .superRefine((data, ctx) => {
    if (data.razSoc && ABREVIATURAS_SOC.test(data.razSoc)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['razSoc'],
        message: 'La razón social no puede contener abreviaturas societarias',
      });
    }
  });

// ─── Schema para query de búsqueda ──────────────────────────────────────────

export const buscarQuerySchema = z.object({
  q:      z.string().min(1, 'El término de búsqueda es requerido'),
  tipo:   z.enum(['nombre', 'razon', 'rfc']).default('nombre'),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// ─── Exportar constantes útiles para tests y controller ──────────────────────

export { RFC_GENERICO, ABREVIATURAS_SOC };
export type CodigoBody  = z.infer<typeof codigoBodySchema>;
export type NombreBody  = z.infer<typeof nombreBodySchema>;
export type BuscarQuery = z.infer<typeof buscarQuerySchema>;
