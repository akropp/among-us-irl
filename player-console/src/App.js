import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Contexts
import { usePlayer } from './contexts/PlayerContext';

// Pages
import JoinGame from './pages/JoinGame';
import PlayerLayout from './components/layouts/PlayerLayout';
import GameLobby from './pages/GameLobby';
import TaskList from './pages/TaskList';
import TaskDetail from './pages/TaskDetail';
import Map from './pages/Map';
import EmergencyButton from './pages/EmergencyButton';
import Sabotage from './pages/Sabotage';
import Kill from './pages/Kill';
import Discussion from './pages/Discussion';
import GameOver from './pages/GameOver';
import NotFound from './pages/NotFound';

const App = () => {
  const { isRegistered, loading, checkRegistration } = usePlayer();
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    // Check if the player is registered with a device ID
    const initializeApp = async () => {
      await checkRegistration();
      setAppLoading(false);
    };

    // Initialize the app
    initializeApp();
    
    // Add full screen functionality for mobile
    const handleFullScreen = () => {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    };

    // Create the fullscreen button for mobile devices
    if (window.innerWidth <= 768 && !document.fullscreenElement) {
      const button = document.createElement('button');
      button.className = 'fullscreen-button';
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="#ffffff"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>';
      button.addEventListener('click', handleFullScreen);
      document.body.appendChild(button);
    }

    // Handle orientation change events
    const handleOrientationChange = () => {
      if (window.innerHeight > window.innerWidth) {
        document.body.classList.add('portrait');
        document.body.classList.remove('landscape');
      } else {
        document.body.classList.add('landscape');
        document.body.classList.remove('portrait');
      }
    };

    // Set initial orientation class
    handleOrientationChange();

    // Listen for orientation changes
    window.addEventListener('resize', handleOrientationChange);

    // Clean up on unmount
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      const button = document.querySelector('.fullscreen-button');
      if (button) {
        button.removeEventListener('click', handleFullScreen);
        document.body.removeChild(button);
      }
    };
  }, [checkRegistration]);

  // Show loading spinner while initializing
  if (appLoading || loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={60} thickness={4} color="secondary" />
      </Box>
    );
  }

  return (
    <>
      <Routes>
        {/* Public Route - Join Game */}
        <Route
          path="/join"
          element={!isRegistered ? <JoinGame /> : <Navigate to="/game/lobby" />}
        />
        
        {/* Redirect root to appropriate location */}
        <Route
          path="/"
          element={isRegistered ? <Navigate to="/game/lobby" /> : <Navigate to="/join" />}
        />

        {/* Protected Routes - Must be registered */}
        <Route element={
          isRegistered ? <PlayerLayout /> : <Navigate to="/join" />
        }>
          <Route path="/game/lobby" element={<GameLobby />} />
          <Route path="/game/tasks" element={<TaskList />} />
          <Route path="/game/tasks/:id" element={<TaskDetail />} />
          <Route path="/game/map" element={<Map />} />
          <Route path="/game/emergency" element={<EmergencyButton />} />
          <Route path="/game/sabotage" element={<Sabotage />} />
          <Route path="/game/kill" element={<Kill />} />
          <Route path="/game/discussion" element={<Discussion />} />
          <Route path="/game/game-over" element={<GameOver />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  );
};

export default App;
