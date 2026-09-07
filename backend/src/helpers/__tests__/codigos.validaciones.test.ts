import { describe, it, expect } from 'vitest';
import {
  codigoBodySchema,
  nombreBodySchema,
  buscarQuerySchema,
  RFC_GENERICO,
} from '../../schemas/codigos.schema';

// ─── RFC ────────────────────────────────────────────────────────────────────

describe('RFC — persona física (13 chars)', () => {
  const base = { paterno: 'GARCIA', nombre: 'JUAN' };

  it('acepta RFC válido de persona física', () => {
    expect(codigoBodySchema.safeParse({ ...base, rfc: 'GAJJ800101HG5' }).success).toBe(true);
  });

  it('acepta RFC genérico XAXX010101000 para persona física', () => {
    expect(codigoBodySchema.safeParse({ ...base, rfc: RFC_GENERICO }).success).toBe(true);
  });

  it('rechaza RFC de 12 chars para persona física', () => {
    const r = codigoBodySchema.safeParse({ ...base, rfc: 'GAJ800101HG5' });
    expect(r.success).toBe(false);
  });

  it('rechaza RFC con caracteres inválidos', () => {
    const r = codigoBodySchema.safeParse({ ...base, rfc: 'GAJJ800101HG!' });
    expect(r.success).toBe(false);
  });

  it('acepta rfc null/undefined', () => {
    expect(codigoBodySchema.safeParse({ ...base, rfc: null }).success).toBe(true);
    expect(codigoBodySchema.safeParse({ ...base }).success).toBe(true);
  });
});

describe('RFC — persona moral (12 chars)', () => {
  const base = { razSoc: 'EMPRESA EJEMPLO' };

  it('acepta RFC válido de persona moral', () => {
    expect(codigoBodySchema.safeParse({ ...base, rfc: 'EEJ800101HG5' }).success).toBe(true);
  });

  it('rechaza RFC de 13 chars para persona moral', () => {
    const r = codigoBodySchema.safeParse({ ...base, rfc: 'GAJJ800101HG5' });
    expect(r.success).toBe(false);
  });

  it('rechaza RFC genérico para persona moral', () => {
    const r = codigoBodySchema.safeParse({ ...base, rfc: RFC_GENERICO });
    expect(r.success).toBe(false);
    const errs = r.success ? [] : r.error.flatten().fieldErrors;
    expect(errs.rfc?.[0]).toMatch(/genérico/i);
  });
});

// ─── CURP ────────────────────────────────────────────────────────────────────

describe('CURP', () => {
  const base = { paterno: 'GARCIA', nombre: 'JUAN' };

  it('acepta CURP válido de 18 chars', () => {
    expect(codigoBodySchema.safeParse({ ...base, curp: 'GAJJ800101HJCRRN01' }).success).toBe(true);
  });

  it('rechaza CURP de menos de 18 chars', () => {
    const r = codigoBodySchema.safeParse({ ...base, curp: 'GAJJ800101HJCRRN0' });
    expect(r.success).toBe(false);
  });

  it('rechaza CURP con caracteres inválidos', () => {
    const r = codigoBodySchema.safeParse({ ...base, curp: 'GAJJ800101HJCRRN!1' });
    expect(r.success).toBe(false);
  });

  it('acepta curp null', () => {
    expect(codigoBodySchema.safeParse({ ...base, curp: null }).success).toBe(true);
  });
});

// ─── Teléfono ────────────────────────────────────────────────────────────────

describe('Teléfono', () => {
  const base = { paterno: 'GARCIA' };

  it('acepta teléfono de exactamente 7 dígitos', () => {
    expect(codigoBodySchema.safeParse({ ...base, telefono: '1234567' }).success).toBe(true);
  });

  it('acepta teléfono de 10 dígitos', () => {
    expect(codigoBodySchema.safeParse({ ...base, telefono: '6141234567' }).success).toBe(true);
  });

  it('rechaza teléfono de menos de 7 dígitos', () => {
    const r = codigoBodySchema.safeParse({ ...base, telefono: '123456' });
    expect(r.success).toBe(false);
  });

  it('rechaza teléfono con letras', () => {
    const r = codigoBodySchema.safeParse({ ...base, telefono: '614ABCD' });
    expect(r.success).toBe(false);
  });

  it('acepta telefono null', () => {
    expect(codigoBodySchema.safeParse({ ...base, telefono: null }).success).toBe(true);
  });
});

// ─── Lada ────────────────────────────────────────────────────────────────────

