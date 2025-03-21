import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { PlayerProvider } from './contexts/PlayerContext';
import { SocketProvider } from './contexts/SocketContext';
import './index.css';

// Create a theme with Among Us color scheme - mobile optimized
const theme = createTheme({
  palette: {
    primary: {
      main: '#1d2029', // Dark blue like the game background
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F22929', // Red like impostor
      contrastText: '#ffffff',
    },
    error: {
      main: '#F22929', // Red
    },
    warning: {
      main: '#F2BF27', // Yellow
    },
    info: {
      main: '#31A2F2', // Blue
    },
    success: {
      main: '#5DF243', // Green
    },
    background: {
      default: '#121212',
      paper: '#1d2029',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 500,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 16px',
        },
        containedPrimary: {
          backgroundColor: '#1d2029',
          '&:hover': {
            backgroundColor: '#2a2e3d',
          },
        },
        containedSecondary: {
          backgroundColor: '#F22929',
          '&:hover': {
            backgroundColor: '#D61F1F',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          backgroundColor: '#1d2029',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#1d2029',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        },
      },
    },
  },
  // Mobile-first breakpoints
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <PlayerProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </PlayerProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
