// src/services/otp.cache.js
// ADVERTENCIA: Esta solución no es escalable en Render con múltiples instancias.
// En producción, debe usarse Redis.

const otpCache = new Map();

/**
 * Guarda el OTP generado con un tiempo de expiración.
 * @param {string} key - El número de celular.
 * @param {string} otp - El código OTP.
 */
function setOTP(key, otp) {
    const expirationTime = Date.now() + (5 * 60 * 1000); // Expira en 5 minutos
    otpCache.set(key, { otp, expires: expirationTime });
    
    // Limpieza (opcional)
    setTimeout(() => {
        if (otpCache.get(key) && otpCache.get(key).otp === otp) {
            otpCache.delete(key);
            console.log(`OTP para ${key} expirado y eliminado.`);
        }
    }, expirationTime - Date.now());
}

/**
 * Obtiene y verifica el OTP.
 * @param {string} key - El número de celular.
 * @param {string} providedOtp - El código ingresado por el usuario.
 * @returns {boolean}
 */
function verifyOTP(key, providedOtp) {
    const data = otpCache.get(key);

    if (!data) {
        return false; // OTP no existe
    }

    if (Date.now() > data.expires) {
        otpCache.delete(key);
        return false; // OTP expirado
    }
    
    if (data.otp === providedOtp) {
        otpCache.delete(key); // OTP usado, se elimina
        return true;
    }
    
    return false; // OTP incorrecto
}

module.exports = { setOTP, verifyOTP };