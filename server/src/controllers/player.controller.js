const Player = require('../models/Player.model');
const Game = require('../models/Game.model');
const Task = require('../models/Task.model');
const Room = require('../models/Room.model');

/**
 * Join a game as a player
 */
exports.joinGame = async (req, res) => {
  try {
    const { gameCode, playerName, color } = req.body;
    const deviceId = req.deviceId;
    
    if (!gameCode || !playerName || !color || !deviceId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Find game by code
    const game = await Game.findOne({ code: gameCode.toUpperCase() });
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if game is in setup phase
    if (game.status !== 'setup') {
      return res.status(400).json({ message: 'Cannot join a game that has already started' });
    }
    
    // Check if player already exists in this game with this device
    let player = await Player.findOne({ gameId: game._id, deviceId });
    
    if (player) {
      // Update existing player
      player.name = playerName;
      player.color = color;
      player.connected = true;
      player.lastActiveAt = new Date();
    } else {
      // Check if color is already taken
      const colorTaken = await Player.findOne({ gameId: game._id, color });
      if (colorTaken) {
        return res.status(400).json({ message: 'Color already taken' });
      }
      
      // Create new player
      player = new Player({
        name: playerName,
        color,
        deviceId,
        gameId: game._id
      });
      
      // Add player to game
      game.players.push(player._id);
      await game.save();
      
      // Add join log
      game.addLog({
        type: 'join',
        player: player._id,
        message: `Player ${playerName} joined the game`
      });
      await game.save();
    }
    
    await player.save();
    
    res.status(200).json({ 
      player,
      game: {
        id: game._id,
        name: game.name,
        code: game.code,
        status: game.status
      }
    });
  } catch (error) {
    console.error('Join game error:', error);
    res.status(500).json({ message: 'Error joining game', error: error.message });
  }
};

/**
 * Leave a game
 */
exports.leaveGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const deviceId = req.deviceId;
    
    // Find player
    const player = await Player.findOne({ gameId, deviceId });
    if (!player) {
      return res.status(404).json({ message: 'Player not found in this game' });
    }
    
    // Find game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // If game is in setup, remove player
    if (game.status === 'setup') {
      // Remove player from game
      game.players = game.players.filter(p => p.toString() !== player._id.toString());
      
      // Add leave log
      game.addLog({
        type: 'leave',
        player: player._id,
        message: `Player ${player.name} left the game`
      });
      
      await game.save();
      await player.deleteOne();
    } else {
      // If game is in progress, just mark as disconnected
      player.connected = false;
      await player.save();
    }
    
    res.status(200).json({ message: 'Left game successfully' });
  } catch (error) {
    console.error('Leave game error:', error);
    res.status(500).json({ message: 'Error leaving game', error: error.message });
  }
};

/**
 * Get player info
 */
exports.getPlayerInfo = async (req, res) => {
  try {
    const { gameId } = req.params;
    const deviceId = req.deviceId;
    
    // Find player
    const player = await Player.findOne({ gameId, deviceId })
      .populate('assignedTasks')
      .populate('completedTasks.task')
      .populate('currentRoom');
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found in this game' });
    }
    
    // Find game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Get all rooms for the game
    const rooms = await Room.find({ gameId });
    
    // Get all other players
    const allPlayers = await Player.find({ gameId })
      .select('name color isAlive currentRoom');
    
    const playerInfo = {
      id: player._id,
      name: player.name,
      color: player.color,
      role: player.role,
      isAlive: player.isAlive,
      tasks: player.assignedTasks.map(task => ({
        id: task._id,
        name: task.name,
        description: task.description,
        room: task.room,
        type: task.type,
        completed: player.completedTasks.some(ct => ct.task._id.toString() === task._id.toString())
      })),
      emergencyMeetingsLeft: player.emergencyMeetingsLeft,
      currentRoom: player.currentRoom,
      gameStatus: game.status,
      canCallKill: player.role === 'impostor' && player.isAlive && player.canKill(game.settings.killCooldown),
      otherPlayers: allPlayers.filter(p => p._id.toString() !== player._id.toString()),
      rooms
    };
    
    // Update last active timestamp
    player.lastActiveAt = new Date();
    await player.save();
    
    res.status(200).json({ player: playerInfo });
  } catch (error) {
    console.error('Get player info error:', error);
    res.status(500).json({ message: 'Error getting player info', error: error.message });
  }
};

/**
 * Complete a task
 */
