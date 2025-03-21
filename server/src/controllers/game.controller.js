const Game = require('../models/Game.model');
const Player = require('../models/Player.model');
const Task = require('../models/Task.model');
const Room = require('../models/Room.model');
const qrcode = require('qrcode');

/**
 * Get all games
 */
exports.getAllGames = async (req, res) => {
  try {
    const games = await Game.find()
      .sort({ createdAt: -1 })
      .select('name code status startTime endTime currentRound createdAt');
    
    res.status(200).json({ games });
  } catch (error) {
    console.error('Get all games error:', error);
    res.status(500).json({ message: 'Error retrieving games', error: error.message });
  }
};

/**
 * Get game by ID
 */
exports.getGameById = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
      .populate({
        path: 'players',
        select: 'name color role isAlive currentRoom completedTasks'
      })
      .populate({
        path: 'rooms',
        select: 'name description'
      });
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.status(200).json({ game });
  } catch (error) {
    console.error('Get game by ID error:', error);
    res.status(500).json({ message: 'Error retrieving game', error: error.message });
  }
};

/**
 * Create a new game
 */
exports.createGame = async (req, res) => {
  try {
    const { name, settings } = req.body;
    
    const game = new Game({
      name,
      settings,
      createdBy: req.user.id
    });
    
    await game.save();
    
    res.status(201).json({ 
      game,
      message: 'Game created successfully'
    });
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ message: 'Error creating game', error: error.message });
  }
};

/**
 * Update a game
 */
exports.updateGame = async (req, res) => {
  try {
    const { name, settings, status } = req.body;
    
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Only allow updates if game is in setup or completed
    if (game.status !== 'setup' && game.status !== 'completed' && status) {
      return res.status(400).json({ message: 'Cannot update game in progress' });
    }
    
    if (name) game.name = name;
    if (settings) game.settings = { ...game.settings, ...settings };
    if (status) game.status = status;
    
    await game.save();
    
    res.status(200).json({ 
      game,
      message: 'Game updated successfully'
    });
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ message: 'Error updating game', error: error.message });
  }
};

/**
 * Delete a game
 */
exports.deleteGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Delete related data
    await Player.deleteMany({ gameId: game._id });
    await Task.deleteMany({ gameId: game._id });
    await Room.deleteMany({ gameId: game._id });
    
    await game.deleteOne();
    
    res.status(200).json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Delete game error:', error);
    res.status(500).json({ message: 'Error deleting game', error: error.message });
  }
};

/**
 * Start a game
 */
exports.startGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    if (game.status !== 'setup') {
      return res.status(400).json({ message: 'Game already started' });
    }
    
    // Get all players
    const players = await Player.find({ gameId: game._id });
    if (players.length < 4) {
      return res.status(400).json({ message: 'Need at least 4 players to start' });
    }
    
    // Get all tasks
    const tasks = await Task.find({ gameId: game._id });
    if (tasks.length < players.length) {
      return res.status(400).json({ message: 'Not enough tasks for all players' });
    }
    
    // Assign roles (imposter or crewmate)
    const imposterCount = game.settings.imposterCount;
    if (imposterCount >= players.length / 2) {
      return res.status(400).json({ message: 'Too many imposters for player count' });
    }
    
    // Shuffle players array for random role assignment
    const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
    
    // Assign imposters and crewmates
    for (let i = 0; i < shuffledPlayers.length; i++) {
      const player = shuffledPlayers[i];
      if (i < imposterCount) {
        player.role = 'impostor';
      } else {
        player.role = 'crewmate';
      }
      
      // Assign tasks to players
      // Imposters get fake tasks, crewmates get real ones
      const playerTasks = [];
      const taskCount = player.role === 'impostor' ? 3 : 4; // Adjust task count as needed
      
      // Get random tasks
      const shuffledTasks = [...tasks].sort(() => 0.5 - Math.random());
      for (let j = 0; j < taskCount && j < shuffledTasks.length; j++) {
        playerTasks.push(shuffledTasks[j]._id);
      }
      
      player.assignedTasks = playerTasks;
      player.completedTasks = [];
      player.isAlive = true;
      player.emergencyMeetingsLeft = game.settings.emergencyMeetings;
      
      await player.save();
    }
    
    // Update game status
    game.status = 'in-progress';
    game.startTime = new Date();
    game.currentRound = 1;
    
    // Add game start log
    game.addLog({
      type: 'game-start',
      message: `Game started with ${players.length} players and ${imposterCount} imposters`
    });
    
    await game.save();
    
    res.status(200).json({ 
      game,
      message: 'Game started successfully'
    });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({ message: 'Error starting game', error: error.message });
  }
};

