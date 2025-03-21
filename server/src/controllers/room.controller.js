const Room = require('../models/Room.model');
const Game = require('../models/Game.model');
const Task = require('../models/Task.model');
const qrcode = require('qrcode');

/**
 * Get all rooms for a game
 */
exports.getRoomsByGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const rooms = await Room.find({ gameId });
    
    res.status(200).json({ rooms });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ message: 'Error retrieving rooms', error: error.message });
  }
};

/**
 * Get a single room by ID
 */
exports.getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const room = await Room.findById(id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.status(200).json({ room });
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ message: 'Error retrieving room', error: error.message });
  }
};

/**
 * Create a new room
 */
exports.createRoom = async (req, res) => {
  try {
    const {
      name,
      description,
      gameId,
      homeAssistantEntities,
      imageUrl
    } = req.body;
    
    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Create new room
    const room = new Room({
      name,
      description,
      gameId,
      homeAssistantEntities: homeAssistantEntities || [],
      imageUrl
    });
    
    // Generate QR code for room
    room.generateQRCode();
    
    await room.save();
    
    // Add room to game's rooms array
    if (!game.rooms.includes(room._id)) {
      game.rooms.push(room._id);
      await game.save();
    }
    
    res.status(201).json({ 
      room,
      message: 'Room created successfully'
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Error creating room', error: error.message });
  }
};

/**
 * Update a room
 */
exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find room
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Only allow updates if game is in setup
    const game = await Game.findById(room.gameId);
    if (game.status !== 'setup') {
      return res.status(400).json({ message: 'Cannot update rooms after game has started' });
    }
    
    // Update room fields
    Object.keys(updateData).forEach(key => {
      if (key === 'homeAssistantEntities' && updateData[key]) {
        room.homeAssistantEntities = updateData[key];
      } else if (key !== 'gameId') { // Don't allow changing the game ID
        room[key] = updateData[key];
      }
    });
    
    await room.save();
    
    res.status(200).json({ 
      room,
      message: 'Room updated successfully'
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ message: 'Error updating room', error: error.message });
  }
};

/**
 * Delete a room
 */
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Only allow deletion if game is in setup
    const game = await Game.findById(room.gameId);
    if (game.status !== 'setup') {
      return res.status(400).json({ message: 'Cannot delete rooms after game has started' });
    }
    
    // Check if room has any associated tasks
    const taskCount = await Task.countDocuments({ room: id });
    if (taskCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete room that has ${taskCount} associated tasks. Delete tasks first.`
      });
    }
    
    // Remove room from game's rooms array
    game.rooms = game.rooms.filter(roomId => roomId.toString() !== id);
    await game.save();
    
    await room.deleteOne();
    
    res.status(200).json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ message: 'Error deleting room', error: error.message });
  }
};

/**
 * Generate QR code for a room
 */
exports.generateQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Generate or use existing QR code
    let qrCode = room.qrCode;
    if (!qrCode || req.query.regenerate === 'true') {
      qrCode = room.generateQRCode();
      await room.save();
    }
    
    // Generate QR code for room
    const qrCodeDataUrl = await qrcode.toDataURL(qrCode);
    
    res.status(200).json({ 
      qrCode: qrCodeDataUrl,
      code: qrCode
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ message: 'Error generating QR code', error: error.message });
  }
};

/**
 * Verify a room via QR code (for player location)
 */
exports.verifyRoomQrCode = async (req, res) => {
  try {
    const { code } = req.params;
    const { gameId } = req.query;
    const deviceId = req.deviceId;
    
    // Validate game exists
    if (!gameId) {
      return res.status(400).json({ message: 'Game ID is required' });
    }
    
    // Find player
    const Player = require('../models/Player.model');
    const player = await Player.findOne({ gameId, deviceId });
    if (!player) {
      return res.status(404).json({ message: 'Player not found in this game' });
    }
    
    // Find room with matching QR code
    const room = await Room.findOne({ 
      gameId,
      qrCode: code
    });
    
    if (!room) {
      return res.status(404).json({ message: 'Invalid QR code or room not found' });
    }
    
    // Update player's current room
    player.currentRoom = room._id;
    player.lastActiveAt = new Date();
    await player.save();
    
    res.status(200).json({ 
      message: 'Room location updated successfully',
      room: {
        id: room._id,
        name: room.name,
        description: room.description
      }
    });
  } catch (error) {
    console.error('Verify room QR code error:', error);
    res.status(500).json({ message: 'Error verifying room', error: error.message });
  }
};