describe('Lada', () => {
  const base = { paterno: 'GARCIA' };

  it('acepta lada de exactamente 3 dígitos', () => {
    expect(codigoBodySchema.safeParse({ ...base, lada: '614' }).success).toBe(true);
  });

  it('rechaza lada de 2 dígitos', () => {
    const r = codigoBodySchema.safeParse({ ...base, lada: '61' });
    expect(r.success).toBe(false);
  });

  it('rechaza lada de 4 dígitos', () => {
    const r = codigoBodySchema.safeParse({ ...base, lada: '6141' });
    expect(r.success).toBe(false);
  });

  it('rechaza lada con letras', () => {
    const r = codigoBodySchema.safeParse({ ...base, lada: '6AB' });
    expect(r.success).toBe(false);
  });
});

// ─── Email ────────────────────────────────────────────────────────────────────

describe('Email', () => {
  const base = { paterno: 'GARCIA' };

  it('acepta email válido', () => {
    expect(codigoBodySchema.safeParse({ ...base, email: 'juan@empresa.com' }).success).toBe(true);
  });

  it('rechaza email sin @', () => {
    const r = codigoBodySchema.safeParse({ ...base, email: 'juanempresa.com' });
    expect(r.success).toBe(false);
  });

  it('rechaza email sin dominio', () => {
    const r = codigoBodySchema.safeParse({ ...base, email: 'juan@' });
    expect(r.success).toBe(false);
  });

  it('acepta email null', () => {
    expect(codigoBodySchema.safeParse({ ...base, email: null }).success).toBe(true);
  });
});

// ─── CP ──────────────────────────────────────────────────────────────────────

describe('Código Postal', () => {
  const base = { paterno: 'GARCIA' };

  it('acepta CP de 5 dígitos', () => {
    expect(codigoBodySchema.safeParse({ ...base, codPos: '33000' }).success).toBe(true);
  });

  it('rechaza CP de 4 dígitos', () => {
    const r = codigoBodySchema.safeParse({ ...base, codPos: '3300' });
    expect(r.success).toBe(false);
  });

  it('rechaza CP con letras', () => {
    const r = codigoBodySchema.safeParse({ ...base, codPos: '330AB' });
    expect(r.success).toBe(false);
  });
});

// ─── Razón social — abreviaturas societarias ─────────────────────────────────

describe('Razón social — abreviaturas societarias', () => {
  it('rechaza razón social con "S.A"', () => {
    const r = codigoBodySchema.safeParse({ razSoc: 'EMPRESA S.A DE C.V' });
    expect(r.success).toBe(false);
  });

  it('rechaza razón social con "SA DE"', () => {
    const r = codigoBodySchema.safeParse({ razSoc: 'CORPORATIVO SA DE CV' });
    expect(r.success).toBe(false);
  });

  it('rechaza razón social con "A.C"', () => {
    const r = codigoBodySchema.safeParse({ razSoc: 'ASOCIACION A.C' });
    expect(r.success).toBe(false);
  });

  it('acepta razón social sin abreviaturas', () => {
    expect(codigoBodySchema.safeParse({ razSoc: 'GRUPO TORRES CORZO' }).success).toBe(true);
  });
});

// ─── Régimen societario — solo personas morales ───────────────────────────────

describe('Régimen societario', () => {
  it('rechaza regSoc en persona física', () => {
    const r = codigoBodySchema.safeParse({ paterno: 'GARCIA', regSoc: 'SA' });
    expect(r.success).toBe(false);
  });

  it('acepta regSoc en persona moral', () => {
    expect(codigoBodySchema.safeParse({ razSoc: 'GRUPO EJEMPLO', regSoc: 'SA' }).success).toBe(true);
  });
});

// ─── nombreBodySchema ────────────────────────────────────────────────────────

describe('nombreBodySchema', () => {
  it('acepta nombre/paterno válidos', () => {
    expect(nombreBodySchema.safeParse({ paterno: 'GARCIA', nombre: 'JUAN' }).success).toBe(true);
  });

  it('rechaza razón social con abreviatura', () => {
    const r = nombreBodySchema.safeParse({ razSoc: 'EMPRESA S.A' });
    expect(r.success).toBe(false);
  });
});

// ─── buscarQuerySchema ───────────────────────────────────────────────────────

describe('buscarQuerySchema', () => {
  it('defaults tipo=nombre', () => {
    const r = buscarQuerySchema.safeParse({ q: 'garcia' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.tipo).toBe('nombre');
  });

  it('acepta tipo=rfc', () => {
    const r = buscarQuerySchema.safeParse({ q: 'GAJJ', tipo: 'rfc' });
    expect(r.success).toBe(true);
  });

  it('rechaza tipo inválido', () => {
    const r = buscarQuerySchema.safeParse({ q: 'test', tipo: 'direccion' });
    expect(r.success).toBe(false);
  });

  it('rechaza q vacío', () => {
    const r = buscarQuerySchema.safeParse({ q: '' });
    expect(r.success).toBe(false);
  });

  it('coerce limit a número', () => {
    const r = buscarQuerySchema.safeParse({ q: 'test', limit: '50' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.limit).toBe(50);
  });
});
