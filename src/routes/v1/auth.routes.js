// src/routes/v1/auth.routes.js

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');

// POST /api/v1/auth/login
router.post('/login', authController.login);

// router.post('/logout', authController.logout); // Implementar más tarde

module.exports = router;