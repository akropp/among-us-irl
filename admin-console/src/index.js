import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import './index.css';

// Create a theme with Among Us color scheme
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
    },
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
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
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        },
      },
    },
  },
});

const root = createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
