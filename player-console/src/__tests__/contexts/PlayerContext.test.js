import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { PlayerProvider, usePlayer } from '../../contexts/PlayerContext';
import { SocketProvider } from '../../contexts/SocketContext';
import axios from 'axios';

// Mock axios
jest.mock('axios');

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const socket = {
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
  };
  return jest.fn(() => socket);
});

// Test component that uses the PlayerContext
const TestConsumer = () => {
  const { 
    playerInfo, 
    gameInfo, 
    isAlive, 
    isImpostor, 
    leaveGame, 
    emergencyMeetingsLeft,
    assignedTasks,
    completedTasks,
    callEmergencyMeeting
  } = usePlayer();
  
  return (
    <div>
      <div data-testid="player-name">{playerInfo?.name || 'No Player'}</div>
      <div data-testid="game-name">{gameInfo?.name || 'No Game'}</div>
      <div data-testid="is-alive">{isAlive ? 'Alive' : 'Dead'}</div>
      <div data-testid="is-impostor">{isImpostor ? 'Impostor' : 'Crewmate'}</div>
      <div data-testid="emergency-count">{emergencyMeetingsLeft}</div>
      <div data-testid="assigned-task-count">{assignedTasks?.length || 0}</div>
      <div data-testid="completed-task-count">{completedTasks?.length || 0}</div>
      <button data-testid="leave-game-btn" onClick={leaveGame}>Leave Game</button>
      <button data-testid="emergency-btn" onClick={callEmergencyMeeting}>Call Emergency Meeting</button>
    </div>
  );
};

// Setup test renderer with all required providers
const renderWithProviders = (initialProps = {}) => {
  return render(
    <SocketProvider>
      <PlayerProvider {...initialProps}>
        <TestConsumer />
      </PlayerProvider>
    </SocketProvider>
  );
};

describe('PlayerContext', () => {
  beforeEach(() => {
    // Reset mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock localStorage
    const mockPlayerData = {
      id: 'player123',
      name: 'TestPlayer',
      color: 1,
      gameId: 'game123',
      alive: true,
      role: 'crewmate'
    };
    
    const mockGameData = {
      id: 'game123',
      name: 'Test Game',
      code: 'ABCDEF',
      status: 'in-progress',
      emergencyMeetingsPerPlayer: 1
    };
    
    localStorage.getItem = jest.fn().mockImplementation((key) => {
      if (key === 'playerData') return JSON.stringify(mockPlayerData);
      if (key === 'gameData') return JSON.stringify(mockGameData);
      return null;
    });
  });
  
  it('provides player data from localStorage on initial load', () => {
    renderWithProviders();
    
    expect(screen.getByTestId('player-name')).toHaveTextContent('TestPlayer');
    expect(screen.getByTestId('game-name')).toHaveTextContent('Test Game');
    expect(screen.getByTestId('is-alive')).toHaveTextContent('Alive');
    expect(screen.getByTestId('is-impostor')).toHaveTextContent('Crewmate');
    expect(screen.getByTestId('emergency-count')).toHaveTextContent('1');
  });
  
  it('handles leaving a game correctly', async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    
    renderWithProviders();
    
    // Click the leave game button
    act(() => {
      screen.getByTestId('leave-game-btn').click();
    });
    
    // Verify axios was called correctly
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/players/leave'),
        expect.objectContaining({ playerId: 'player123' })
      );
    });
    
    // Check localStorage was cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith('playerData');
    expect(localStorage.removeItem).toHaveBeenCalledWith('gameData');
  });
  
  it('calculates isImpostor correctly based on role', () => {
    // Set player as impostor
    localStorage.getItem = jest.fn().mockImplementation((key) => {
      if (key === 'playerData') {
        return JSON.stringify({ 
          id: 'player123', 
          name: 'TestImpostor', 
          role: 'impostor' 
        });
      }
      if (key === 'gameData') {
        return JSON.stringify({ id: 'game123', name: 'Test Game' });
      }
      return null;
    });
    
    renderWithProviders();
    
    expect(screen.getByTestId('is-impostor')).toHaveTextContent('Impostor');
  });
  
  it('updates task completion status correctly', async () => {
    const mockTasks = [
      { id: 'task1', title: 'Task 1', completed: false },
      { id: 'task2', title: 'Task 2', completed: true },
      { id: 'task3', title: 'Task 3', completed: false }
    ];
    
    // Mock API response with tasks
    axios.get.mockResolvedValueOnce({ 
      data: { 
        success: true, 
        tasks: mockTasks
      } 
    });
    
    renderWithProviders();
    
    // Wait for task data to be loaded
    await waitFor(() => {
      expect(screen.getByTestId('assigned-task-count')).toHaveTextContent('3');
      expect(screen.getByTestId('completed-task-count')).toHaveTextContent('1');
    });
  });
  
  it('handles emergency meeting requests correctly', async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({ data: { success: true } });
    
    renderWithProviders();
    
    // Click the emergency meeting button
    act(() => {
      screen.getByTestId('emergency-btn').click();
    });
    
    // Verify axios was called correctly
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/players/emergency'),
        expect.objectContaining({ playerId: 'player123' })
      );
    });
  });
  
  it('handles player death correctly', async () => {
    renderWithProviders();
    
    // Initially player is alive
    expect(screen.getByTestId('is-alive')).toHaveTextContent('Alive');
    
    // Simulate socket event for player death
    const socketOnMock = require('socket.io-client')().on;
    const playerKilledCallback = socketOnMock.mock.calls.find(
      call => call[0] === 'player:killed'
    )[1];
    
    // Call the callback with the player's ID
    act(() => {
      playerKilledCallback({ playerId: 'player123' });
    });
    
    // Player should now be dead
    expect(screen.getByTestId('is-alive')).toHaveTextContent('Dead');
  });
});
