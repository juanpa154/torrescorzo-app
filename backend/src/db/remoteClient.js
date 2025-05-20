const { Client } = require("pg");

const remoteClient = new Client({
  host: process.env.TU_HOST_REMOTO,      // ejemplo: '192.168.1.50' o dominio
  port: 5432,                  // o el que uses
  user: process.env.TU_USUARIO,
  password: process.env.TU_PASSWORD,
  database: process.env.NOMBRE_DE_LA_BD,
});

remoteClient.connect();

module.exports = remoteClient;
