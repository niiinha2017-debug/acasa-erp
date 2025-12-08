const express = require('express');
const AuthController = require('../controllers/auth.controller');

const router = express.Router();

// Rota pública para login
router.post('/login', AuthController.login);

module.exports = router;
