const express = require('express');
const router = express.Router();
const playerController = require('../controllers/player.controller');
const { playerAuth } = require('../middleware/auth.middleware');

// Apply player authentication middleware to all routes
router.use(playerAuth);

// Join a game as a player
router.post('/join', playerController.joinGame);

// Leave a game
router.post('/:gameId/leave', playerController.leaveGame);

// Get player info
router.get('/:gameId/info', playerController.getPlayerInfo);

// Complete a task
router.post('/:gameId/tasks/:taskId/complete', playerController.completeTask);

// Update player location
router.post('/:gameId/location/:roomId', playerController.updateLocation);

// Report a kill or call emergency meeting
router.post('/:gameId/report', playerController.reportOrEmergency);

// Kill another player
router.post('/:gameId/kill/:targetId', playerController.killPlayer);

// Submit a vote
router.post('/:gameId/vote', playerController.submitVote);

module.exports = router;
