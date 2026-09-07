// Variables de entorno mínimas para que los tests corran sin .env real
process.env.JWT_SECRET = 'vitest_test_secret_minimum_32_characters_ok';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.OPENAI_API_KEY = 'sk-test';
process.env.TU_HOST_REMOTO = 'localhost';
process.env.TU_USUARIO = 'test';
process.env.TU_PASSWORD = 'test';
process.env.NOMBRE_DE_LA_BD = 'test';
process.env.PG_CFDI_HOST = 'localhost';
process.env.PG_CFDI_USER = 'test';
process.env.PG_CFDI_PASSWORD = 'test';
process.env.PG_CFDI_DB = 'test';
