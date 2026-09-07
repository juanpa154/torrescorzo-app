const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido' });

    req.user = user;
    req.tenantSchema = user.agencySchema || null;

    // Validar tenant si la ruta incluye schema (admin puede acceder a cualquiera)
    const requestedSchema = req.params.schema || req.query.schema;
    if (requestedSchema) {
      if (user.role !== 'admin' && requestedSchema !== user.agencySchema) {
        return res.status(403).json({ message: 'Acceso denegado: schema no autorizado' });
      }
      // Admin sin agencySchema asignado puede operar sobre el schema solicitado
      if (!req.tenantSchema) req.tenantSchema = requestedSchema;
    }

    next();
  });
};

module.exports = { authenticateToken };
