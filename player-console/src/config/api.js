// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
export const API_URL = `${API_BASE_URL}/api`;
export const SOCKET_URL = API_BASE_URL;

// Game colors for players
export const PLAYER_COLORS = [
  { id: 'red', name: 'Red', hex: '#F22929' },
  { id: 'blue', name: 'Blue', hex: '#31A2F2' },
  { id: 'green', name: 'Green', hex: '#5DF243' },
  { id: 'pink', name: 'Pink', hex: '#F261D4' },
  { id: 'orange', name: 'Orange', hex: '#F28422' },
  { id: 'yellow', name: 'Yellow', hex: '#F2BF27' },
  { id: 'black', name: 'Black', hex: '#3F474E' },
  { id: 'white', name: 'White', hex: '#D7E1F1' },
  { id: 'purple', name: 'Purple', hex: '#8F2BF2' },
  { id: 'brown', name: 'Brown', hex: '#916359' },
  { id: 'cyan', name: 'Cyan', hex: '#44E5EA' },
  { id: 'lime', name: 'Lime', hex: '#B8F243' }
];

// Game status types
export const GAME_STATUS = {
  SETUP: 'setup',
  IN_PROGRESS: 'in-progress',
  DISCUSSION: 'discussion',
  VOTING: 'voting',
  COMPLETED: 'completed'
};

// Game status labels
export const GAME_STATUS_LABELS = {
  [GAME_STATUS.SETUP]: 'Setup',
  [GAME_STATUS.IN_PROGRESS]: 'In Progress',
  [GAME_STATUS.DISCUSSION]: 'Discussion',
  [GAME_STATUS.VOTING]: 'Voting',
  [GAME_STATUS.COMPLETED]: 'Completed'
};
