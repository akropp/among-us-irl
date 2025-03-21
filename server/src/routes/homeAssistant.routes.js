const express = require('express');
const router = express.Router();
const homeAssistantController = require('../controllers/homeAssistant.controller');
const { authenticate } = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Get Home Assistant status
router.get('/status', homeAssistantController.getStatus);

// Get entities from Home Assistant
router.get('/entities', homeAssistantController.getEntities);

// Get entity state
router.get('/entities/:entityId', homeAssistantController.getEntityState);

// Call a service in Home Assistant
router.post('/services/:domain/:service', homeAssistantController.callService);

// Subscribe to an MQTT topic
router.post('/mqtt/subscribe', homeAssistantController.subscribeToTopic);

// Publish to an MQTT topic
router.post('/mqtt/publish', homeAssistantController.publishToTopic);

// Trigger a game event in Home Assistant
router.post('/events/:eventType', homeAssistantController.triggerGameEvent);

module.exports = router;
