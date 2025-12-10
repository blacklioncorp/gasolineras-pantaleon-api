// src/models/Transaction.js

const { pool } = require('../config/db.config');

class Transaction {
    /**
     * Registra una nueva transacción en el historial.
     */
    static async create({ 
        cliente_id, 
        cajero_id, 
        monto_venta, 
        porcentaje_recompensa, 
        puntos_abonados 
    }) {
        const query = `
            INSERT INTO "Transacciones" (
                cliente_id, 
                cajero_id, 
                monto_venta, 
                porcentaje_recompensa, 
                puntos_abonados
            )
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING id, fecha_transaccion, puntos_abonados
        `;
        const values = [
            cliente_id, 
            cajero_id, 
            monto_venta, 
            porcentaje_recompensa, 
            puntos_abonados
        ];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    /**
     * Obtiene el historial de transacciones (utilizado por el Dashboard Admin).
     */
    static async getHistory({ limit = 20, offset = 0 }) {
        const query = `
            SELECT 
                t.fecha_transaccion, 
                t.monto_venta, 
                t.puntos_abonados,
                t.porcentaje_recompensa,
                c.nombre_completo AS cliente_nombre,
                u.nombre_completo AS cajero_nombre
            FROM "Transacciones" t
            JOIN "Clientes" c ON t.cliente_id = c.id
            JOIN "Usuarios" u ON t.cajero_id = u.id
            ORDER BY t.fecha_transaccion DESC
            LIMIT $1 OFFSET $2
        `;
        const result = await pool.query(query, [limit, offset]);
        return result.rows;
    }
}

module.exports = Transaction;