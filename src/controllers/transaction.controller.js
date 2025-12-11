// src/controllers/transaction.controller.js

const Client = require('../models/Client');
const Transaction = require('../models/Transaction');
const BusinessRule = require('../models/BusinessRule');
const { pool } = require('../config/db.config'); // Necesitamos el pool para la transacción atómica

/**
 * POST /api/v1/transacciones/abono
 * Registra una venta, calcula los puntos y actualiza el saldo del cliente.
 * REQUIERE: Token de usuario (Cajero o Admin)
 */
exports.recordRedemption = async (req, res) => {
    const { numero_celular, puntos_a_canjear } = req.body;
    const cajero_id = req.user.id;

    if (!numero_celular || !puntos_a_canjear || puntos_a_canjear <= 0) {
        return res.status(400).json({ message: 'Debe especificar el cliente y una cantidad válida de puntos a canjear.' });
    }

    const puntosACanjearFloat = parseFloat(puntos_a_canjear);
    const clientDB = await pool.connect();

    try {
        await clientDB.query('BEGIN');

        // 1. Buscar Cliente y verificar saldo
        const clientResult = await clientDB.query('SELECT id, saldo_puntos, nombre_completo FROM "Clientes" WHERE numero_celular = $1', [numero_celular]);
        const client = clientResult.rows[0];

        if (!client) {
            await clientDB.query('ROLLBACK');
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }
        
        const saldoActual = parseFloat(client.saldo_puntos);
        
        if (saldoActual < puntosACanjearFloat) {
            await clientDB.query('ROLLBACK');
            return res.status(400).json({ 
                message: `Saldo insuficiente. Saldo actual: $${saldoActual.toFixed(2)}`,
                saldo_disponible: saldoActual
            });
        }
        
        // El monto de movimiento es negativo (canje)
        const montoMovimiento = -puntosACanjearFloat; 

        // 2. Actualizar el saldo del cliente (resta los puntos)
        const updateBalanceQuery = `
            UPDATE "Clientes" 
            SET saldo_puntos = saldo_puntos + $2
            WHERE id = $1
            RETURNING saldo_puntos
        `;
        const updatedClientResult = await clientDB.query(updateBalanceQuery, [client.id, montoMovimiento]);
        const nuevo_saldo = updatedClientResult.rows[0].saldo_puntos;

        // 3. Registrar la Transacción de CANJE
        const createTransactionQuery = `
            INSERT INTO "Transacciones" (
                cliente_id, cajero_id, monto_efectivo, tipo_movimiento
            )
            VALUES ($1, $2, $3, 'CANJE')
        `;
        // Monto efectivo es negativo, indicando una salida de dinero
        const transactionValues = [client.id, cajero_id, montoMovimiento];
        await clientDB.query(createTransactionQuery, transactionValues);

        await clientDB.query('COMMIT');

        res.status(200).json({
            message: `Canje de $${puntosACanjearFloat.toFixed(2)} realizado.`,
            cliente: client.nombre_completo,
            canje_realizado: puntosACanjearFloat,
            nuevo_saldo: nuevo_saldo
        });

    } catch (error) {
        await clientDB.query('ROLLBACK');
        console.error('Error en la transacción de canje:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar el canje.' });

    } finally {
        clientDB.release();
    }
};


