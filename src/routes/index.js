// src/routes/index.js (MODIFICAR este archivo)

const express = require('express');
const router = express.Router();

// Importa las rutas de autenticación
const authRoutes = require('./v1/auth.routes'); 
const clientRoutes = require('./v1/client.routes'); // <-- AÑADIR esta línea
// const adminRoutes = require('./v1/admin.routes'); // Se añadirán más tarde

// Define el prefijo para las rutas
router.use('/auth', authRoutes);
router.use('/clientes', clientRoutes); // <-- AÑADIR esta línea
// router.use('/admin', adminRoutes);

module.exports = router;