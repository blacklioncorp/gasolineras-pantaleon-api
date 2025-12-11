// src/models/User.js (CÓDIGO COMPLETO Y ACTUALIZADO)

const { pool } = require('../config/db.config');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10; 

class User {
    // --- MÉTODOS DE LECTURA (READ) ---

    // [Existente] Buscar por login para la Autenticación
    static async findByLogin(usuario_login) {
        const query = 'SELECT * FROM "Usuarios" WHERE usuario_login = $1 AND activo = TRUE';
        const result = await pool.query(query, [usuario_login]);
        return result.rows[0];
    }

    // [NUEVO] Buscar por ID para el CRUD Admin
    static async findById(id) {
        // Excluimos password_hash por seguridad
        const query = 'SELECT id, nombre_completo, usuario_login, rol, activo, fecha_creacion FROM "Usuarios" WHERE id = $1';
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // [Existente/Mejorado] Listar todos los usuarios para el Dashboard
    static async findAll() {
        const query = 'SELECT id, nombre_completo, usuario_login, rol, activo, fecha_creacion FROM "Usuarios" ORDER BY rol DESC';
        const result = await pool.query(query);
        return result.rows;
    }
    
    // --- MÉTODOS DE ESCRITURA (CREATE) ---

    // [NUEVO] Crear un nuevo usuario (con hashing de contraseña)
    static async create({ nombre_completo, usuario_login, password, rol }) {
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
        const query = `
            INSERT INTO "Usuarios" (nombre_completo, usuario_login, password_hash, rol)
            VALUES ($1, $2, $3, $4)
            RETURNING id, nombre_completo, usuario_login, rol, activo
        `;
        const values = [nombre_completo, usuario_login, password_hash, rol];
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // --- MÉTODOS DE ACTUALIZACIÓN (UPDATE) ---

    // [NUEVO] Actualizar datos o contraseña de un usuario
    static async update(id, data) {
        const fields = [];
        const values = [id];
        let index = 2; 

        if (data.nombre_completo) { fields.push(`nombre_completo = $${index++}`); values.push(data.nombre_completo); }
        if (data.usuario_login) { fields.push(`usuario_login = $${index++}`); values.push(data.usuario_login); }
        if (data.rol) { fields.push(`rol = $${index++}`); values.push(data.rol); }
        if (data.activo !== undefined) { fields.push(`activo = $${index++}`); values.push(data.activo); }
        
        // Si se proporciona una nueva contraseña, la hasheamos
        if (data.password) {
            const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);
            fields.push(`password_hash = $${index++}`);
            values.push(password_hash);
        }

        if (fields.length === 0) { return this.findById(id); }

        const query = `
            UPDATE "Usuarios"
            SET ${fields.join(', ')}
            WHERE id = $1
            RETURNING id, nombre_completo, usuario_login, rol, activo, fecha_creacion
        `;
        
        const result = await pool.query(query, values);
        return result.rows[0];
    }
    
    // --- MÉTODOS DE ELIMINACIÓN (DELETE / Desactivación) ---

    // [NUEVO] Desactivar un usuario (soft-delete)
    static async deactivate(id) {
        const query = `
            UPDATE "Usuarios"
            SET activo = FALSE
            WHERE id = $1
            RETURNING id, nombre_completo, usuario_login, activo
        `;
        const result = await pool.query(query, [id]);
        return result.rows[0];
    }

    // [Existente] Comparar contraseña
    static async comparePassword(candidatePassword, hash) {
        return bcrypt.compare(candidatePassword, hash);
    }
}

module.exports = User;