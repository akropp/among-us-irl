import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { API_URL } from '../config/api';

// Create the Player Context
const PlayerContext = createContext();

// Custom hook to use the Player Context
export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider = ({ children }) => {
  // State
  const [loading, setLoading] = useState(true);
  const [playerInfo, setPlayerInfo] = useState(null);
  const [gameInfo, setGameInfo] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [deviceId, setDeviceId] = useState(localStorage.getItem('deviceId') || null);
  const [playerTasks, setPlayerTasks] = useState([]);
  const [isAlive, setIsAlive] = useState(true);
  const [isImpostor, setIsImpostor] = useState(false);
  const [gameStatus, setGameStatus] = useState(null);
  const [emergencyMeetingsLeft, setEmergencyMeetingsLeft] = useState(0);
  const [killCooldown, setKillCooldown] = useState(0);

  // Set up axios with device ID header
  useEffect(() => {
    if (deviceId) {
      axios.defaults.headers.common['Device-ID'] = deviceId;
    } else {
      delete axios.defaults.headers.common['Device-ID'];
    }
  }, [deviceId]);

  // Check player registration
  const checkRegistration = async () => {
    setLoading(true);
    
    try {
      // If no device ID, player is not registered
      if (!deviceId) {
        setIsRegistered(false);
        setLoading(false);
        return false;
      }
      
      // Check if device ID is registered with a player
      const response = await axios.get(`${API_URL}/players/info`);
      
      if (response.data && response.data.player) {
        // Player is registered
        setPlayerInfo(response.data.player);
        setGameInfo(response.data.game);
        setPlayerTasks(response.data.tasks || []);
        setIsAlive(response.data.player.isAlive);
        setIsImpostor(response.data.player.role === 'impostor');
        setGameStatus(response.data.game.status);
        setEmergencyMeetingsLeft(response.data.player.emergencyMeetingsLeft || 0);
        setIsRegistered(true);
        return true;
      } else {
        // Device ID exists but no player registration found
        setIsRegistered(false);
        return false;
      }
    } catch (error) {
      console.error('Registration check error:', error);
      // Clear invalid device ID if server returns 401
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('deviceId');
        setDeviceId(null);
      }
      setIsRegistered(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Generate a new device ID
  const generateDeviceId = () => {
    const newDeviceId = uuidv4();
    localStorage.setItem('deviceId', newDeviceId);
    setDeviceId(newDeviceId);
    axios.defaults.headers.common['Device-ID'] = newDeviceId;
    return newDeviceId;
  };

  // Join a game
  const joinGame = async (gameCode, playerName, playerColor) => {
    try {
      setLoading(true);
      
      // Ensure we have a device ID
      const currentDeviceId = deviceId || generateDeviceId();
      
      // Join the game
      const response = await axios.post(`${API_URL}/players/join`, {
        gameCode,
        playerName,
        playerColor
      });
      
      // Update state with player and game info
      setPlayerInfo(response.data.player);
      setGameInfo(response.data.game);
      setIsRegistered(true);
      
      toast.success('Successfully joined the game!');
      return true;
    } catch (error) {
      console.error('Join game error:', error);
      
      let errorMsg = 'Failed to join the game. Please try again.';
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }
      
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Leave the current game
  const leaveGame = async () => {
    try {
      setLoading(true);
      
      // Leave the game
      await axios.post(`${API_URL}/players/leave`);
      
      // Clear player state
      setPlayerInfo(null);
      setGameInfo(null);
      setPlayerTasks([]);
      setIsRegistered(false);
      
      // Keep the device ID for future games
      
      toast.info('You have left the game.');
      return true;
    } catch (error) {
      console.error('Leave game error:', error);
      
      let errorMsg = 'Failed to leave the game. Please try again.';
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }
      
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Complete a task
  const completeTask = async (taskId, verificationMethod, verificationData) => {
    try {
      const response = await axios.post(`${API_URL}/players/tasks/${taskId}/complete`, {
        verificationMethod,
        verificationData
      });
      
      // Update tasks list
      const updatedTasks = playerTasks.map(task => 
        task._id === taskId ? { ...task, completed: true } : task
      );
      
      setPlayerTasks(updatedTasks);
      
      toast.success('Task completed successfully!');
      return response.data;
    } catch (error) {
      console.error('Task completion error:', error);
      
      let errorMsg = 'Failed to complete task. Please try again.';
      if (error.response && error.response.data) {
        errorMsg = error.response.data.message || errorMsg;
      }
      
      toast.error(errorMsg);
      throw error;
    }
  };

  // Get tasks for the player
  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_URL}/players/tasks`);
      setPlayerTasks(response.data);
      return response.data;
    } catch (error) {
      console.error('Fetch tasks error:', error);
      toast.error('Failed to fetch tasks');
      return [];
    }
  };

  // Report dead body
  const reportDeadBody = async (deadPlayerId) => {
    try {
      await axios.post(`${API_URL}/players/report`, { deadPlayerId });
      toast.info('Dead body reported! Emergency meeting started.');
      return true;
    } catch (error) {
      console.error('Report body error:', error);
      toast.error('Failed to report body');
      return false;
    }
  };

  // Call emergency meeting
  const callEmergencyMeeting = async () => {
    try {
      await axios.post(`${API_URL}/players/emergency`);
      setEmergencyMeetingsLeft(prev => Math.max(0, prev - 1));
      toast.info('Emergency meeting called!');
      return true;
    } catch (error) {
      console.error('Emergency meeting error:', error);
      toast.error('Failed to call emergency meeting');
      return false;
    }
  };

  // Kill another player (impostor only)
  const killPlayer = async (targetPlayerId) => {
    try {
      await axios.post(`${API_URL}/players/kill`, { targetPlayerId });
      setKillCooldown(gameInfo.killCooldown || 30);
      toast.info('Player killed!');
      return true;
    } catch (error) {
      console.error('Kill player error:', error);
      toast.error('Failed to kill player');
      return false;
    }
  };

  // Vote during discussion
  const votePlayer = async (targetPlayerId) => {
    try {
      await axios.post(`${API_URL}/players/vote`, { targetPlayerId });
      toast.info('Vote submitted!');
      return true;
    } catch (error) {
      console.error('Vote error:', error);
      toast.error('Failed to submit vote');
      return false;
    }
  };

  // Update player location
  const updateLocation = async (roomId) => {
    try {
      await axios.post(`${API_URL}/players/location`, { roomId });
      return true;
    } catch (error) {
      console.error('Location update error:', error);
      return false;
    }
  };

  // Context value
  const value = {
    loading,
    playerInfo,
    gameInfo,
    isRegistered,
    deviceId,
    playerTasks,
    isAlive,
    isImpostor,
    gameStatus,
    emergencyMeetingsLeft,
    killCooldown,
    checkRegistration,
    generateDeviceId,
    joinGame,
    leaveGame,
    completeTask,
    fetchTasks,
    reportDeadBody,
    callEmergencyMeeting,
    killPlayer,
    votePlayer,
    updateLocation,
    setPlayerInfo,
    setGameInfo,
    setPlayerTasks,
    setIsAlive,
    setGameStatus
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
};
