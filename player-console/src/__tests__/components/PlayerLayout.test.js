import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Outlet, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import PlayerLayout from '../../components/layouts/PlayerLayout';
import { usePlayer } from '../../contexts/PlayerContext';
import { useSocket } from '../../contexts/SocketContext';

// Mock the contexts
jest.mock('../../contexts/PlayerContext', () => ({
  usePlayer: jest.fn()
}));

jest.mock('../../contexts/SocketContext', () => ({
  useSocket: jest.fn()
}));

// Mock components that are used inside PlayerLayout
jest.mock('../../components/ResponsiveContainer', () => {
  return ({ children, ...props }) => (
    <div data-testid="responsive-container" {...props}>
      {children}
    </div>
  );
});

jest.mock('../../components/GameActionButton', () => {
  return ({ label, onClick, ...props }) => (
    <button data-testid="game-action-button" onClick={onClick} {...props}>
      {label}
    </button>
  );
});

// Mock MaterialUI icons
jest.mock('@mui/icons-material/Map', () => () => <div>MapIcon</div>);
jest.mock('@mui/icons-material/Assignment', () => () => <div>AssignmentIcon</div>);
jest.mock('@mui/icons-material/ReportProblem', () => () => <div>ReportProblemIcon</div>);
jest.mock('@mui/icons-material/Chat', () => () => <div>ChatIcon</div>);
jest.mock('@mui/icons-material/ExitToApp', () => () => <div>ExitToAppIcon</div>);
jest.mock('@mui/icons-material/Menu', () => () => <div>MenuIcon</div>);
jest.mock('@mui/icons-material/Close', () => () => <div>CloseIcon</div>);
jest.mock('@mui/icons-material/DirectionsRun', () => () => <div>DirectionsRunIcon</div>);
jest.mock('@mui/icons-material/LocalPolice', () => () => <div>LocalPoliceIcon</div>);
jest.mock('@mui/icons-material/Construction', () => () => <div>ConstructionIcon</div>);

// Create a custom theme for testing
const theme = createTheme();

// Setup test renderer with all required providers and router
const renderPlayerLayout = (initialPath = '/game/tasks') => {
  return render(
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/game/*" element={<PlayerLayout />}>
            <Route path="tasks" element={<div>Tasks content</div>} />
            <Route path="map" element={<div>Map content</div>} />
            <Route path="chat" element={<div>Chat content</div>} />
            <Route path="emergency" element={<div>Emergency content</div>} />
            <Route path="kill" element={<div>Kill content</div>} />
          </Route>
          <Route path="/join" element={<div>Join Game Page</div>} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>
  );
};

describe('PlayerLayout Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock values for contexts
    usePlayer.mockReturnValue({
      playerInfo: { name: 'TestPlayer', color: 1 },
      gameInfo: { name: 'TestGame', status: 'in-progress' },
      isAlive: true,
      isImpostor: false,
      leaveGame: jest.fn().mockResolvedValue({}),
      emergencyMeetingsLeft: 1,
      assignedTasks: [{ id: 1 }, { id: 2 }, { id: 3 }],
      completedTasks: [{ id: 1 }]
    });
    
    useSocket.mockReturnValue({
      isConnected: true,
      visualEffects: null
    });
    
    // Mock window.matchMedia
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false, // false = desktop, true = mobile
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    // Mock HTMLElement.classList
    document.body.classList = {
      add: jest.fn(),
      remove: jest.fn()
    };
  });

  it('renders app bar with player information', () => {
    renderPlayerLayout();
    
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    expect(screen.getByText(/Crewmate/)).toBeInTheDocument();
    expect(screen.getByText(/TestGame/)).toBeInTheDocument();
  });
  
  it('displays different role text for impostors', () => {
    usePlayer.mockReturnValue({
      ...usePlayer(),
      isImpostor: true
    });
    
    renderPlayerLayout();
    
    expect(screen.getByText(/Impostor/)).toBeInTheDocument();
  });
  
  it('shows (Dead) text when player is not alive', () => {
    usePlayer.mockReturnValue({
      ...usePlayer(),
      isAlive: false
    });
    
    renderPlayerLayout();
    
    expect(screen.getByText(/\(Dead\)/)).toBeInTheDocument();
  });
  
  it('shows drawer when menu button is clicked', async () => {
    renderPlayerLayout();
    
    // Find and click the menu button
    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);
    
    // Check if drawer content is visible
    await waitFor(() => {
      expect(screen.getByText('Among Us IRL v1.0.0')).toBeInTheDocument();
      expect(screen.getByText('Game Progress')).toBeInTheDocument();
    });
  });
  
  it('navigates to different pages when bottom navigation is used', () => {
    renderPlayerLayout();
    
    // Find and click the map navigation item
    const mapNavItem = screen.getByRole('button', { name: /map/i });
    fireEvent.click(mapNavItem);
    
    // Check if we navigated to the map page
    expect(screen.getByText('Map content')).toBeInTheDocument();
  });
  
  it('shows emergency button when player is alive and has meetings left', () => {
    renderPlayerLayout();
    
    // Check if emergency button is visible
    const emergencyButtons = screen.getAllByText(/Emergency/i);
    expect(emergencyButtons.length).toBeGreaterThan(0);
  });
  
  it('opens leave game dialog when leave button is clicked', async () => {
    renderPlayerLayout();
    
    // Find and click the leave game button in the app bar
    const leaveButtons = screen.getAllByRole('button', { name: /exit/i });
    fireEvent.click(leaveButtons[0]);
    
    // Check if leave dialog is visible
    await waitFor(() => {
      expect(screen.getByText('Leave Game?')).toBeInTheDocument();
      expect(screen.getByText(/You will not be able to rejoin/)).toBeInTheDocument();
    });
  });
  
  it('shows kill navigation for impostors only', () => {
    usePlayer.mockReturnValue({
      ...usePlayer(),
      isImpostor: true
    });
    
    renderPlayerLayout();
    
    // Open drawer to see all navigation items
    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);
    
    // Check if kill option is available
    expect(screen.getByText('Kill')).toBeInTheDocument();
  });
  
  it('does not show emergency options when no meetings are left', () => {
    usePlayer.mockReturnValue({
      ...usePlayer(),
      emergencyMeetingsLeft: 0
    });
    
    renderPlayerLayout();
    
    // Check that emergency button is not visible
    const emergencyFab = screen.queryByRole('button', { name: /emergency meeting/i });
    expect(emergencyFab).not.toBeInTheDocument();
    
    // Open drawer to check navigation items
    const menuButton = screen.getByRole('button', { name: /menu/i });
    fireEvent.click(menuButton);
    
    // Emergency option should be disabled in drawer
    const emergencyMenuItems = screen.getAllByText(/Emergency/i);
    for (const item of emergencyMenuItems) {
      const parentButton = item.closest('button');
      if (parentButton) {
        expect(parentButton).toBeDisabled();
      }
    }
  });
  
  it('shows different UI elements for mobile devices', () => {
    // Mock matchMedia to simulate mobile device
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    renderPlayerLayout();
    
    // Check for mobile-specific UI elements
    const gameActionsBar = screen.queryByRole('button', { name: /call meeting/i });
    expect(gameActionsBar).toBeInTheDocument();
  });
});
