import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { SOCKET_URL } from '../config/api';

// Create Socket Context
const SocketContext = createContext();

// Custom hook to use the Socket Context
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  // State
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeGame, setActiveGame] = useState(null);
  const { token, isAuthenticated } = useAuth();

  // Connect to socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
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
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    // Set up event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
      
      // Authenticate admin as soon as socket connects
      socketInstance.emit('admin:auth', token);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Socket connection error. Trying to reconnect...');
    });

    // Admin authentication responses
    socketInstance.on('admin:auth:success', (data) => {
      console.log('Admin authenticated via socket:', data);
      toast.success('Real-time connection established');
    });

    socketInstance.on('admin:auth:error', (data) => {
      console.error('Admin socket authentication error:', data);
      toast.error('Real-time authentication failed');
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
  }, [isAuthenticated, token]);

  // Join a specific game room
  const joinGame = (gameId) => {
    if (!socket || !isConnected) {
      toast.error('Socket not connected');
      return;
    }

    socket.emit('admin:join:game', gameId);
    setActiveGame(gameId);
  };

  // Leave current game
  const leaveGame = () => {
    setActiveGame(null);
  };

  // Send game update
  const updateGameState = (gameId, status, message) => {
    if (!socket || !isConnected) {
      toast.error('Socket not connected');
      return;
    }

    socket.emit('game:update', { gameId, status, message });
  };

  // Send chat message
  const sendChatMessage = (gameId, message) => {
    if (!socket || !isConnected) {
      toast.error('Socket not connected');
      return;
    }

    socket.emit('chat:message', { gameId, message });
  };

  // Context value
  const value = {
    socket,
    isConnected,
    activeGame,
    joinGame,
    leaveGame,
    updateGameState,
    sendChatMessage
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
