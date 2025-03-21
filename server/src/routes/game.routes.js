const express = require('express');
const router = express.Router();
const gameController = require('../controllers/game.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all games
router.get('/', gameController.getAllGames);

// Get game by ID
router.get('/:id', gameController.getGameById);

// Create a new game
router.post('/', gameController.createGame);

// Update a game
router.put('/:id', gameController.updateGame);

// Delete a game
router.delete('/:id', gameController.deleteGame);

// Start a game
router.post('/:id/start', gameController.startGame);

// End a game
router.post('/:id/end', gameController.endGame);

// Generate QR code for game joining
router.get('/:id/qrcode', gameController.generateQRCode);

// Get game statistics
router.get('/:id/stats', gameController.getGameStats);

module.exports = router;
