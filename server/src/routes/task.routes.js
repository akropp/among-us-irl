const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const { authenticate, playerAuth } = require('../middleware/auth.middleware');

// Admin routes with JWT authentication
router.get('/game/:gameId', authenticate, taskController.getTasksByGame);
router.get('/:id', authenticate, taskController.getTaskById);
router.post('/', authenticate, taskController.createTask);
router.put('/:id', authenticate, taskController.updateTask);
router.delete('/:id', authenticate, taskController.deleteTask);
router.get('/:id/qrcode', authenticate, taskController.generateQRCode);

// Player routes with device authentication
router.get('/verify/:code', playerAuth, taskController.verifyTaskQrCode);

module.exports = router;
