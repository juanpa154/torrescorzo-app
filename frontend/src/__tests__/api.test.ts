import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { login, register, getToken, fetchEmployees, fetchSettings } from '../services/api';

const mockJson = vi.fn();
const mockFetch = vi.fn(() =>
  Promise.resolve({ json: mockJson })
);

beforeEach(() => {
  vi.stubGlobal('fetch', mockFetch);
  mockJson.mockResolvedValue({});
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('login', () => {
  it('hace POST a /api/auth/login con email y password', async () => {
    mockJson.mockResolvedValue({ token: 'abc123' });
    await login('usuario@test.com', 'password123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'usuario@test.com', password: 'password123' }),
      })
    );
  });

  it('devuelve la respuesta del servidor', async () => {
    mockJson.mockResolvedValue({ token: 'mi_token', message: 'Login exitoso' });
    const result = await login('a@b.com', '12345678');
    expect(result.token).toBe('mi_token');
  });
});

describe('register', () => {
  it('hace POST a /api/auth/register', async () => {
    await register('nuevo@test.com', 'password123');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/register'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('getToken', () => {
  it('devuelve null cuando no hay token en localStorage', () => {
    expect(getToken()).toBeNull();
  });

  it('devuelve el token almacenado', () => {
    localStorage.setItem('token', 'mi_token_guardado');
    expect(getToken()).toBe('mi_token_guardado');
  });
});

describe('rutas protegidas con Authorization', () => {
  it('fetchEmployees incluye el token en el header Authorization', async () => {
    localStorage.setItem('token', 'token_de_prueba');
    await fetchEmployees();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/employees'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token_de_prueba',
        }),
      })
    );
  });

  it('fetchSettings incluye el token en el header Authorization', async () => {
    localStorage.setItem('token', 'mi_token');
    await fetchSettings();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/settings'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mi_token',
        }),
      })
    );
  });
});
