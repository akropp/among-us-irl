const Task = require('../models/Task.model');
const Game = require('../models/Game.model');
const Room = require('../models/Room.model');
const qrcode = require('qrcode');

/**
 * Get all tasks for a game
 */
exports.getTasksByGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const tasks = await Task.find({ gameId })
      .populate('room', 'name description');
    
    res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ message: 'Error retrieving tasks', error: error.message });
  }
};

/**
 * Get a single task by ID
 */
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id)
      .populate('room', 'name description');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.status(200).json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Error retrieving task', error: error.message });
  }
};

/**
 * Create a new task
 */
exports.createTask = async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      roomId,
      gameId,
      verificationMethod,
      verificationData,
      homeAssistantConfig
    } = req.body;
    
    // Validate game exists
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Validate room exists and belongs to the game
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (room.gameId.toString() !== gameId) {
      return res.status(400).json({ message: 'Room does not belong to this game' });
    }
    
    // Create new task
    const task = new Task({
      name,
      description,
      type,
      room: roomId,
      gameId,
      verificationMethod,
      verificationData,
      homeAssistantConfig: homeAssistantConfig || {}
    });
    
    // If verification method is QR code, generate one
    if (verificationMethod === 'qrcode') {
      task.generateQRCode();
    }
    
    await task.save();
    
    res.status(201).json({ 
      task,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

/**
 * Update a task
 */
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // If room is being updated, validate it
    if (updateData.roomId) {
      const room = await Room.findById(updateData.roomId);
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      // Update to use the actual room field name
      updateData.room = updateData.roomId;
      delete updateData.roomId;
    }
    
    // Find and update task
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Only allow updates if game is in setup
    const game = await Game.findById(task.gameId);
    if (game.status !== 'setup') {
      return res.status(400).json({ message: 'Cannot update tasks after game has started' });
    }
    
    // Update task fields
    Object.keys(updateData).forEach(key => {
      if (key === 'homeAssistantConfig' && updateData[key]) {
        task.homeAssistantConfig = {
          ...task.homeAssistantConfig,
          ...updateData[key]
        };
      } else {
        task[key] = updateData[key];
      }
    });
    
    // If verification method is changed to QR code, generate one
    if (updateData.verificationMethod === 'qrcode' && 
       (task.verificationMethod !== 'qrcode' || !task.verificationData)) {
      task.generateQRCode();
    }
    
    await task.save();
    
    res.status(200).json({ 
      task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

/**
 * Delete a task
 */
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Only allow deletion if game is in setup
    const game = await Game.findById(task.gameId);
    if (game.status !== 'setup') {
      return res.status(400).json({ message: 'Cannot delete tasks after game has started' });
    }
    
    await task.deleteOne();
    
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

/**
 * Generate QR code for a task
 */
exports.generateQRCode = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Generate or use existing verification data
    let verificationData = task.verificationData;
    if (!verificationData || req.query.regenerate === 'true') {
      verificationData = task.generateQRCode();
      await task.save();
    }
    
    // Generate QR code for task verification
    const qrCodeDataUrl = await qrcode.toDataURL(verificationData);
    
    res.status(200).json({ 
      qrCode: qrCodeDataUrl,
      verificationData
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ message: 'Error generating QR code', error: error.message });
  }
};

/**
 * Verify a task via QR code
 */
exports.verifyTaskQrCode = async (req, res) => {
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
    
    // Find task with matching verification data
    const task = await Task.findOne({ 
      gameId,
      verificationMethod: 'qrcode',
      verificationData: code
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Invalid QR code or task not found' });
    }
    
    // Check if task is assigned to player
    if (!player.assignedTasks.includes(task._id)) {
      return res.status(400).json({ message: 'Task not assigned to this player' });
    }
    
    // Check if task is already completed
    if (player.completedTasks.some(ct => ct.task.toString() === task._id.toString())) {
      return res.status(400).json({ message: 'Task already completed' });
    }
    
    // Complete the task
    player.completeTask(task._id);
    await player.save();
    
    // Add task completion log to game
    const game = await Game.findById(gameId);
    game.addLog({
      type: 'task',
      player: player._id,
      task: task._id,
      message: `Player ${player.name} completed task: ${task.name} (QR Code)`
    });
    await game.save();
    
    res.status(200).json({ 
      message: 'Task verified and completed successfully',
      task: {
        id: task._id,
        name: task.name
      }
    });
  } catch (error) {
    console.error('Verify task QR code error:', error);
    res.status(500).json({ message: 'Error verifying task', error: error.message });
  }
};