exports.recordTransaction = async (req, res) => {
    const { numero_celular, monto_venta } = req.body;
    
    // El ID del cajero lo obtenemos del token JWT, gracias al middleware verifyToken
    const cajero_id = req.user.id; 

    // Validación de entrada
    if (!numero_celular || !monto_venta || monto_venta <= 0) {
        return res.status(400).json({ message: 'Monto de venta válido y número de celular son requeridos.' });
    }

    // Iniciar una transacción de la base de datos para asegurar atomicidad
    const clientDB = await pool.connect(); // Obtener un cliente/conexión del pool

    try {
        await clientDB.query('BEGIN'); // 1. INICIAR LA TRANSACCIÓN

        // A. 1. Buscar el cliente
        const clientResult = await clientDB.query(
            'SELECT id, saldo_puntos, nombre_completo FROM "Clientes" WHERE numero_celular = $1',
            [numero_celular]
        );
        const client = clientResult.rows[0];

        if (!client) {
            await clientDB.query('ROLLBACK'); // Deshacer
            return res.status(404).json({ message: 'Cliente no encontrado. Debe registrarse primero.' });
        }

        // A. 2. Obtener la regla de recompensa actual
        const ruleResult = await clientDB.query(
            'SELECT porcentaje_recompensa FROM "ReglasDelNegocio" LIMIT 1'
        );
        const porcentaje_recompensa = ruleResult.rows[0] ? parseFloat(ruleResult.rows[0].porcentaje_recompensa) : 0;
        
        if (porcentaje_recompensa === 0) {
             console.warn('Advertencia: El porcentaje de recompensa es 0.');
        }

        // B. Calcular Puntos
        const montoVentaFloat = parseFloat(monto_venta);
        // Puntos = Monto * (Porcentaje / 100)
        const puntos_abonados = (montoVentaFloat * (porcentaje_recompensa / 100)).toFixed(2);
        
        if (puntos_abonados <= 0) {
            // Si el monto es muy bajo y los puntos son 0, igual se registra la venta
            console.warn(`Puntos abonados es 0 para venta de ${montoVentaFloat}.`);
        }
        
        // C. 1. Actualizar el saldo del cliente
        const updateBalanceQuery = `
            UPDATE "Clientes" 
            SET saldo_puntos = saldo_puntos + $2
            WHERE id = $1
            RETURNING saldo_puntos
        `;
        const updatedClientResult = await clientDB.query(updateBalanceQuery, [client.id, puntos_abonados]);
        const nuevo_saldo = updatedClientResult.rows[0].saldo_puntos;

        // C. 2. Registrar la Transacción
        const createTransactionQuery = `
            INSERT INTO "Transacciones" (
                cliente_id, cajero_id, monto_venta, porcentaje_recompensa, puntos_abonados
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING fecha_transaccion
        `;
        const transactionValues = [
            client.id, 
            cajero_id, 
            montoVentaFloat, 
            porcentaje_recompensa, 
            parseFloat(puntos_abonados)
        ];
        await clientDB.query(createTransactionQuery, transactionValues);

        await clientDB.query('COMMIT'); // 2. CONFIRMAR: Si todo salió bien, guardamos los cambios.

        // D. Respuesta exitosa
        res.status(201).json({
            message: 'Puntos abonados exitosamente.',
            cliente: client.nombre_completo,
            puntos_abonados: parseFloat(puntos_abonados),
            nuevo_saldo: nuevo_saldo,
            porcentaje_aplicado: porcentaje_recompensa
        });

    } catch (error) {
        // 3. DESHACER: Si algo falló (DB, cálculo, etc.), deshacemos todos los cambios.
        await clientDB.query('ROLLBACK'); 
        console.error('Error en la transacción de abono de puntos:', error);
        res.status(500).json({ message: 'Error interno del servidor al procesar la transacción.' });

    } finally {
        // 4. Liberar el cliente/conexión de vuelta al pool
        clientDB.release();
    }
};
exports.getHistory = async (req, res) => {
    // Los parámetros vienen como query strings: /api/v1/transacciones?limit=20&page=1
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const offset = (page - 1) * limit;

    try {
        // La lógica de JOIN para obtener nombres de Cliente y Cajero ya está en el modelo
        const transactions = await Transaction.getHistory({ limit, offset });
        
        // Se puede añadir aquí la lógica para obtener el conteo total para la paginación

        res.status(200).json({
            page,
            limit,
            data: transactions
        });
        
    } catch (error) {
        console.error('Error al obtener el historial de transacciones:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el historial.' });
    }
};