// src/middlewares/auth.middleware.js

const jwt = require('jsonwebtoken');

// Middleware para verificar el token JWT y adjuntar los datos del usuario
exports.verifyToken = (req, res, next) => {
    // 1. Obtener el token del encabezado (Header)
    // El token generalmente viene en el formato: Authorization: Bearer <token>
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
        return res.status(401).json({ message: 'Acceso denegado. No se proporcionó un token.' });
    }

    const token = authHeader.replace('Bearer ', '');

    // 2. Verificar si el token existe
    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado. Token mal formado.' });
    }

    try {
        // 3. Verificar y decodificar el token usando el secreto
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Adjuntar los datos del usuario decodificado (id, rol) al objeto de solicitud (req)
        req.user = decoded; 
        
        // 4. Continuar con el siguiente middleware o controlador
        next();
        
    } catch (error) {
        // Si el token es inválido (expirado, modificado, etc.)
        res.status(401).json({ message: 'Token inválido o expirado.' });
    }
};


/**
 * Middleware para restringir el acceso basado en el rol del usuario.
 * @param {string[]} allowedRoles - Un array de roles permitidos (ej: ['ADMINISTRADOR', 'CAJERO']).
 */
exports.restrictTo = (allowedRoles) => {
    return (req, res, next) => {
        // Asegurarse de que verifyToken se haya ejecutado primero (req.user debe existir)
        if (!req.user || !req.user.rol || !allowedRoles.includes(req.user.rol)) {
            return res.status(403).json({ 
                message: 'Acceso prohibido. No tiene los permisos necesarios.' 
            });
        }
        next();
    };
};