exports.completeTask = async (req, res) => {
  try {
    const { gameId, taskId } = req.params;
    const deviceId = req.deviceId;
    
    // Find player
    const player = await Player.findOne({ gameId, deviceId });
    if (!player) {
      return res.status(404).json({ message: 'Player not found in this game' });
    }
    
    // Find game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if game is in progress
    if (game.status !== 'in-progress') {
      return res.status(400).json({ message: 'Game is not in progress' });
    }
    
    // Check if player is alive
    if (!player.isAlive) {
      return res.status(400).json({ message: 'Dead players cannot complete tasks' });
    }
    
    // Find task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Check if task is assigned to this player
    if (!player.assignedTasks.includes(taskId)) {
      return res.status(400).json({ message: 'Task not assigned to this player' });
    }
    
    // Check if task is already completed
    if (player.completedTasks.some(ct => ct.task.toString() === taskId)) {
      return res.status(400).json({ message: 'Task already completed' });
    }
    
    // Complete task
    player.completeTask(taskId);
    
    // Add task completion log
    game.addLog({
      type: 'task',
      player: player._id,
      task: task._id,
      message: `Player ${player.name} completed task: ${task.name}`
    });
    
    await player.save();
    await game.save();
    
    // Check if all crewmate tasks are completed
    const crewmates = await Player.find({ gameId, role: 'crewmate' });
    const allTasksCompleted = crewmates.every(p => p.hasCompletedAllTasks());
    
    if (allTasksCompleted) {
      // Crewmates win by task completion
      game.status = 'completed';
      game.endTime = new Date();
      
      // Add game end log
      game.addLog({
        type: 'game-end',
        message: 'Game ended. Crewmates win by completing all tasks!'
      });
      
      await game.save();
    }
    
    res.status(200).json({ 
      message: 'Task completed successfully',
      gameOver: allTasksCompleted,
      winner: allTasksCompleted ? 'crewmates' : null
    });
  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ message: 'Error completing task', error: error.message });
  }
};

/**
 * Update player location
 */
exports.updateLocation = async (req, res) => {
  try {
    const { gameId, roomId } = req.params;
    const deviceId = req.deviceId;
    
    // Find player
    const player = await Player.findOne({ gameId, deviceId });
    if (!player) {
      return res.status(404).json({ message: 'Player not found in this game' });
    }
    
    // Find game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if game is in progress
    if (game.status !== 'in-progress') {
      return res.status(400).json({ message: 'Game is not in progress' });
    }
    
    // Find room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if room belongs to this game
    if (room.gameId.toString() !== gameId) {
      return res.status(400).json({ message: 'Room does not belong to this game' });
    }
    
    // Update player location
    player.currentRoom = roomId;
    player.lastActiveAt = new Date();
    
    await player.save();
    
    res.status(200).json({ 
      message: 'Location updated successfully',
      room: {
        id: room._id,
        name: room.name
      }
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ message: 'Error updating location', error: error.message });
  }
};

/**
 * Report a kill or call emergency meeting
 */
exports.reportOrEmergency = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { type, deadPlayerId } = req.body;
    const deviceId = req.deviceId;
    
    if (!['report', 'emergency'].includes(type)) {
      return res.status(400).json({ message: 'Invalid report type' });
    }
    
    // Find player
    const player = await Player.findOne({ gameId, deviceId });
    if (!player) {
      return res.status(404).json({ message: 'Player not found in this game' });
    }
    
    // Find game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if game is in progress
    if (game.status !== 'in-progress') {
      return res.status(400).json({ message: 'Game is not in progress' });
    }
    
    // Check if player is alive
    if (!player.isAlive) {
      return res.status(400).json({ message: 'Dead players cannot report or call emergency meetings' });
    }
    
    if (type === 'emergency') {
      // Check if player has emergency meetings left
      if (player.emergencyMeetingsLeft <= 0) {
        return res.status(400).json({ message: 'No emergency meetings left' });
      }
      
      // Decrement emergency meetings
      player.emergencyMeetingsLeft -= 1;
      await player.save();
      
      // Add emergency meeting log
      game.addLog({
        type: 'meeting',
        player: player._id,
        room: player.currentRoom,
        message: `Player ${player.name} called an emergency meeting`
      });
    } else if (type === 'report') {
      // Check if dead player ID is provided
      if (!deadPlayerId) {
        return res.status(400).json({ message: 'Dead player ID is required for reports' });
      }
      
      // Find dead player
      const deadPlayer = await Player.findById(deadPlayerId);
      if (!deadPlayer) {
        return res.status(404).json({ message: 'Dead player not found' });
      }
      
      // Check if dead player is actually dead
      if (deadPlayer.isAlive) {
        return res.status(400).json({ message: 'Cannot report a player who is not dead' });
      }
      
      // Add report log
      game.addLog({
        type: 'report',
        player: player._id,
        target: deadPlayer._id,
        room: player.currentRoom,
        message: `Player ${player.name} reported ${deadPlayer.name}'s body`
      });
    }
    
    // Change game status to discussion
    game.status = 'discussion';
    game.currentMeeting = {
      calledBy: player._id,
      startTime: new Date(),
      endTime: new Date(Date.now() + (game.settings.discussionTime * 1000)),
      votes: {}
    };
    
    await game.save();
    
    res.status(200).json({ 
      message: type === 'emergency' ? 'Emergency meeting called' : 'Body reported',
      meeting: {
        calledBy: player.name,
        discussionTime: game.settings.discussionTime,
        startTime: game.currentMeeting.startTime,
        endTime: game.currentMeeting.endTime
      }
    });
  } catch (error) {
    console.error('Report or emergency error:', error);
    res.status(500).json({ message: 'Error reporting body or calling emergency meeting', error: error.message });
  }
};

