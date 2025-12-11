// src/models/Client.js

const { pool } = require('../config/db.config');

class Client {
    // 1. Busca un cliente por su número de celular
    static async findByPhoneNumber(numero_celular) {
        const query = 'SELECT * FROM "Clientes" WHERE numero_celular = $1';
        const result = await pool.query(query, [numero_celular]);
        return result.rows[0];
    }

    // 2. Crea un nuevo cliente (después de la validación OTP)
    static async create({ numero_celular, nombre_completo, edad, sexo }) {
        const query = `
            INSERT INTO "Clientes" (numero_celular, nombre_completo, edad, sexo)
            VALUES ($1, $2, $3, $4) 
            RETURNING id, numero_celular, nombre_completo, saldo_puntos
        `;
        const values = [numero_celular, nombre_completo, edad, sexo];
        
        const result = await pool.query(query, values);
        return result.rows[0];
    }

    // 3. Actualiza el saldo de un cliente (usado en el módulo de transacciones)
    static async updateBalance(id, points_to_add) {
        const query = `
            UPDATE "Clientes" 
            SET saldo_puntos = saldo_puntos + $2
            WHERE id = $1
            RETURNING saldo_puntos
        `;
        const result = await pool.query(query, [id, points_to_add]);
        return result.rows[0];
    }

    static async countTotalClients() {
        const query = 'SELECT COUNT(id) FROM "Clientes"';
        const result = await pool.query(query);
        // La columna COUNT(id) se devuelve como "count"
        return parseInt(result.rows[0].count) || 0;
    }
}

module.exports = Client;