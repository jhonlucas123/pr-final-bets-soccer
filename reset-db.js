require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function resetDb() {
    const client = await pool.connect();
    try {
        console.log("⚠️  BORRANDO Base de Datos...");

        try {
            await client.query(`
                SELECT pg_terminate_backend(pid) 
                FROM pg_stat_activity 
                WHERE pid <> pg_backend_pid() 
                AND datname = current_database()
            `);
            console.log("Conexiones activas terminadas.");
        } catch (err) {
            console.warn("No se pudieron cerrar algunas conexiones (puede faltar permisos):", err.message);
        }

        await client.query('BEGIN');

        // Orden inverso de dependencias para evitar errores de FK
        await client.query('DROP TABLE IF EXISTS notifications CASCADE');
        await client.query('DROP TABLE IF EXISTS simulation_state CASCADE');
        await client.query('DROP TABLE IF EXISTS messages CASCADE');
        await client.query('DROP TABLE IF EXISTS bets CASCADE');
        await client.query('DROP TABLE IF EXISTS matches CASCADE');
        await client.query('DROP TABLE IF EXISTS players CASCADE');
        await client.query('DROP TABLE IF EXISTS teams CASCADE');
        await client.query('DROP TABLE IF EXISTS users CASCADE');

        await client.query('COMMIT');

        console.log("✅ Tablas eliminadas correctamente.");
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("❌ Error al borrar tablas:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

resetDb();
