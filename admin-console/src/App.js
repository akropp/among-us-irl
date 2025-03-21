import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Auth components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PrivateRoute from './components/auth/PrivateRoute';

// Layout components
import AdminLayout from './components/layouts/AdminLayout';

// Pages
import Dashboard from './pages/Dashboard';
import GameList from './pages/games/GameList';
import GameCreate from './pages/games/GameCreate';
import GameDetail from './pages/games/GameDetail';
import GameLobby from './pages/games/GameLobby';
import GamePlay from './pages/games/GamePlay';
import RoomList from './pages/rooms/RoomList';
import RoomCreate from './pages/rooms/RoomCreate';
import RoomDetail from './pages/rooms/RoomDetail';
import TaskList from './pages/tasks/TaskList';
import TaskCreate from './pages/tasks/TaskCreate';
import TaskDetail from './pages/tasks/TaskDetail';
import Settings from './pages/Settings';
import PlayerView from './pages/players/PlayerView';
import NotFound from './pages/NotFound';

// Context
import { useAuth } from './contexts/AuthContext';

const App = () => {
  const { authLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Load any global configurations or settings here
    document.title = 'Among Us IRL - Admin Console';
  }, []);

  if (authLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <>
      <Routes>
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} 
        />

        {/* Protected Routes */}
        <Route element={<PrivateRoute><AdminLayout /></PrivateRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Game Routes */}
          <Route path="/games" element={<GameList />} />
          <Route path="/games/create" element={<GameCreate />} />
          <Route path="/games/:id" element={<GameDetail />} />
          <Route path="/games/:id/lobby" element={<GameLobby />} />
          <Route path="/games/:id/play" element={<GamePlay />} />
          
          {/* Room Routes */}
          <Route path="/games/:gameId/rooms" element={<RoomList />} />
          <Route path="/games/:gameId/rooms/create" element={<RoomCreate />} />
          <Route path="/games/:gameId/rooms/:id" element={<RoomDetail />} />
          
          {/* Task Routes */}
          <Route path="/games/:gameId/tasks" element={<TaskList />} />
          <Route path="/games/:gameId/tasks/create" element={<TaskCreate />} />
          <Route path="/games/:gameId/tasks/:id" element={<TaskDetail />} />
          
          {/* Player Routes */}
          <Route path="/games/:gameId/players/:id" element={<PlayerView />} />
          
          {/* Settings Route */}
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Not Found Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
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
