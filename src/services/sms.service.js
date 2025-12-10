// src/services/sms.service.js

const twilio = require('twilio');

// Inicializa el cliente de Twilio con las variables de entorno
const client = twilio(
    process.env.TWILIO_SID, 
    process.env.TWILIO_AUTH_TOKEN
);

/**
 * Genera un código OTP de 6 dígitos
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Envía el código OTP (preferiblemente por WhatsApp si está configurado).
 * @param {string} to - Número de teléfono del cliente (con código de país).
 * @param {string} otpCode - El código generado.
 */
async function sendOTP(to, otpCode) {
    // Definimos el cuerpo del mensaje
    const body = `Gasolineras Pantaleon: Tu código de verificación es ${otpCode}. NO lo compartas.`;

    // 1. Intentar enviar por WhatsApp (más económico y mejor UX)
    if (process.env.TWILIO_WHATSAPP_NUMBER) {
        try {
            await client.messages.create({
                from: 'whatsapp:' + process.env.TWILIO_WHATSAPP_NUMBER, // Tu número de WhatsApp Twilio
                to: 'whatsapp:' + to,
                body: body,
            });
            return { success: true, channel: 'whatsapp' };
        } catch (waError) {
            console.warn(`Fallo el envío por WhatsApp para ${to}. Intentando SMS.`, waError.message);
            // 2. Fallback a SMS si WhatsApp falla
            try {
                await client.messages.create({
                    from: process.env.TWILIO_PHONE_NUMBER_SMS, // Tu número de Twilio para SMS
                    to: to,
                    body: body,
                });
                return { success: true, channel: 'sms' };
            } catch (smsError) {
                console.error(`Fallo el envío por SMS para ${to}.`, smsError.message);
                throw new Error('No se pudo enviar el código de verificación por WhatsApp ni por SMS.');
            }
        }
    } else {
        throw new Error('Servicio de mensajería no configurado.');
    }
}

module.exports = {
    generateOTP,
    sendOTP
};