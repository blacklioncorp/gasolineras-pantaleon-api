// src/routes/v1/transaction.routes.js

const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/transaction.controller');
const { verifyToken, restrictTo } = require('../../middlewares/auth.middleware');

// POST /api/v1/transacciones/abono
// Acceso solo para Cajeros (quienes registran ventas) y Administradores
router.post(
    '/abono', 
    verifyToken,
    restrictTo(['ADMINISTRADOR', 'CAJERO']), 
    transactionController.recordTransaction
);


// POST /api/v1/transacciones/canje <-- AÑADIR NUEVA RUTA
router.post(
    '/canje', 
    verifyToken,
    restrictTo(['ADMINISTRADOR', 'CAJERO']), 
    transactionController.recordRedemption
);

// GET /api/v1/transacciones (Historial para el Admin - se implementará más tarde)
// router.get('/', verifyToken, restrictTo(['ADMINISTRADOR']), transactionController.getHistory); 

router.get(
    '/', 
    verifyToken, 
    restrictTo(['ADMINISTRADOR']), 
    transactionController.getHistory
);

module.exports = router;