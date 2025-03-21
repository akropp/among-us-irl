import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from './PlayerContext';
import { SOCKET_URL } from '../config/api';

// Create Socket Context
const SocketContext = createContext();

// Custom hook to use the Socket Context
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  // Navigation
  const navigate = useNavigate();
  
  // State
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [playerLocations, setPlayerLocations] = useState({});
  const [deadBodies, setDeadBodies] = useState([]);
  const [visualEffects, setVisualEffects] = useState(null);
  
  // Player context
  const { 
    deviceId, 
    playerInfo, 
    gameInfo, 
    isRegistered,
    setPlayerInfo,
    setGameInfo,
    setPlayerTasks,
    setIsAlive,
    setGameStatus
  } = usePlayer();

  // Connect to socket when registered
  useEffect(() => {
    if (!isRegistered || !deviceId || !playerInfo) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Initialize socket connection
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Set up event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
      
      // Authenticate player as soon as socket connects
      socketInstance.emit('player:auth', deviceId);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Player authentication responses
    socketInstance.on('player:auth:success', (data) => {
      console.log('Player authenticated via socket');
    });

    socketInstance.on('player:auth:error', (data) => {
      console.error('Player socket authentication error:', data);
      toast.error('Connection error. Please rejoin the game.');
    });
    
    // Game state updates
    socketInstance.on('game:update', (data) => {
      console.log('Game update received:', data);
      if (data.game) {
        setGameInfo(data.game);
        setGameStatus(data.game.status);
        
        // Handle game status changes
        handleGameStatusChange(data.game.status);
      }
      
      if (data.message) {
        toast.info(data.message);
      }
    });
    
    // Player updates
    socketInstance.on('player:update', (data) => {
      console.log('Player update received:', data);
      if (data.player) {
        setPlayerInfo(data.player);
        
        // Update alive status if changed
        if (data.player.isAlive !== undefined) {
          setIsAlive(data.player.isAlive);
          
          // If player was killed, show death effect
          if (!data.player.isAlive && playerInfo?.isAlive) {
            triggerVisualEffect('killed');
          }
        }
      }
      
      if (data.tasks) {
        setPlayerTasks(data.tasks);
      }
    });
    
    // Chat messages
    socketInstance.on('chat:message', (data) => {
      setChatMessages(prevMessages => [...prevMessages, data]);
    });
    
    // Emergency meeting called
    socketInstance.on('emergency:meeting', (data) => {
      console.log('Emergency meeting called:', data);
      triggerVisualEffect('emergency');
      
      // Navigate to discussion screen
      setTimeout(() => {
        navigate('/game/discussion');
      }, 2000);
    });
    
    // Dead body reported
    socketInstance.on('body:reported', (data) => {
      console.log('Body reported:', data);
      triggerVisualEffect('report');
      
      // Navigate to discussion screen
      setTimeout(() => {
        navigate('/game/discussion');
      }, 2000);
    });
    
    // Player locations
    socketInstance.on('player:locations', (data) => {
      setPlayerLocations(data.locations);
    });
    
    // Dead body discovered
    socketInstance.on('body:discovered', (data) => {
      if (data.body && !deadBodies.some(body => body.playerId === data.body.playerId)) {
        setDeadBodies(prev => [...prev, data.body]);
      }
    });
    
    // Bodies cleaned up (after meeting)
    socketInstance.on('bodies:cleanup', () => {
      setDeadBodies([]);
    });
    
    // Voting results
    socketInstance.on('voting:results', (data) => {
      console.log('Voting results:', data);
      
      // Navigate to voting results screen
      if (window.location.pathname !== '/game/voting') {
        navigate('/game/voting');
      }
    });
    
    // Game end
    socketInstance.on('game:end', (data) => {
      console.log('Game ended:', data);
      navigate('/game/end');
    });
    
    // General error handling
    socketInstance.on('error', (data) => {
      console.error('Socket error:', data);
      toast.error(data.message || 'An error occurred');
    });

    // Set socket instance
    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isRegistered, deviceId, playerInfo?.gameId]);
  
  // Handle game status changes
  const handleGameStatusChange = (status) => {
    // Navigate based on game status
    switch (status) {
      case 'setup':
        navigate('/game/lobby');
        break;
      case 'in-progress':
        navigate('/game/tasks');
        break;
      case 'discussion':
        navigate('/game/discussion');
        break;
      case 'voting':
        navigate('/game/voting');
        break;
      case 'completed':
        navigate('/game/end');
        break;
      default:
        break;
    }
  };
  
  // Trigger visual effects
  const triggerVisualEffect = (effect) => {
    setVisualEffects(effect);
    
    // Clear effect after animation duration
    setTimeout(() => {
      setVisualEffects(null);
    }, 3000);
  };
  
  // Send chat message
  const sendChatMessage = (message) => {
    if (!socket || !isConnected) {
      toast.error('Not connected to game server');
      return;
    }
    
    socket.emit('chat:message', { 
      message,
      gameId: playerInfo.gameId
    });
  };
  
  // Update player location
  const emitLocation = (roomId) => {
    if (!socket || !isConnected) {
      return;
    }
    
    socket.emit('player:location', { roomId });
  };
  
  // Report a dead body
  const emitReportBody = (deadPlayerId) => {
    if (!socket || !isConnected) {
      toast.error('Not connected to game server');
      return;
    }
    
    socket.emit('player:report', { deadPlayerId });
  };
  
  // Call emergency meeting
  const emitEmergencyMeeting = () => {
    if (!socket || !isConnected) {
      toast.error('Not connected to game server');
      return;
    }
    
    socket.emit('player:emergency');
  };
  
  // Kill a player (impostor only)
  const emitKillPlayer = (targetPlayerId) => {
    if (!socket || !isConnected) {
      toast.error('Not connected to game server');
      return;
    }
    
    socket.emit('player:kill', { targetPlayerId });
  };
  
  // Submit vote
  const emitVote = (targetPlayerId) => {
    if (!socket || !isConnected) {
      toast.error('Not connected to game server');
      return;
    }
    
    socket.emit('player:vote', { targetPlayerId });
  };
  
  // Context value
  const value = {
    socket,
    isConnected,
    chatMessages,
    playerLocations,
    deadBodies,
    visualEffects,
    sendChatMessage,
    emitLocation,
    emitReportBody,
    emitEmergencyMeeting,
    emitKillPlayer,
    emitVote,
    triggerVisualEffect,
    setChatMessages
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
