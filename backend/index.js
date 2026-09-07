// dotenv debe cargar primero, antes de cualquier validación de entorno
require('dotenv').config();

// Validar variables de entorno al arrancar — falla rápido si falta alguna
const { env } = require('./src/config/env');
const logger = require('./src/config/logger').default;

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(helmet());

// Sin CORS_ORIGIN configurado, cors() abre a cualquier origen (dev).
// En producción, definir CORS_ORIGIN con la(s) URL(s) del frontend (coma-separadas).
const allowedOrigins = env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean);
app.use(
  cors(
    allowedOrigins?.length
      ? {
          origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
            callback(new Error('Origen no permitido por CORS'));
          },
        }
      : undefined
  )
);
app.use(express.json());

// Límite general: 200 req / 15 min por IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intenta más tarde' },
});

// Límite estricto para auth: 20 req / 15 min (anti-brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de autenticación, intenta más tarde' },
});

app.use('/api', generalLimiter);
app.use('/api/auth', authLimiter);

const authRoutes = require('./src/routes/auth.routes');
app.use('/api/auth', authRoutes);

const protectedRoutes = require('./src/routes/protected.routes');
app.use('/api', protectedRoutes);

const announcementRoutes = require('./src/routes/announcement.routes');
app.use('/api/announcements', announcementRoutes);

const userRoutes = require('./src/routes/user.routes');
app.use('/api/users', userRoutes);

const settingsRoutes = require('./src/routes/settings.routes');
app.use('/api/settings', settingsRoutes);

const cfdiRoutes = require('./src/routes/cfdi.routes');
app.use('/api/cfdi', cfdiRoutes);

const classifierRoutes = require('./src/routes/cfdiClassifier.routes');
app.use('/api/ia', classifierRoutes);

const syncRoutes = require('./src/routes/sync.routes');
app.use('/api/sync', syncRoutes);

const cfdiDashboardRoutes = require('./src/routes/cfdiDashboard.routes');
app.use('/api/cfdi-dashboard', cfdiDashboardRoutes);

const employeeRoutes = require('./src/routes/employee.routes');
app.use('/api/employees', employeeRoutes);

const vencimientosRoutes = require('./src/routes/vencimientos.routes');
app.use('/api/vencimientos', vencimientosRoutes);

const healthRoutes = require('./src/routes/health.routes').default;
app.use('/api/health', healthRoutes);

const codigosRoutes = require('./src/routes/codigos.routes');
app.use('/api/v1/codigos', codigosRoutes);

app.get('/', (_req, res) => {
  res.send('API funcionando');
});

// require.main === module: solo arranca el listener y el cron cuando este
// archivo corre directamente (npm start/dev), no cuando un test lo requiere
// para montar `app` con supertest.
if (require.main === module) {
  if (env.CFDI_CRON_ENABLED === 'true') {
    const { startCfdiCron } = require('./src/jobs/cfdiCron');
    startCfdiCron();
  }

  const PORT = env.PORT;
  app.listen(PORT, () => {
    logger.info(`Servidor backend en http://localhost:${PORT}`);
  });
}

module.exports = app;
