import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { SocketProvider, useSocket } from '../../contexts/SocketContext';
import io from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client', () => {
  const socket = {
    on: jest.fn(),
    emit: jest.fn(),
    off: jest.fn(),
    disconnect: jest.fn(),
    connected: true
  };
  return jest.fn(() => socket);
});

// Test component that uses the SocketContext
const TestConsumer = () => {
  const { 
    isConnected, 
    visualEffects, 
    sendMessage, 
    emitEvent,
    connect,
    disconnect 
  } = useSocket();
  
  return (
    <div>
      <div data-testid="connection-status">{isConnected ? 'Connected' : 'Disconnected'}</div>
      <div data-testid="visual-effects">{visualEffects || 'None'}</div>
      <button data-testid="send-msg-btn" onClick={() => sendMessage('test-message', 'Hello')}>
        Send Message
      </button>
      <button data-testid="emit-event-btn" onClick={() => emitEvent('test-event', { data: 'test' })}>
        Emit Event
      </button>
      <button data-testid="connect-btn" onClick={connect}>Connect</button>
      <button data-testid="disconnect-btn" onClick={disconnect}>Disconnect</button>
    </div>
  );
};

// Setup test renderer with socket provider
const renderWithProvider = () => {
  return render(
    <SocketProvider>
      <TestConsumer />
    </SocketProvider>
  );
};

describe('SocketContext', () => {
  beforeEach(() => {
    // Reset mocks and localStorage before each test
    jest.clearAllMocks();
    localStorage.clear();
  });
  
  it('initializes with connected state from socket', () => {
    // Mock the socket connection state
    const mockSocket = io();
    mockSocket.connected = true;
    
    renderWithProvider();
    
    expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
  });
  
  it('handles sending messages correctly', () => {
    const mockSocket = io();
    renderWithProvider();
    
    // Send a test message
    act(() => {
      screen.getByTestId('send-msg-btn').click();
    });
    
    // Verify emit was called
    expect(mockSocket.emit).toHaveBeenCalledWith('chat:message', expect.any(Object));
  });
  
  it('handles emitting events correctly', () => {
    const mockSocket = io();
    renderWithProvider();
    
    // Emit a test event
    act(() => {
      screen.getByTestId('emit-event-btn').click();
    });
    
    // Verify emit was called with correct event and data
    expect(mockSocket.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
  });
  
  it('handles connection and disconnection correctly', () => {
    const mockSocket = io();
    renderWithProvider();
    
    // Test disconnect
    act(() => {
      screen.getByTestId('disconnect-btn').click();
    });
    
    expect(mockSocket.disconnect).toHaveBeenCalled();
    
    // Test connect
    jest.clearAllMocks();
    mockSocket.connected = false;
    
    act(() => {
      screen.getByTestId('connect-btn').click();
    });
    
    // A new socket should be created
    expect(io).toHaveBeenCalledTimes(1);
  });
  
  it('sets up event listeners for socket events', () => {
    const mockSocket = io();
    renderWithProvider();
    
    // Verify event listeners were set up
    expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('game:update', expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith('visual:effect', expect.any(Function));
  });
  
  it('updates visual effects when receiving visual:effect event', async () => {
    const mockSocket = io();
    renderWithProvider();
    
    // Find the visual:effect handler
    const visualEffectHandler = mockSocket.on.mock.calls.find(
      call => call[0] === 'visual:effect'
    )[1];
    
    // Simulate receiving an effect
    act(() => {
      visualEffectHandler({ effect: 'emergency' });
    });
    
    // Verify the effect was set
    expect(screen.getByTestId('visual-effects')).toHaveTextContent('emergency');
    
    // Visual effects should reset after a timeout
    await waitFor(() => {
      expect(screen.getByTestId('visual-effects')).toHaveTextContent('None');
    }, { timeout: 5000 });
  });
  
  it('cleans up socket listeners on unmount', () => {
    const mockSocket = io();
    const { unmount } = renderWithProvider();
    
    // Unmount the component
    unmount();
    
    // Verify socket.off was called to remove listeners
    expect(mockSocket.off).toHaveBeenCalled();
    expect(mockSocket.disconnect).toHaveBeenCalled();
  });
});
