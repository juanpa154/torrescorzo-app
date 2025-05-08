const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createUser, findUserByEmail } = require('../models/user.model');

const register = async (req, res) => {
  const { email, password, role = 'viewer' } = req.body;

  const existingUser = await findUserByEmail(email);
  if (existingUser) return res.status(400).json({ message: 'Usuario ya existe' });

  const user = await createUser({ email, password, role });
  res.status(201).json({ message: 'Usuario creado', user: { id: user.id, email: user.email, role: user.role } });
};


const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email); // 👈 falta await
  if (!user) return res.status(400).json({ message: 'Credenciales inválidas' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Credenciales inválidas' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  res.json({ message: 'Login exitoso', token });
};

module.exports = { register, login };
