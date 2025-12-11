// src/controllers/admin.controller.js

const Client = require('../models/Client');
const Transaction = require('../models/Transaction');
const BusinessRule = require('../models/BusinessRule');
const User = require('../models/User'); // Asumimos que tienes un modelo User

/**
 * GET /api/v1/admin/summary
 * Obtiene las métricas clave para el Dashboard Administrativo.
 */
exports.getDashboardSummary = async (req, res) => {
    try {
        // Ejecutar todas las consultas en paralelo para mayor velocidad
        const [
            totalClients,
            transactionMetrics,
            userList
        ] = await Promise.all([
            Client.countTotalClients(),
            Transaction.getSummaryMetrics(),
            User.findAll() // Asume un método para listar usuarios
        ]);

        const summary = {
            total_clients: totalClients,
            // Los resultados de transactionMetrics ya vienen con formato decimal de la DB
            total_sales: parseFloat(transactionMetrics.total_sales),
            total_points_credited: parseFloat(transactionMetrics.total_points_credited),
            // Puedes añadir más métricas o los usuarios/transacciones más recientes aquí
            user_count: userList.length
        };

        res.status(200).json(summary);

    } catch (error) {
        console.error('Error al obtener el resumen del Dashboard:', error);
        res.status(500).json({ message: 'Error interno del servidor al cargar el resumen.' });
    }
};


// --- CONFIGURACIÓN (Reglas del Negocio) ---

/**
 * GET /api/v1/admin/rules
 * Obtiene la regla de porcentaje de recompensa actual.
 */
exports.getBusinessRule = async (req, res) => {
    try {
        const percentage = await BusinessRule.getCurrentPercentage();
        res.status(200).json({ porcentaje_recompensa: parseFloat(percentage) });
    } catch (error) {
        console.error('Error al obtener la regla de negocio:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * PUT /api/v1/admin/rules
 * Actualiza el porcentaje de recompensa.
 */
exports.updateBusinessRule = async (req, res) => {
    const { percentage } = req.body;
    // El ID del administrador lo obtenemos del token JWT
    const userId = req.user.id; 

    if (percentage === undefined || isNaN(parseFloat(percentage)) || parseFloat(percentage) < 0) {
        return res.status(400).json({ message: 'El porcentaje proporcionado no es válido.' });
    }
    
    try {
        const updatedRule = await BusinessRule.updatePercentage({ 
            percentage: parseFloat(percentage).toFixed(2), // Aseguramos 2 decimales
            userId 
        });

        res.status(200).json({ 
            message: 'Porcentaje de recompensa actualizado exitosamente.', 
            nueva_regla: parseFloat(updatedRule.porcentaje_recompensa)
        });

    } catch (error) {
        console.error('Error al actualizar la regla de negocio:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar la regla.' });
    }
};

// src/controllers/admin.controller.js (Añadir los siguientes métodos al final)

// ... resto del código (getDashboardSummary, getBusinessRule, updateBusinessRule)

// --- GESTIÓN DE USUARIOS (CRUD) ---

/**
 * GET /api/v1/admin/users
 * Lista todos los usuarios del sistema.
 */
exports.getUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al listar usuarios:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener la lista de usuarios.' });
    }
};

/**
 * GET /api/v1/admin/users/:id
 * Obtiene un usuario por ID.
 */
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};

/**
 * POST /api/v1/admin/users
 * Crea un nuevo usuario (Cajero o Administrador).
 */
exports.createUser = async (req, res) => {
    const { nombre_completo, usuario_login, password, rol } = req.body;

    if (!nombre_completo || !usuario_login || !password || !rol) {
        return res.status(400).json({ message: 'Faltan campos requeridos: nombre, login, password, rol.' });
    }
    
    const validRoles = ['ADMINISTRADOR', 'CAJERO'];
    if (!validRoles.includes(rol.toUpperCase())) {
        return res.status(400).json({ message: 'El rol proporcionado no es válido. Debe ser ADMINISTRADOR o CAJERO.' });
    }

    try {
        const existingUser = await User.findByLogin(usuario_login);
        if (existingUser) {
            return res.status(409).json({ message: 'El nombre de usuario (login) ya está en uso.' });
        }
        
        const newUser = await User.create({ nombre_completo, usuario_login, password, rol: rol.toUpperCase() });

        res.status(201).json({
            message: 'Usuario creado exitosamente.',
            user: {
                id: newUser.id,
                nombre_completo: newUser.nombre_completo,
                rol: newUser.rol
            }
        });

    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al crear usuario.' });
    }
};

/**
 * PUT /api/v1/admin/users/:id
 * Actualiza los datos de un usuario existente.
 */
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const dataToUpdate = req.body;

    try {
        const updatedUser = await User.update(id, dataToUpdate);

        if (!updatedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({
            message: 'Usuario actualizado exitosamente.',
            user: updatedUser
        });

    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al actualizar usuario.' });
    }
};

/**
 * DELETE /api/v1/admin/users/:id
 * Desactiva un usuario (Soft Delete).
 */
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    
    // El middleware ya verifica que sea un administrador.
    
    try {
        const deactivatedUser = await User.deactivate(id);

        if (!deactivatedUser) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({
            message: `Usuario ${deactivatedUser.id} desactivado exitosamente.`,
            user: deactivatedUser
        });

    } catch (error) {
        console.error('Error al desactivar usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al desactivar usuario.' });
    }
};