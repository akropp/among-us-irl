const axios = require('axios');
const mqtt = require('mqtt');

// Home Assistant API endpoint and token from environment variables
const HA_URL = process.env.HOME_ASSISTANT_URL || 'http://homeassistant:8123';
const HA_TOKEN = process.env.HOME_ASSISTANT_TOKEN || '';

// MQTT connection settings
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://mqtt';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';

let mqttClient = null;

/**
 * Connect to MQTT broker
 */
const connectMqtt = () => {
  if (mqttClient) return mqttClient;
  
  // Connect to MQTT broker
  mqttClient = mqtt.connect(MQTT_BROKER, {
    username: MQTT_USERNAME,
    password: MQTT_PASSWORD
  });
  
  mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
  });
  
  mqttClient.on('error', (error) => {
    console.error('MQTT error:', error);
  });
  
  return mqttClient;
};

/**
 * Get Home Assistant status
 */
exports.getStatus = async (req, res) => {
  try {
    // Check if Home Assistant is configured
    if (!HA_TOKEN) {
      return res.status(200).json({ 
        configured: false,
        message: 'Home Assistant is not configured'
      });
    }
    
    // Call Home Assistant API to check status
    const response = await axios.get(`${HA_URL}/api/`, {
      headers: {
        Authorization: `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.status(200).json({ 
      configured: true, 
      status: 'connected',
      version: response.data.version,
      message: 'Home Assistant is connected'
    });
  } catch (error) {
    console.error('Home Assistant status error:', error);
    
    res.status(200).json({ 
      configured: !!HA_TOKEN,
      status: 'disconnected',
      message: 'Unable to connect to Home Assistant',
      error: error.message
    });
  }
};

/**
 * Get entities from Home Assistant
 */
exports.getEntities = async (req, res) => {
  try {
    // Check if Home Assistant is configured
    if (!HA_TOKEN) {
      return res.status(400).json({ message: 'Home Assistant is not configured' });
    }
    
    // Call Home Assistant API to get entities
    const response = await axios.get(`${HA_URL}/api/states`, {
      headers: {
        Authorization: `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Filter and format entities
    const entities = response.data.map(entity => ({
      entity_id: entity.entity_id,
      state: entity.state,
      attributes: entity.attributes,
      last_updated: entity.last_updated,
      domain: entity.entity_id.split('.')[0]
    }));
    
    res.status(200).json({ entities });
  } catch (error) {
    console.error('Get Home Assistant entities error:', error);
    res.status(500).json({ message: 'Error retrieving entities', error: error.message });
  }
};

/**
 * Get entity state
 */
exports.getEntityState = async (req, res) => {
  try {
    // Check if Home Assistant is configured
    if (!HA_TOKEN) {
      return res.status(400).json({ message: 'Home Assistant is not configured' });
    }
    
    const { entityId } = req.params;
    
    // Call Home Assistant API to get entity state
    const response = await axios.get(`${HA_URL}/api/states/${entityId}`, {
      headers: {
        Authorization: `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    res.status(200).json({ 
      entity_id: response.data.entity_id,
      state: response.data.state,
      attributes: response.data.attributes,
      last_updated: response.data.last_updated
    });
  } catch (error) {
    console.error('Get entity state error:', error);
    
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'Entity not found' });
    }
    
    res.status(500).json({ message: 'Error retrieving entity state', error: error.message });
  }
};

/**
 * Call a service in Home Assistant
 */
exports.callService = async (req, res) => {
  try {
    // Check if Home Assistant is configured
    if (!HA_TOKEN) {
      return res.status(400).json({ message: 'Home Assistant is not configured' });
    }
    
    const { domain, service } = req.params;
    const serviceData = req.body;
    
    // Call Home Assistant API to call a service
    const response = await axios.post(
      `${HA_URL}/api/services/${domain}/${service}`,
      serviceData,
      {
        headers: {
          Authorization: `Bearer ${HA_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.status(200).json({ 
      success: true,
      message: `Service ${domain}.${service} called successfully`,
      result: response.data
    });
  } catch (error) {
    console.error('Call service error:', error);
    
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.status(500).json({ message: 'Error calling service', error: error.message });
  }
};

/**
 * Subscribe to an MQTT topic
 */
exports.subscribeToTopic = async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }
    
    // Connect to MQTT broker if not already connected
    const client = connectMqtt();
    
    // Subscribe to topic
    client.subscribe(topic, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error subscribing to topic', error: err.message });
      }
      
      res.status(200).json({ 
        success: true,
        message: `Subscribed to topic: ${topic}`
      });
    });
  } catch (error) {
    console.error('Subscribe to topic error:', error);
    res.status(500).json({ message: 'Error subscribing to topic', error: error.message });
  }
};

/**
 * Publish to an MQTT topic
 */
exports.publishToTopic = async (req, res) => {
  try {
    const { topic, message, retain } = req.body;
    
    if (!topic || !message) {
      return res.status(400).json({ message: 'Topic and message are required' });
    }
    
    // Connect to MQTT broker if not already connected
    const client = connectMqtt();
    
    // Publish to topic
    client.publish(topic, typeof message === 'string' ? message : JSON.stringify(message), {
      retain: !!retain
    }, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error publishing to topic', error: err.message });
      }
      
      res.status(200).json({ 
        success: true,
        message: `Published to topic: ${topic}`
      });
    });
  } catch (error) {
    console.error('Publish to topic error:', error);
    res.status(500).json({ message: 'Error publishing to topic', error: error.message });
  }
};

/**
 * Trigger a game event in Home Assistant
 */
exports.triggerGameEvent = async (req, res) => {
  try {
    // Check if Home Assistant is configured
    if (!HA_TOKEN) {
      return res.status(400).json({ message: 'Home Assistant is not configured' });
    }
    
    const { eventType } = req.params;
    const eventData = req.body;
    
    // Map event type to appropriate Home Assistant action
    let serviceData = {};
    let domain = 'script';
    let service = '';
    
    switch (eventType) {
      case 'game-start':
        service = 'game_start';
        break;
      case 'game-end':
        service = 'game_end';
        break;
      case 'emergency-meeting':
        service = 'emergency_meeting';
        break;
      case 'impostor-kill':
        service = 'impostor_kill';
        break;
      case 'task-complete':
        service = 'task_complete';
        break;
      case 'player-ejected':
        service = 'player_ejected';
        break;
      default:
        service = 'generic_event';
        serviceData.event_type = eventType;
    }
    
    // Add event data to service data
    serviceData = {
      ...serviceData,
      ...eventData
    };
    
    // Call Home Assistant API to trigger the event
    try {
      await axios.post(
        `${HA_URL}/api/services/${domain}/${service}`,
        serviceData,
        {
          headers: {
            Authorization: `Bearer ${HA_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.status(200).json({ 
        success: true,
        message: `Game event '${eventType}' triggered successfully`
      });
    } catch (serviceError) {
      // If the script doesn't exist, try using the events interface instead
      if (serviceError.response && serviceError.response.status === 404) {
        await axios.post(
          `${HA_URL}/api/events/among_us_${eventType.replace('-', '_')}`,
          serviceData,
          {
            headers: {
              Authorization: `Bearer ${HA_TOKEN}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        res.status(200).json({ 
          success: true,
          message: `Game event '${eventType}' fired as event`
        });
      } else {
        throw serviceError;
      }
    }
  } catch (error) {
    console.error('Trigger game event error:', error);
    res.status(500).json({ message: 'Error triggering game event', error: error.message });
  }
};
