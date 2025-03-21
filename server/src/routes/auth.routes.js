const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Register a new admin user
router.post('/register', authController.register);

// Login an existing user
router.post('/login', authController.login);

// Get current user information
router.get('/me', authenticate, authController.getMe);

// Validate token
router.get('/validate-token', authenticate, authController.validateToken);

module.exports = router;
