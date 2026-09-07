import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;
const { authenticateToken } = require('../auth.middleware');

function makeReq(overrides: Record<string, any> = {}) {
  return { headers: {}, params: {}, query: {}, ...overrides };
}

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function signToken(payload: object, options: jwt.SignOptions = {}) {
  return jwt.sign(payload, SECRET, options);
}

describe('authenticateToken', () => {
  it('devuelve 401 cuando no hay token', () => {
    const res = makeRes();
    const next = vi.fn();
    authenticateToken(makeReq(), res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('devuelve 403 con token inválido', () => {
    const req = makeReq({ headers: { authorization: 'Bearer token_invalido' } });
    const res = makeRes();
    const next = vi.fn();
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('devuelve 403 con token expirado', () => {
    const token = signToken({ id: 1, role: 'viewer', agencySchema: 'kia_zacatecas' }, { expiresIn: -1 });
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = vi.fn();
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('llama next() con token válido y asigna req.tenantSchema', () => {
    const token = signToken({ id: 1, role: 'viewer', agencySchema: 'kia_zacatecas' });
    const req: any = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = vi.fn();
    authenticateToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.tenantSchema).toBe('kia_zacatecas');
  });

  it('bloquea a no-admin cuando el schema del request difiere del JWT', () => {
    const token = signToken({ id: 1, role: 'viewer', agencySchema: 'kia_zacatecas' });
    const req = makeReq({
      headers: { authorization: `Bearer ${token}` },
      query: { schema: 'kia_celaya' },
    });
    const res = makeRes();
    const next = vi.fn();
    authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('permite a admin acceder a cualquier schema', () => {
    const token = signToken({ id: 1, role: 'admin', agencySchema: 'kia_zacatecas' });
    const req = makeReq({
      headers: { authorization: `Bearer ${token}` },
      query: { schema: 'kia_celaya' },
    });
    const res = makeRes();
    const next = vi.fn();
    authenticateToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('permite acceso cuando schema del request coincide con el JWT', () => {
    const token = signToken({ id: 1, role: 'viewer', agencySchema: 'kia_zacatecas' });
    const req = makeReq({
      headers: { authorization: `Bearer ${token}` },
      params: { schema: 'kia_zacatecas' },
    });
    const res = makeRes();
    const next = vi.fn();
    authenticateToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('permite acceso sin schema en la ruta (rutas globales)', () => {
    const token = signToken({ id: 1, role: 'viewer', agencySchema: 'kia_zacatecas' });
    const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
    const res = makeRes();
    const next = vi.fn();
    authenticateToken(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
