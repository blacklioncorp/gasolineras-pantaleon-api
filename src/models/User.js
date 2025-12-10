// src/models/User.js

const { pool } = require('../config/db.config');
const bcrypt = require('bcryptjs');

class User {
    // Método estático para encontrar un usuario por su nombre de login
    static async findByLogin(usuario_login) {
        const query = 'SELECT * FROM "Usuarios" WHERE usuario_login = $1';
        const result = await pool.query(query, [usuario_login]);
        return result.rows[0];
    }

    // Método para verificar la contraseña hasheada
    static async comparePassword(password, userPasswordHash) {
        // Compara la contraseña plana ingresada con el hash almacenado en la DB
        return await bcrypt.compare(password, userPasswordHash);
    }
    
    // Método para crear un nuevo usuario (solo para configuración inicial/admin)
    static async create({ nombre_completo, usuario_login, password, rol }) {
        // Hashea la contraseña antes de guardarla
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        
        const query = `
            INSERT INTO "Usuarios" (nombre_completo, usuario_login, password_hash, rol)
            VALUES ($1, $2, $3, $4) RETURNING id, usuario_login, rol
        `;
        const values = [nombre_completo, usuario_login, password_hash, rol];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    }
}

module.exports = User;