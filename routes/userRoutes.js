const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController.js');
const auth = require('../middlewares/authMiddleware.js');

// Rotas protegidas para CRUD de usuários (apenas administradores gerais)
router.get('/', auth, userController.getAllUsers);
router.get('/:id', auth, userController.getUserById);
router.post('/', auth, userController.createUser);
router.put('/:id', auth, userController.updateUser);
router.delete('/:id', auth, userController.deleteUser);

module.exports = router;
