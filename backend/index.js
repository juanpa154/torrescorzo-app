const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 🔽 Importar y usar rutas
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

const ordenesRoutes = require('./src/routes/ordenes.routes');
app.use('/api/ordenes', ordenesRoutes);

app.get('/', (req, res) => {
  res.send('API funcionando 🚀');
});

const employeeRoutes = require('./src/routes/employee.routes');
app.use('/api/employees', employeeRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor backend en http://localhost:${PORT}`);
});

