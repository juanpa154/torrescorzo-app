const { Pool } = require('pg');

let pool = null;

function getCfdiPool() {
  if (!pool) {
    pool = new Pool({
      host: process.env.PG_CFDI_HOST,
      port: parseInt(process.env.PG_CFDI_PORT, 10) || 5432,
      user: process.env.PG_CFDI_USER,
      password: process.env.PG_CFDI_PASSWORD,
      database: process.env.PG_CFDI_DB,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 120000
    });
  }
  return pool;
}

module.exports = getCfdiPool;
