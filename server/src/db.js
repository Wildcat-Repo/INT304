const mysql = require('mysql2/promise');

// One shared connection pool for the whole API.
// Settings come from environment variables (see .env.example).
function createPool(env = process.env) {
  return mysql.createPool({
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT) || 3306,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10
  });
}

module.exports = { createPool };
