// Tests de integración del árbol de rutas: montan la app real (index.js) con
// supertest y verifican que cada router está conectado con la cadena de
// middlewares correcta (auth → rol → schema). No hay BD real disponible en
// este entorno, así que estos tests se detienen en la primera capa que
// responde antes de tocar Prisma/pg — exactamente donde vivía el bug de
// `require('../config/schemas')` que tumbaba el arranque (ver BITACORA
// 2026-08-27): un error de módulo ahí habría hecho fallar el `import` de
// abajo para todo este archivo, no solo un test puntual.
import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import jwt from 'jsonwebtoken';

// createRequire hace que require() use la resolución nativa de Node (misma
// que usa index.js internamente) en vez del registry de Vitest — mismo
// patrón que cfdiSync.service.test.ts. index.js además requiere '.ts'
// (config/env.ts, config/logger.ts), que Node nativo no resuelve solo, así
// que registramos el loader de tsx (el mismo que usa `tsx index.js` en
// producción) antes de requerir la app.
const require = createRequire(import.meta.url);
require('tsx/cjs');
const request = require('supertest');
const app = require('../../../index.js');

const SECRET = process.env.JWT_SECRET!;

function token(payload: object) {
  return jwt.sign(payload, SECRET, { expiresIn: '1h' });
}

const adminToken = token({ id: 1, email: 'admin@test.com', role: 'admin', agencySchema: null });
const consultaToken = token({ id: 2, email: 'consulta@test.com', role: 'consulta', agencySchema: 'kia_zacatecas' });
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });

describe('App — rutas públicas', () => {
  it('GET / responde sin auth', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('API funcionando');
  });

  it('GET /api/health responde sin auth (aunque la BD no esté disponible)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('db');
  });
});

describe('App — gate de autenticación (401 sin token)', () => {
  const casos: [string, string][] = [
    ['get', '/api/profile'],
    ['get', '/api/announcements'],
    ['get', '/api/users'],
    ['get', '/api/settings'],
    ['get', '/api/cfdi/kia_zacatecas/ingresos'],
    ['get', '/api/ia/clasificar?schema=kia_zacatecas'],
    ['post', '/api/sync/ejecutar?schema=kia_zacatecas'],
    ['get', '/api/sync/estado?schema=kia_zacatecas'],
    ['get', '/api/cfdi-dashboard?schema=kia_zacatecas'],
    ['get', '/api/employees'],
    ['get', '/api/vencimientos'],
    ['get', '/api/v1/codigos/siguiente'],
  ];

  it.each(casos)('%s %s → 401 sin token', async (method, path) => {
    const res = await (request(app) as any)[method](path);
    expect(res.status).toBe(401);
  });
});

describe('App — gate de rol (403 con token válido pero rol insuficiente)', () => {
  it('GET /api/users con rol consulta (requiere admin) → 403', async () => {
    const res = await request(app).get('/api/users').set(auth(consultaToken));
    expect(res.status).toBe(403);
  });

  it('POST /api/sync/ejecutar con rol consulta (requiere FINANZAS_WRITE) → 403', async () => {
    const res = await request(app)
      .post('/api/sync/ejecutar?schema=kia_zacatecas')
      .set(auth(consultaToken));
    expect(res.status).toBe(403);
  });

  it('DELETE /api/settings/agency/1 con rol consulta (requiere admin) → 403', async () => {
    const res = await request(app).delete('/api/settings/agency/1').set(auth(consultaToken));
    expect(res.status).toBe(403);
  });
});

describe('App — gate de tenant (403 cuando el schema del request no es el del JWT)', () => {
  it('GET /api/cfdi/:schema/ingresos con schema distinto al del token → 403', async () => {
    const res = await request(app)
      .get('/api/cfdi/kia_celaya/ingresos') // token tiene agencySchema: kia_zacatecas
      .set(auth(consultaToken));
    expect(res.status).toBe(403);
  });
});

describe('App — allowlist de schema CFDI (400 con schema desconocido)', () => {
  const casos: [string, string][] = [
    ['get', '/api/cfdi-dashboard?schema=esquema_inventado'],
    ['get', '/api/cfdi/esquema_inventado/ingresos'],
    ['get', '/api/ia/clasificar?schema=esquema_inventado'],
    ['post', '/api/sync/ejecutar?schema=esquema_inventado'],
    ['get', '/api/sync/estado?schema=esquema_inventado'],
  ];

  it.each(casos)('%s %s con admin → 400 (schema no permitido)', async (method, path) => {
    const res = await (request(app) as any)[method](path).set(auth(adminToken));
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/esquema/i);
  });

  it(
    'GET /api/cfdi-dashboard con schema real pasa el gate (no 400/401/403)',
    async () => {
      const res = await request(app)
        .get('/api/cfdi-dashboard?schema=kia_zacatecas&anio=2026')
        .set(auth(adminToken));
      // Sin BD real disponible el handler termina en 500, pero lo que importa
      // aquí es que la cadena de middlewares (auth+rol+schema) lo dejó pasar.
      expect([400, 401, 403]).not.toContain(res.status);
    },
    15000
  );
});

describe('App — validación de body en rutas públicas de auth (sin BD)', () => {
  it('POST /api/auth/register con email inválido → 400 antes de tocar la BD', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'no-es-un-email', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('POST /api/auth/login sin password → 400 antes de tocar la BD', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });
});
