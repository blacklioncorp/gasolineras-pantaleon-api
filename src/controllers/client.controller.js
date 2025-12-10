// src/controllers/client.controller.js

const Client = require('../models/Client');
const { generateOTP, sendOTP } = require('../services/sms.service');
const { setOTP, verifyOTP } = require('../services/otp.cache');

// Expiración temporal de 5 minutos, debe ser el mismo que en otp.cache.js
const OTP_EXPIRATION_MINUTES = 5; 


/**
 * POST /api/v1/clientes/solicitar-otp
 * 1. Verifica si el cliente ya está registrado.
 * 2. Genera y guarda un OTP.
 * 3. Llama al servicio de mensajería para enviarlo.
 */
exports.solicitarOTP = async (req, res) => {
    const { numero_celular } = req.body;

    // Validación básica
    if (!numero_celular) {
        return res.status(400).json({ message: 'El número de celular es requerido.' });
    }

    try {
        // A. Verificar si el cliente ya existe
        const existingClient = await Client.findByPhoneNumber(numero_celular);
        if (existingClient) {
            return res.status(409).json({ 
                message: 'El cliente ya está registrado en el sistema.',
                isRegistered: true 
            });
        }

        // B. Generar y guardar el OTP
        const otpCode = generateOTP();
        setOTP(numero_celular, otpCode); // Guarda en la caché (Map)

        // C. Enviar el OTP al cliente
        await sendOTP(numero_celular, otpCode); 

        // D. Respuesta exitosa
        res.json({ 
            message: `Código de verificación enviado al ${numero_celular}. Expira en ${OTP_EXPIRATION_MINUTES} minutos.`,
            otp_sent: true,
            expires_in_minutes: OTP_EXPIRATION_MINUTES
            // NO se retorna el código OTP por seguridad
        });

    } catch (error) {
        console.error('Error al solicitar OTP:', error);
        res.status(500).json({ message: error.message || 'Error al enviar el código de verificación.' });
    }
};


/**
 * POST /api/v1/clientes/verificar-otp
 * 1. Verifica el código OTP en la caché temporal.
 */
exports.verificarOTP = async (req, res) => {
    const { numero_celular, otp_code } = req.body;

    // Validación básica
    if (!numero_celular || !otp_code) {
        return res.status(400).json({ message: 'Número de celular y código OTP son requeridos.' });
    }

    try {
        // 1. Verificar el código en la caché
        const isValid = verifyOTP(numero_celular, otp_code);

        if (!isValid) {
            return res.status(401).json({ message: 'Código OTP inválido o expirado. Vuelva a solicitarlo.' });
        }

        // 2. Respuesta exitosa: OTP verificado.
        // Se puede añadir un token temporal de "verificación" para usar en el siguiente endpoint
        res.json({ 
            message: 'Código verificado correctamente. Puede proceder con el registro.',
            is_verified: true,
            // Aquí podrías generar un token temporal si el registro fuera en una URL diferente
        });

    } catch (error) {
        console.error('Error al verificar OTP:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};


/**
 * POST /api/v1/clientes
 * 1. Requiere que el número de celular haya sido verificado recientemente (opcionalmente).
 * 2. Registra los datos del cliente en la DB.
 */
exports.createClient = async (req, res) => {
    const { numero_celular, nombre_completo, edad, sexo } = req.body;

    // Validación de campos requeridos
    if (!numero_celular || !nombre_completo || !edad || !sexo) {
        return res.status(400).json({ message: 'Faltan campos requeridos para el registro del cliente.' });
    }
    
    // NOTA: En un sistema real, antes de este punto, se debería asegurar que 
    // el OTP ha sido verificado. Por simplicidad, aquí asumimos que el frontend 
    // solo envía esta petición después de una verificación exitosa.

    try {
        // A. Verificar doblemente si ya existe (para evitar duplicados por la concurrencia)
        const existingClient = await Client.findByPhoneNumber(numero_celular);
        if (existingClient) {
            return res.status(409).json({ message: 'El cliente ya está registrado en el sistema.' });
        }
        
        // B. Crear el cliente en la base de datos
        const newClient = await Client.create({ numero_celular, nombre_completo, edad, sexo });

        // C. Respuesta exitosa
        res.status(201).json({ 
            message: 'Cliente registrado exitosamente.',
            client: {
                id: newClient.id,
                nombre_completo: newClient.nombre_completo,
                saldo: newClient.saldo_puntos // Debería ser 0.00
            }
        });

    } catch (error) {
        console.error('Error al crear cliente:', error);
        // Manejo de errores específicos de PostgreSQL, si es necesario
        res.status(500).json({ message: 'Error al registrar el cliente en la base de datos.' });
    }
};


/**
 * GET /api/v1/clientes/:celular
 * 1. Consulta el saldo de un cliente por su número de celular.
 * (Usado en la vista "Consultar Saldo")
 */
exports.getClientBalance = async (req, res) => {
    // El número de celular viene de los parámetros de la URL
    const { celular } = req.params;

    if (!celular) {
        return res.status(400).json({ message: 'El número de celular es requerido.' });
    }

    try {
        const client = await Client.findByPhoneNumber(celular);

        if (!client) {
            return res.status(404).json({ message: 'Cliente no encontrado.' });
        }

        res.json({
            nombre_completo: client.nombre_completo,
            saldo_puntos: client.saldo_puntos,
            ultima_transaccion: client.fecha_registro // O el campo de la última transacción
        });
        
    } catch (error) {
        console.error('Error al consultar saldo:', error);
        res.status(500).json({ message: 'Error interno del servidor al consultar saldo.' });
    }
};