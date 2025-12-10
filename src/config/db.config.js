// src/config/db.config.js

const { Pool } = require('pg');
const fs = require('fs').promises; // Usamos la versión de Promesas
const path = require('path');

// Crea el pool usando las variables de entorno de Render
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false 
});

/**
 * Función que intenta conectar la base de datos y ejecuta la migración inicial.
 */
async function connectDB() {
    try {
        // 1. Verificar la conexión
        await pool.query('SELECT 1'); 

        // 2. Comprobar si la tabla Usuarios ya existe
        const checkTable = await pool.query(`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables 
                WHERE table_name = 'Usuarios'
            );
        `);

        if (checkTable.rows[0].exists) {
            console.log('✅ La tabla "Usuarios" ya existe. No se ejecuta la migración inicial.');
            return;
        }

        // 3. Ejecutar la migración si la tabla no existe
        console.log('⚠️ Tabla "Usuarios" no encontrada. Ejecutando migración inicial...');
        
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'init.sql');
        const sqlCommands = await fs.readFile(sqlPath, { encoding: 'utf-8' });
        
        // Ejecutar todos los comandos SQL de una sola vez
        await pool.query(sqlCommands);
        
        console.log('🚀 Migración inicial completada exitosamente. Administrador creado.');

    } catch (err) {
        console.error('❌ Error de conexión o en la migración SQL:', err);
        throw new Error('Fallo la conexión o la inicialización de la base de datos.');
    }
}

// Exporta la función de conexión y el pool para usar en los controladores
module.exports = {
    connectDB,
    pool
};