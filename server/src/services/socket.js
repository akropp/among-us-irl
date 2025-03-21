const Player = require('../models/Player.model');
const Game = require('../models/Game.model');
const jwt = require('jsonwebtoken');

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'among-us-irl-secret';

/**
 * Socket.IO handler
 * @param {Object} io - Socket.IO server instance
 * @param {Object} socket - Socket connection
 */
module.exports = (io, socket) => {
  console.log(`New socket connection: ${socket.id}`);
  
  // Authenticate admin user via JWT token
  socket.on('admin:auth', async (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.isAdmin = true;
      
      socket.join('admin');
      console.log(`Admin authenticated: ${decoded.username}`);
      
      socket.emit('admin:auth:success', { 
        message: 'Authentication successful',
        user: {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role
        }
      });
    } catch (error) {
      console.error('Admin auth error:', error.message);
      socket.emit('admin:auth:error', { message: 'Authentication failed' });
    }
  });
  
  // Authenticate player via device ID
  socket.on('player:auth', async ({ deviceId, gameId }) => {
    try {
      if (!deviceId || !gameId) {
        return socket.emit('player:auth:error', { message: 'Device ID and Game ID are required' });
      }
      
      // Find player
      const player = await Player.findOne({ deviceId, gameId });
      if (!player) {
        return socket.emit('player:auth:error', { message: 'Player not found' });
      }
      
      socket.playerId = player._id;
      socket.gameId = gameId;
      socket.deviceId = deviceId;
      socket.isPlayer = true;
      
      // Join game room
      socket.join(`game:${gameId}`);
      socket.join(`player:${player._id}`);
      
      console.log(`Player authenticated: ${player.name}`);
      
      // Mark player as connected
      player.connected = true;
      player.lastActiveAt = new Date();
      await player.save();
      
      socket.emit('player:auth:success', { 
        message: 'Authentication successful',
        player: {
          id: player._id,
          name: player.name,
          color: player.color
        }
      });
      
      // Notify admin that player connected
      io.to('admin').emit('player:connected', {
        gameId,
        playerId: player._id,
        name: player.name
      });
    } catch (error) {
      console.error('Player auth error:', error.message);
      socket.emit('player:auth:error', { message: 'Authentication failed' });
    }
  });
  
  // Admin joins a specific game channel
  socket.on('admin:join:game', async (gameId) => {
    if (!socket.isAdmin) {
      return socket.emit('error', { message: 'Authentication required' });
    }
    
    socket.join(`game:${gameId}`);
    console.log(`Admin joined game: ${gameId}`);
    
    socket.emit('admin:join:game:success', { message: 'Joined game successfully' });
  });
  
  // Game state updates
  socket.on('game:update', async (data) => {
    if (!socket.isAdmin) {
      return socket.emit('error', { message: 'Authentication required' });
    }
    
    const { gameId, status, message } = data;
    
    // Broadcast game update to all players in the game
    io.to(`game:${gameId}`).emit('game:update', {
      status,
      message,
      timestamp: new Date()
    });
    
    console.log(`Game ${gameId} update: ${status}`);
  });
  
  // Meeting called
  socket.on('game:meeting', async (data) => {
    try {
      const { gameId, calledBy, type, deadPlayer } = data;
      let messageText = '';
      
      // Get the game
      const game = await Game.findById(gameId);
      if (!game) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      // Update game status
      game.status = 'discussion';
      game.currentMeeting = {
        calledBy,
        startTime: new Date(),
        endTime: new Date(Date.now() + (game.settings.discussionTime * 1000)),
        votes: {}
      };
      
      await game.save();
      
      // Get caller name
      const Player = require('../models/Player.model');
      const caller = await Player.findById(calledBy);
      
      if (type === 'emergency') {
        messageText = `${caller.name} called an emergency meeting!`;
      } else if (type === 'report' && deadPlayer) {
        const deadPlayerObj = await Player.findById(deadPlayer);
        messageText = `${caller.name} reported ${deadPlayerObj.name}'s body!`;
      }
      
      // Broadcast meeting to all players in the game
      io.to(`game:${gameId}`).emit('game:meeting', {
        meetingId: game.currentMeeting._id || Date.now().toString(),
        calledBy: {
          id: caller._id,
          name: caller.name,
          color: caller.color
        },
        type,
        message: messageText,
        discussionTime: game.settings.discussionTime,
        votingTime: game.settings.votingTime,
        startTime: game.currentMeeting.startTime,
        endTime: game.currentMeeting.endTime
      });
      
      console.log(`Meeting called in game ${gameId} by ${caller.name}`);
      
      // Schedule transition to voting phase
      setTimeout(async () => {
        // Verify game is still in discussion
        const currentGame = await Game.findById(gameId);
        if (currentGame && currentGame.status === 'discussion') {
          currentGame.status = 'voting';
          await currentGame.save();
          
          io.to(`game:${gameId}`).emit('game:voting', {
            meetingId: currentGame.currentMeeting._id || Date.now().toString(),
            message: 'Discussion time is over. Time to vote!',
            votingTime: currentGame.settings.votingTime,
            endTime: new Date(Date.now() + (currentGame.settings.votingTime * 1000))
          });
          
          console.log(`Game ${gameId} moved to voting phase`);
          
          // Schedule end of voting phase
          setTimeout(async () => {
            await handleVotingEnd(io, gameId);
          }, currentGame.settings.votingTime * 1000);
        }
      }, game.settings.discussionTime * 1000);
    } catch (error) {
      console.error('Meeting error:', error);
      socket.emit('error', { message: 'Error processing meeting', error: error.message });
    }
  });
  
  // Player votes
  socket.on('player:vote', async (data) => {
    try {
      if (!socket.isPlayer) {
        return socket.emit('error', { message: 'Authentication required' });
      }
      
      const { targetId } = data;
      const playerId = socket.playerId;
      const gameId = socket.gameId;
      
      // Get the game
      const game = await Game.findById(gameId);
      if (!game) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      // Make sure game is in discussion or voting phase
      if (game.status !== 'discussion' && game.status !== 'voting') {
        return socket.emit('error', { message: 'Game is not in voting phase' });
      }
      
      // Get the voting player
      const voter = await Player.findById(playerId);
      if (!voter) {
        return socket.emit('error', { message: 'Player not found' });
      }
      
      // Ensure player is alive
      if (!voter.isAlive) {
        return socket.emit('error', { message: 'Dead players cannot vote' });
      }
      
      // Get meeting ID
      const meetingId = game.currentMeeting._id || Date.now().toString();
      
      // Record vote
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
      
      game.currentMeeting.votes[playerId.toString()] = targetId === 'skip' ? null : targetId;
      await game.save();
      
      // Get target name for logging
      let targetName = 'Skip';
      if (targetId && targetId !== 'skip') {
        const target = await Player.findById(targetId);
        if (target) {
          targetName = target.name;
        }
      }
      
      // Add vote log
      game.addLog({
        type: 'vote',
        player: playerId,
        target: targetId === 'skip' ? null : targetId,
        message: `Player ${voter.name} voted for ${targetName}`
      });
      
      await game.save();
      
      // Broadcast vote to admin and the voting player
      io.to('admin').emit('player:vote', {
        gameId,
        playerId,
        playerName: voter.name,
        targetId: targetId === 'skip' ? null : targetId,
        targetName
      });
      
      socket.emit('player:vote:success', {
        message: `Vote for ${targetName} recorded`,
        targetId: targetId === 'skip' ? null : targetId,
        targetName
      });
      
      // Check if all alive players have voted
      const alivePlayers = await Player.find({ gameId, isAlive: true });
      const allVoted = alivePlayers.every(p => 
        p.voteSubmitted && p.voteSubmitted.meetingId === meetingId
      );
      
      if (allVoted) {
        console.log(`All players voted in game ${gameId}`);
        
        // End voting immediately if everyone has voted
        await handleVotingEnd(io, gameId);
      } else {
        // Just notify admin about vote counts
        const votedCount = alivePlayers.filter(p => 
          p.voteSubmitted && p.voteSubmitted.meetingId === meetingId
        ).length;
        
        io.to('admin').emit('voting:status', {
          gameId,
          votedCount,
          totalPlayers: alivePlayers.length,
          allVoted: false
        });
      }
    } catch (error) {
      console.error('Vote error:', error);
      socket.emit('error', { message: 'Error processing vote', error: error.message });
    }
  });
  
  // Task completion
  socket.on('player:task:complete', async (data) => {
    try {
      if (!socket.isPlayer) {
        return socket.emit('error', { message: 'Authentication required' });
      }
      
      const { taskId } = data;
      const playerId = socket.playerId;
      const gameId = socket.gameId;
      
      // Get the player
      const player = await Player.findById(playerId).populate('assignedTasks');
      if (!player) {
        return socket.emit('error', { message: 'Player not found' });
      }
      
      // Get the task
      const Task = require('../models/Task.model');
      const task = await Task.findById(taskId);
      if (!task) {
        return socket.emit('error', { message: 'Task not found' });
      }
      
      // Ensure task is assigned to player
      if (!player.assignedTasks.some(t => t._id.toString() === taskId)) {
        return socket.emit('error', { message: 'Task not assigned to player' });
      }
      
      // Ensure task is not already completed
      if (player.completedTasks.some(ct => ct.task.toString() === taskId)) {
        return socket.emit('error', { message: 'Task already completed' });
      }
      
      // Mark task as completed
      player.completeTask(taskId);
      await player.save();
      
      // Add task completion log to game
      const game = await Game.findById(gameId);
      game.addLog({
        type: 'task',
        player: playerId,
        task: taskId,
        message: `Player ${player.name} completed task: ${task.name}`
      });
      
      await game.save();
      
      // Notify player task is complete
      socket.emit('player:task:complete:success', {
        message: 'Task completed successfully',
        taskId,
        taskName: task.name
      });
      
      // Notify admin about task completion
      io.to('admin').emit('player:task:complete', {
        gameId,
        playerId,
        playerName: player.name,
        taskId,
        taskName: task.name
      });
      
      // Check if all tasks are completed (for crewmates only)
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
        
        // Broadcast game end to all players
        io.to(`game:${gameId}`).emit('game:end', {
          message: 'Crewmates win by completing all tasks!',
          winner: 'crewmates',
          reason: 'tasks'
        });
        
        console.log(`Game ${gameId} ended - Crewmates win by tasks`);
      } else {
        // Calculate task completion percentage and notify everyone
        const totalTasks = crewmates.reduce((sum, p) => sum + p.assignedTasks.length, 0);
        const completedTasks = crewmates.reduce((sum, p) => sum + p.completedTasks.length, 0);
        const taskCompletion = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        io.to(`game:${gameId}`).emit('game:tasks:update', {
          taskCompletion,
          completedTasks,
          totalTasks
        });
      }
    } catch (error) {
      console.error('Task completion error:', error);
      socket.emit('error', { message: 'Error completing task', error: error.message });
    }
  });
  
  // Player killed
  socket.on('player:kill', async (data) => {
    try {
      if (!socket.isPlayer) {
        return socket.emit('error', { message: 'Authentication required' });
      }
      
      const { targetId } = data;
      const killerId = socket.playerId;
      const gameId = socket.gameId;
      
      // Get the killer
      const killer = await Player.findById(killerId);
      if (!killer) {
        return socket.emit('error', { message: 'Player not found' });
      }
      
      // Ensure killer is an impostor
      if (killer.role !== 'impostor') {
        return socket.emit('error', { message: 'Only impostors can kill' });
      }
      
      // Ensure killer is alive
      if (!killer.isAlive) {
        return socket.emit('error', { message: 'Dead impostors cannot kill' });
      }
      
      // Get the target
      const target = await Player.findById(targetId);
      if (!target) {
        return socket.emit('error', { message: 'Target player not found' });
      }
      
      // Ensure target is alive
      if (!target.isAlive) {
        return socket.emit('error', { message: 'Cannot kill a player who is already dead' });
      }
      
      // Get the game
      const game = await Game.findById(gameId);
      if (!game) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      // Check kill cooldown
      if (!killer.canKill(game.settings.killCooldown)) {
        const cooldownLeft = Math.ceil((killer.lastKill.getTime() + (game.settings.killCooldown * 1000) - Date.now()) / 1000);
        return socket.emit('error', { message: `Kill cooldown active. ${cooldownLeft} seconds remaining.` });
      }
      
      // Perform the kill
      target.isAlive = false;
      killer.lastKill = new Date();
      
      await target.save();
      await killer.save();
      
      // Add kill log
      game.addLog({
        type: 'kill',
        player: killerId,
        target: targetId,
        room: killer.currentRoom,
        message: `Player ${killer.name} killed ${target.name}`
      });
      
      await game.save();
      
      // Notify killer that kill was successful
      socket.emit('player:kill:success', {
        message: 'Player killed successfully',
        targetId,
        targetName: target.name
      });
      
      // Notify target that they were killed
      io.to(`player:${targetId}`).emit('player:killed', {
        killerId,
        killerName: killer.name
      });
      
      // Notify admin about the kill
      io.to('admin').emit('player:kill', {
        gameId,
        killerId,
        killerName: killer.name,
        targetId,
        targetName: target.name
      });
      
      // Trigger Home Assistant event if configured
      try {
        const axios = require('axios');
        const HA_URL = process.env.HOME_ASSISTANT_URL;
        const HA_TOKEN = process.env.HOME_ASSISTANT_TOKEN;
        
        if (HA_URL && HA_TOKEN) {
          await axios.post(
            `${HA_URL}/api/events/among_us_kill`,
            {
              killer: killer.name,
              victim: target.name,
              room: killer.currentRoom
            },
            {
              headers: {
                Authorization: `Bearer ${HA_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      } catch (haError) {
        console.error('Home Assistant event error:', haError);
      }
      
      // Check if impostors win by outnumbering crewmates
      const alivePlayers = await Player.find({ gameId, isAlive: true });
      const aliveImpostors = alivePlayers.filter(p => p.role === 'impostor');
      const aliveCrewmates = alivePlayers.filter(p => p.role === 'crewmate');
      
      if (aliveImpostors.length >= aliveCrewmates.length) {
        // Impostors win
        game.status = 'completed';
        game.endTime = new Date();
        
        // Add game end log
        game.addLog({
          type: 'game-end',
          message: 'Game ended. Impostors win by eliminating crewmates!'
        });
        
        await game.save();
        
        // Broadcast game end to all players
        io.to(`game:${gameId}`).emit('game:end', {
          message: 'Impostors win by eliminating crewmates!',
          winner: 'impostors',
          reason: 'elimination'
        });
        
        console.log(`Game ${gameId} ended - Impostors win by elimination`);
      }
    } catch (error) {
      console.error('Kill error:', error);
      socket.emit('error', { message: 'Error processing kill', error: error.message });
    }
  });
  
  // Chat message
  socket.on('chat:message', async (data) => {
    try {
      const { gameId, message } = data;
      
      // Only allow chat during meetings
      const game = await Game.findById(gameId);
      if (!game) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      if (game.status !== 'discussion' && game.status !== 'voting') {
        return socket.emit('error', { message: 'Chat is only available during meetings' });
      }
      
      let sender = null;
      
      // Get sender info
      if (socket.isAdmin) {
        sender = {
          id: 'admin',
          name: 'Game Admin',
          color: 'gray',
          isAdmin: true
        };
      } else if (socket.isPlayer) {
        const player = await Player.findById(socket.playerId);
        if (!player) {
          return socket.emit('error', { message: 'Player not found' });
        }
        
        // Only alive players can chat
        if (!player.isAlive) {
          return socket.emit('error', { message: 'Dead players cannot chat' });
        }
        
        sender = {
          id: player._id,
          name: player.name,
          color: player.color,
          isAdmin: false
        };
      } else {
        return socket.emit('error', { message: 'Authentication required' });
      }
      
      // Broadcast message to all players in the game
      io.to(`game:${gameId}`).emit('chat:message', {
        sender,
        message,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Chat error:', error);
      socket.emit('error', { message: 'Error sending message', error: error.message });
    }
  });
  
  // Disconnect handler
  socket.on('disconnect', async () => {
    try {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // If player disconnected, update player status
      if (socket.isPlayer && socket.playerId && socket.gameId) {
        const player = await Player.findById(socket.playerId);
        if (player) {
          player.connected = false;
          await player.save();
          
          // Notify admin that player disconnected
          io.to('admin').emit('player:disconnected', {
            gameId: socket.gameId,
            playerId: socket.playerId,
            name: player.name
          });
        }
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  });
};

/**
 * Handle the end of a voting phase
 * @param {Object} io - Socket.IO server instance
 * @param {String} gameId - Game ID
 */
async function handleVotingEnd(io, gameId) {
  try {
    // Get the game
    const game = await Game.findById(gameId);
    if (!game || game.status !== 'voting' && game.status !== 'discussion') {
      return; // Game already moved on
    }
    
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
    
    let ejectedPlayer = null;
    let gameEnded = false;
    let winnerTeam = null;
    let endReason = null;
    
    if (ejectedId !== 'skip') {
      // Eject the player
      ejectedPlayer = await Player.findById(ejectedId);
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
        gameEnded = true;
        winnerTeam = 'crewmates';
        endReason = 'ejection';
        
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
          gameEnded = true;
          winnerTeam = 'impostors';
          endReason = 'elimination';
          
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
    
    await game.save();
    
    // Notify players of voting results
    if (ejectedPlayer) {
      const wasImpostor = ejectedPlayer.role === 'impostor';
      
      io.to(`game:${gameId}`).emit('game:ejection', {
        ejectedPlayer: {
          id: ejectedPlayer._id,
          name: ejectedPlayer.name,
          color: ejectedPlayer.color,
          wasImpostor
        },
        votes
      });
      
      // Trigger Home Assistant event if configured
      try {
        const axios = require('axios');
        const HA_URL = process.env.HOME_ASSISTANT_URL;
        const HA_TOKEN = process.env.HOME_ASSISTANT_TOKEN;
        
        if (HA_URL && HA_TOKEN) {
          await axios.post(
            `${HA_URL}/api/events/among_us_ejection`,
            {
              player: ejectedPlayer.name,
              was_impostor: wasImpostor
            },
            {
              headers: {
                Authorization: `Bearer ${HA_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      } catch (haError) {
        console.error('Home Assistant event error:', haError);
      }
    } else {
      io.to(`game:${gameId}`).emit('game:ejection', {
        ejectedPlayer: null,
        message: 'No one was ejected',
        votes
      });
    }
    
    // If game ended, send game end notification
    if (gameEnded) {
      io.to(`game:${gameId}`).emit('game:end', {
        message: winnerTeam === 'crewmates' ? 
          'Crewmates win by ejecting all impostors!' :
          'Impostors win by eliminating crewmates!',
        winner: winnerTeam,
        reason: endReason
      });
      
      console.log(`Game ${gameId} ended - ${winnerTeam} win by ${endReason}`);
      
      // Trigger Home Assistant event if configured
      try {
        const axios = require('axios');
        const HA_URL = process.env.HOME_ASSISTANT_URL;
        const HA_TOKEN = process.env.HOME_ASSISTANT_TOKEN;
        
        if (HA_URL && HA_TOKEN) {
          await axios.post(
            `${HA_URL}/api/events/among_us_game_end`,
            {
              winner: winnerTeam,
              reason: endReason
            },
            {
              headers: {
                Authorization: `Bearer ${HA_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      } catch (haError) {
        console.error('Home Assistant event error:', haError);
      }
    } else {
      // Game continues
      io.to(`game:${gameId}`).emit('game:continue', {
        message: 'Meeting ended, continue with tasks',
        status: 'in-progress'
      });
    }
  } catch (error) {
    console.error('Voting end error:', error);
  }
}
