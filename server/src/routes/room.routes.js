const express = require('express');
const router = express.Router();
const roomController = require('../controllers/room.controller');
const { authenticate, playerAuth } = require('../middleware/auth.middleware');

// Admin routes with JWT authentication
router.get('/game/:gameId', authenticate, roomController.getRoomsByGame);
router.get('/:id', authenticate, roomController.getRoomById);
router.post('/', authenticate, roomController.createRoom);
router.put('/:id', authenticate, roomController.updateRoom);
router.delete('/:id', authenticate, roomController.deleteRoom);
router.get('/:id/qrcode', authenticate, roomController.generateQRCode);

// Player routes with device authentication
router.get('/verify/:code', playerAuth, roomController.verifyRoomQrCode);

module.exports = router;