/**
 * End a game
 */
exports.endGame = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    if (game.status === 'completed') {
      return res.status(400).json({ message: 'Game already ended' });
    }
    
    // Calculate results
    const players = await Player.find({ gameId: game._id });
    const imposters = players.filter(p => p.role === 'impostor');
    const crewmates = players.filter(p => p.role === 'crewmate');
    
    const aliveImposters = imposters.filter(p => p.isAlive);
    const aliveCrewmates = crewmates.filter(p => p.isAlive);
    
    let winner = null;
    if (aliveImposters.length === 0) {
      winner = 'crewmates';
    } else if (aliveImposters.length >= aliveCrewmates.length) {
      winner = 'imposters';
    }
    
    // Update game status
    game.status = 'completed';
    game.endTime = new Date();
    
    // Add game end log
    game.addLog({
      type: 'game-end',
      message: winner ? `Game ended. ${winner} win!` : 'Game ended without a winner'
    });
    
    await game.save();
    
    res.status(200).json({ 
      game,
      winner,
      message: 'Game ended successfully'
    });
  } catch (error) {
    console.error('End game error:', error);
    res.status(500).json({ message: 'Error ending game', error: error.message });
  }
};

/**
 * Generate a QR code for game joining
 */
exports.generateQRCode = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const joinUrl = `${req.protocol}://${req.get('host')}/join?code=${game.code}`;
    
    const qrCodeDataUrl = await qrcode.toDataURL(joinUrl);
    
    res.status(200).json({ 
      qrCode: qrCodeDataUrl,
      joinUrl,
      code: game.code
    });
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ message: 'Error generating QR code', error: error.message });
  }
};

/**
 * Get game statistics
 */
exports.getGameStats = async (req, res) => {
  try {
    const game = await Game.findById(req.params.id);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const players = await Player.find({ gameId: game._id })
      .populate('completedTasks.task')
      .populate('assignedTasks');
    
    const stats = {
      totalPlayers: players.length,
      alivePlayers: players.filter(p => p.isAlive).length,
      deadPlayers: players.filter(p => !p.isAlive).length,
      imposters: players.filter(p => p.role === 'impostor').length,
      crewmates: players.filter(p => p.role === 'crewmate').length,
      taskCompletion: 0,
      playerStats: players.map(p => ({
        id: p._id,
        name: p.name,
        color: p.color,
        role: p.role,
        isAlive: p.isAlive,
        tasksCompleted: p.completedTasks.length,
        totalTasks: p.assignedTasks.length,
        completionPercentage: p.assignedTasks.length ? 
          Math.round((p.completedTasks.length / p.assignedTasks.length) * 100) : 0
      }))
    };
    
    // Calculate overall task completion percentage (for crewmates only)
    const crewmates = players.filter(p => p.role === 'crewmate');
    const totalCrewmateTasks = crewmates.reduce((sum, p) => sum + p.assignedTasks.length, 0);
    const completedCrewmateTasks = crewmates.reduce((sum, p) => sum + p.completedTasks.length, 0);
    
    stats.taskCompletion = totalCrewmateTasks ? 
      Math.round((completedCrewmateTasks / totalCrewmateTasks) * 100) : 0;
    
    res.status(200).json({ stats });
  } catch (error) {
    console.error('Get game stats error:', error);
    res.status(500).json({ message: 'Error retrieving game statistics', error: error.message });
  }
};
