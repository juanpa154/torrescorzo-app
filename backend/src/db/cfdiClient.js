// db/cfdiClient.js
const { Client } = require('pg');

function getCfdiClient(schema) {
  return new Client({
    host: process.env.PG_CFDI_HOST,
    port: process.env.PG_CFDI_PORT,
    user: process.env.PG_CFDI_USER,
    password: process.env.PG_CFDI_PASSWORD,
    database: process.env.PG_CFDI_DB,
    application_name: `cfdi-${schema}`,
    statement_timeout: 10000,
    options: `-c search_path=${schema}`,
  });
}

module.exports = getCfdiClient;
