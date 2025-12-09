const express = require('express');
const router = express.Router();
const ClienteController = require('../controllers/cliente.controller');

// Definição das Rotas
router.get('/', ClienteController.list);      // Listar todos
router.post('/', ClienteController.create);   // Criar novo
router.put('/:id', ClienteController.update); // Editar
router.delete('/:id', ClienteController.delete); // Excluir

module.exports = router;