/**
 * Kill another player
 */
exports.killPlayer = async (req, res) => {
  try {
    const { gameId, targetId } = req.params;
    const deviceId = req.deviceId;
    
    // Find player (killer)
    const killer = await Player.findOne({ gameId, deviceId });
    if (!killer) {
      return res.status(404).json({ message: 'Player not found in this game' });
    }
    
    // Find game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if game is in progress
    if (game.status !== 'in-progress') {
      return res.status(400).json({ message: 'Game is not in progress' });
    }
    
    // Check if player is an impostor
    if (killer.role !== 'impostor') {
      return res.status(403).json({ message: 'Only impostors can kill' });
    }
    
    // Check if player is alive
    if (!killer.isAlive) {
      return res.status(400).json({ message: 'Dead impostors cannot kill' });
    }
    
    // Check kill cooldown
    if (!killer.canKill(game.settings.killCooldown)) {
      const cooldownLeft = Math.ceil((killer.lastKill.getTime() + (game.settings.killCooldown * 1000) - Date.now()) / 1000);
      return res.status(400).json({ message: `Kill cooldown active. ${cooldownLeft} seconds remaining.` });
    }
    
    // Find target player
    const target = await Player.findById(targetId);
    if (!target) {
      return res.status(404).json({ message: 'Target player not found' });
    }
    
    // Check if target is in the same game
    if (target.gameId.toString() !== gameId) {
      return res.status(400).json({ message: 'Target player is not in this game' });
    }
    
    // Check if target is alive
    if (!target.isAlive) {
      return res.status(400).json({ message: 'Cannot kill a player who is already dead' });
    }
    
    // Check if players are in the same room
    if (!killer.currentRoom || !target.currentRoom || 
        killer.currentRoom.toString() !== target.currentRoom.toString()) {
      return res.status(400).json({ message: 'Cannot kill a player in a different room' });
    }
    
    // Perform the kill
    target.isAlive = false;
    killer.lastKill = new Date();
    
    await target.save();
    await killer.save();
    
    // Add kill log
    game.addLog({
      type: 'kill',
      player: killer._id,
      target: target._id,
      room: killer.currentRoom,
      message: `Player ${killer.name} killed ${target.name}`
    });
    
    await game.save();
    
    // Check if impostors win by outnumbering crewmates
    const alivePlayers = await Player.find({ gameId, isAlive: true });
    const aliveImpostors = alivePlayers.filter(p => p.role === 'impostor');
    const aliveCrewmates = alivePlayers.filter(p => p.role === 'crewmate');
    
    let gameOver = false;
    let winner = null;
    
    if (aliveImpostors.length >= aliveCrewmates.length) {
      // Impostors win
      game.status = 'completed';
      game.endTime = new Date();
      gameOver = true;
      winner = 'impostors';
      
      // Add game end log
      game.addLog({
        type: 'game-end',
        message: 'Game ended. Impostors win by eliminating crewmates!'
      });
      
      await game.save();
    }
    
    res.status(200).json({ 
      message: 'Player killed successfully',
      victim: {
        id: target._id,
        name: target.name
      },
      gameOver,
      winner
    });
  } catch (error) {
    console.error('Kill player error:', error);
    res.status(500).json({ message: 'Error killing player', error: error.message });
  }
};

/**
 * Submit a vote
 */
