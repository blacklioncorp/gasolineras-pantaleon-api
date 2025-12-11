// src/routes/index.js (MODIFICAR este archivo)

const express = require('express');
const router = express.Router();

const authRoutes = require('./v1/auth.routes'); 
const clientRoutes = require('./v1/client.routes'); 
const transactionRoutes = require('./v1/transaction.routes'); // <-- AÑADIR esta línea
const adminRoutes = require('./v1/admin.routes');

router.use('/auth', authRoutes);
router.use('/clientes', clientRoutes); 
router.use('/transacciones', transactionRoutes); // <-- AÑADIR esta línea
router.use('/admin', adminRoutes);
// router.use('/admin', adminRoutes);

module.exports = router;