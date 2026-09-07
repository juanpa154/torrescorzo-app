const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Permisos insuficientes para esta operación' });
  }
  next();
};

module.exports = { requireRole };
