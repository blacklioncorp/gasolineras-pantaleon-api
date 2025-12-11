// src/routes/v1/client.routes.js

const express = require('express');
const router = express.Router();
const clientController = require('../../controllers/client.controller');

// MIDDLEWARE: Se usaría aquí un middleware para verificar que el usuario logueado 
// (Cajero) tenga el rol CAJERO, pero lo implementaremos más tarde.

// B.1 Nuevo Cliente: Solicitar OTP
router.post('/solicitar-otp', clientController.solicitarOTP);

// B.2 Nuevo Cliente: Verificar OTP
router.post('/verificar-otp', clientController.verificarOTP);

// B.3 Nuevo Cliente: Registro Final
router.post('/', clientController.createClient);

// B.4 Consultar Saldo: REQUIERE TOKEN y debe ser solo para Cajeros o Administradores
router.get(
    '/:celular', 
    verifyToken, // <--- AÑADIR: Verifica que haya un token válido
    restrictTo(['ADMINISTRADOR', 'CAJERO']), // <--- AÑADIR: Restringe por rol
    clientController.getClientBalance
);

module.exports = router;