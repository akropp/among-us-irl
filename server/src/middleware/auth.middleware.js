const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'among-us-irl-secret';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by id
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid token, user not found' });
    }
    
    // Attach user info to request
    req.user = {
      id: user._id,
      username: user.username,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Role-based authorization middleware
 * Checks if user has the required role
 */
exports.authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
    }

    next();
  };
};

/**
 * Player authentication middleware
 * Used for player routes that don't require full admin authentication
 */
exports.playerAuth = async (req, res, next) => {
  try {
    // Get device ID from header
    const deviceId = req.header('X-Device-Id');
    
    if (!deviceId) {
      return res.status(401).json({ message: 'Device ID required' });
    }

    // Attach device ID to request
    req.deviceId = deviceId;
    
    next();
  } catch (error) {
    console.error('Player auth middleware error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};
