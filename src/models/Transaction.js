// src/models/Transaction.js

const { pool } = require('../config/db.config');

class Transaction {
    /**
     * Registra un nuevo movimiento (Abono o Canje).
     */
    static async create({ 
        cliente_id, 
        cajero_id, 
        monto_efectivo, 
        tipo_movimiento,
        monto_venta_original = null, // Solo para ABONO
        porcentaje_recompensa = null // Solo para ABONO
    }) {
        const query = `
            INSERT INTO "Transacciones" (
                cliente_id, cajero_id, monto_efectivo, tipo_movimiento,
                monto_venta_original, porcentaje_recompensa
            )
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING id, fecha_transaccion, monto_efectivo, tipo_movimiento
        `;
        const values = [
            cliente_id, cajero_id, monto_efectivo, tipo_movimiento,
            monto_venta_original, porcentaje_recompensa
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
    static async getSummaryMetrics() {
        const query = `
            SELECT 
                COALESCE(SUM(monto_venta), 0)::numeric(10, 2) AS total_sales,
                COALESCE(SUM(puntos_abonados), 0)::numeric(10, 2) AS total_points_credited
            FROM "Transacciones"
        `;
        const result = await pool.query(query);
        // COALESCE asegura que si no hay transacciones, devuelve 0 en lugar de null
        return result.rows[0];
    }
}

module.exports = Transaction;