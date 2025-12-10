// src/models/BusinessRule.js

const { pool } = require('../config/db.config');

class BusinessRule {
    /**
     * Obtiene la regla de porcentaje de recompensa actual.
     * Como solo tenemos un registro (id=1), lo buscamos directamente.
     */
    static async getCurrentPercentage() {
        const query = `
            SELECT porcentaje_recompensa 
            FROM "ReglasDelNegocio" 
            LIMIT 1
        `;
        const result = await pool.query(query);
        // Si no existe, devuelve 0 o lanza un error. Devolvemos el valor.
        return result.rows[0] ? result.rows[0].porcentaje_recompensa : 0;
    }

    /**
     * Actualiza la regla de porcentaje de recompensa (solo para el Dashboard Admin).
     */
    static async updatePercentage({ percentage, userId }) {
        const query = `
            UPDATE "ReglasDelNegocio" 
            SET 
                porcentaje_recompensa = $1,
                ultima_modificacion_por_id = $2,
                fecha_ultima_modificacion = CURRENT_TIMESTAMP
            WHERE id = 1
            RETURNING porcentaje_recompensa, fecha_ultima_modificacion
        `;
        const values = [percentage, userId];
        const result = await pool.query(query, values);
        return result.rows[0];
    }
}

module.exports = BusinessRule;