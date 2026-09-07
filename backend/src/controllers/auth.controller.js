const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createUser, findUserByEmail } = require('../models/user.model');

const register = async (req, res) => {
  const { email, password } = req.body;

  const existingUser = await findUserByEmail(email);
  if (existingUser) return res.status(400).json({ message: 'Usuario ya existe' });

  // role y agencySchema nunca vienen del cliente — el registro siempre crea un
  // usuario de solo lectura sin agencia; un admin lo promueve luego vía
  // PUT /api/users/:id/role (y asigna agencySchema por fuera de este endpoint).
  const user = await createUser({ email, password, role: 'viewer', agencySchema: null });
  res.status(201).json({ message: 'Usuario creado', user: { id: user.id, email: user.email, role: user.role, agencySchema: user.agencySchema } });
};


const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email); // 👈 falta await
  if (!user) return res.status(400).json({ message: 'Credenciales inválidas' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Credenciales inválidas' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, agencySchema: user.agencySchema },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ message: 'Login exitoso', token });
};

module.exports = { register, login };
