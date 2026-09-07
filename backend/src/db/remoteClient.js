const { Pool } = require('pg');

// Pool conecta en el primer uso — no bloquea el arranque si la BD remota no está disponible
const remoteClient = new Pool({
  host: process.env.TU_HOST_REMOTO,
  port: 5432,
  user: process.env.TU_USUARIO,
  password: process.env.TU_PASSWORD,
  database: process.env.NOMBRE_DE_LA_BD,
});

module.exports = remoteClient;