exports.submitVote = async (req, res) => {
  try {
    const { gameId } = req.params;
    const { targetId } = req.body;
    const deviceId = req.deviceId;
    
    // Find player (voter)
    const voter = await Player.findOne({ gameId, deviceId });
    if (!voter) {
      return res.status(404).json({ message: 'Player not found in this game' });
    }
    
    // Find game
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Check if game is in voting phase
    if (game.status !== 'discussion' && game.status !== 'voting') {
      return res.status(400).json({ message: 'Game is not in discussion or voting phase' });
    }
    
    // Check if player is alive
    if (!voter.isAlive) {
      return res.status(400).json({ message: 'Dead players cannot vote' });
    }
    
    // Find target player (can be null for skip vote)
    let target = null;
    let targetName = 'Skip';
    
    if (targetId && targetId !== 'skip') {
      target = await Player.findById(targetId);
      if (!target) {
        return res.status(404).json({ message: 'Target player not found' });
      }
      
      // Check if target is in the same game
      if (target.gameId.toString() !== gameId) {
        return res.status(400).json({ message: 'Target player is not in this game' });
      }
      
      targetName = target.name;
    }
    
    // Check if meeting is still ongoing
    if (!game.currentMeeting) {
      return res.status(400).json({ message: 'No active meeting' });
    }
    
    const meetingId = game.currentMeeting._id || Date.now().toString();
    
    // Submit vote
    voter.voteSubmitted = {
      votedFor: targetId === 'skip' ? null : targetId,
      meetingId,
      timestamp: new Date()
    };
    
    await voter.save();
    
    // Add vote to meeting
    if (!game.currentMeeting.votes) {
      game.currentMeeting.votes = {};
    }
    
    game.currentMeeting.votes[voter._id.toString()] = targetId === 'skip' ? null : targetId;
    
    // Add vote log
    game.addLog({
      type: 'vote',
      player: voter._id,
      target: targetId === 'skip' ? null : targetId,
      message: `Player ${voter.name} voted for ${targetName}`
    });
    
    // Check if all alive players have voted
    const alivePlayers = await Player.find({ gameId, isAlive: true });
    const allVoted = alivePlayers.every(p => 
      p.voteSubmitted && p.voteSubmitted.meetingId === meetingId
    );
    
    if (allVoted) {
      // Change game status to voting completed
      game.status = 'voting';
      
      // Tally votes
      const votes = {};
      for (const voterId in game.currentMeeting.votes) {
        const votedForId = game.currentMeeting.votes[voterId];
        if (votedForId) {
          votes[votedForId] = (votes[votedForId] || 0) + 1;
        } else {
          votes['skip'] = (votes['skip'] || 0) + 1;
        }
      }
      
      // Find the player with most votes
      let maxVotes = 0;
      let ejectedId = 'skip';
      let tie = false;
      
      for (const id in votes) {
        if (votes[id] > maxVotes) {
          maxVotes = votes[id];
          ejectedId = id;
          tie = false;
        } else if (votes[id] === maxVotes) {
          tie = true;
        }
      }
      
      // If there's a tie, no one gets ejected
      if (tie) {
        ejectedId = 'skip';
      }
      
      if (ejectedId !== 'skip') {
        // Eject the player
        const ejectedPlayer = await Player.findById(ejectedId);
        ejectedPlayer.isAlive = false;
        await ejectedPlayer.save();
        
        // Add ejection log
        game.addLog({
          type: 'vote',
          target: ejectedPlayer._id,
          message: `Player ${ejectedPlayer.name} was ejected`
        });
        
        // Check if all impostors are ejected
        const aliveImpostors = await Player.countDocuments({ 
          gameId, 
          role: 'impostor',
          isAlive: true
        });
        
        if (aliveImpostors === 0) {
          // Crewmates win
          game.status = 'completed';
          game.endTime = new Date();
          
          // Add game end log
          game.addLog({
            type: 'game-end',
            message: 'Game ended. Crewmates win by ejecting all impostors!'
          });
        } else {
          // Check if impostors win by outnumbering crewmates
          const aliveCrewmates = await Player.countDocuments({ 
            gameId, 
            role: 'crewmate',
            isAlive: true
          });
          
          if (aliveImpostors >= aliveCrewmates) {
            // Impostors win
            game.status = 'completed';
            game.endTime = new Date();
            
            // Add game end log
            game.addLog({
              type: 'game-end',
              message: 'Game ended. Impostors win by eliminating crewmates!'
            });
          } else {
            // Game continues
            game.status = 'in-progress';
            game.currentMeeting = null;
          }
        }
      } else {
        // No one was ejected, continue game
        game.status = 'in-progress';
        game.currentMeeting = null;
        
        // Add skip log
        game.addLog({
          type: 'vote',
          message: 'No one was ejected (tie or skipped)'
        });
      }
    }
    
    await game.save();
    
    res.status(200).json({
      message: 'Vote submitted successfully',
      allVoted,
      votedFor: targetName
    });
  } catch (error) {
    console.error('Submit vote error:', error);
    res.status(500).json({ message: 'Error submitting vote', error: error.message });
  }
};
