// src/controllers/auth.controller.js

const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Controlador para la ruta POST /api/v1/auth/login
exports.login = async (req, res) => {
    const { usuario_login, password } = req.body;

    try {
        // 1. Buscar el usuario en la base de datos
        const user = await User.findByLogin(usuario_login);

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 2. Verificar la contraseña
        const isMatch = await User.comparePassword(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        // 3. Generar el Token de Acceso JWT
        const payload = {
            id: user.id,
            usuario_login: user.usuario_login,
            rol: user.rol,
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRATION_DAYS + 'd' } // '7d'
        );

        // 4. Responder con el token
        res.json({ 
            token, 
            user: {
                id: user.id,
                nombre_completo: user.nombre_completo,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

// ... Otros controladores (logout, register initial admin, etc.)