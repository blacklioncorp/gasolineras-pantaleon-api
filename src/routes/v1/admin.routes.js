// src/routes/v1/admin.routes.js (VERIFICAR Y COMPLETAR)

const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin.controller');
const { verifyToken, restrictTo } = require('../../middlewares/auth.middleware');

// Middleware de protección: Todas las rutas de admin requieren token y rol ADMINISTRADOR
router.use(verifyToken, restrictTo(['ADMINISTRADOR']));

// ... RUTAS DE DASHBOARD Y CONFIGURACIÓN (existentes) ...


// --- GESTIÓN DE USUARIOS (CRUD) ---

// GET /api/v1/admin/users (Listar todos)
router.get('/users', adminController.getUsers); 

// POST /api/v1/admin/users (Crear nuevo)
router.post('/users', adminController.createUser);

// GET /api/v1/admin/users/:id (Obtener uno)
router.get('/users/:id', adminController.getUserById);

// PUT /api/v1/admin/users/:id (Actualizar)
router.put('/users/:id', adminController.updateUser);

// DELETE /api/v1/admin/users/:id (Desactivar)
router.delete('/users/:id', adminController.deleteUser);


module.exports = router;