const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3, // En serverless, menos es más para no agotar el límite de Neon
    idleTimeoutMillis: 1000, // Liberar la conexión casi inmediatamente (1s)
    connectionTimeoutMillis: 10000
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
};
