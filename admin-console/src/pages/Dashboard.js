import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Typography,
  Chip,
  Stack,
  IconButton,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { API_URL, GAME_STATUS_LABELS } from '../config/api';
import { useSocket } from '../contexts/SocketContext';

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  
  // State
  const [games, setGames] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch games data
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/games`);
        const gamesData = response.data;
        
        // All games
        setGames(gamesData);
        
        // Active games (setup or in-progress)
        setActiveGames(
          gamesData.filter(game => 
            game.status === 'setup' || 
            game.status === 'in-progress' ||
            game.status === 'discussion' ||
            game.status === 'voting'
          )
        );
        
        // Recent games (completed)
        setRecentGames(
          gamesData
            .filter(game => game.status === 'completed')
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5)
        );
        
      } catch (err) {
        console.error('Error fetching games:', err);
        setError('Failed to load games data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGames();
    
    // Refresh data at regular intervals
    const interval = setInterval(fetchGames, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Handle create new game
  const handleCreateGame = () => {
    navigate('/games/create');
  };
  
  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'setup': return theme.palette.info.main;
      case 'in-progress': return theme.palette.success.main;
      case 'discussion': return theme.palette.warning.main;
      case 'voting': return theme.palette.warning.dark;
      case 'completed': return theme.palette.error.main;
      default: return theme.palette.text.secondary;
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculate time since
  const timeSince = (dateString) => {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000; // years
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000; // months
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400; // days
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600; // hours
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60; // minutes
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };
  
  // Loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Paper 
          elevation={3} 
          sx={{ p: 3, textAlign: 'center', maxWidth: 500, backgroundColor: 'rgba(242, 41, 41, 0.1)' }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Error
          </Typography>
          <Typography variant="body1" paragraph>
            {error}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        
        <Button
          variant="contained"
          color="secondary"
          startIcon={<AddIcon />}
          onClick={handleCreateGame}
          sx={{ borderRadius: 8, px: 3 }}
        >
          Create New Game
        </Button>
      </Box>
      
      {/* Connection Status Banner */}
      {!isConnected && (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 4, 
            backgroundColor: 'rgba(242, 41, 41, 0.1)', 
            borderLeft: '4px solid #F22929',
            borderRadius: 1
          }}
        >
          <Typography variant="body1" color="error">
            Socket connection is offline. Real-time updates may be delayed. Please check your connection.
          </Typography>
        </Paper>
      )}
      
      {/* Game Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ 
            borderRadius: 3, 
            backgroundColor: 'background.paper',
            height: '100%'
          }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Games
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold">
                {games.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ 
            borderRadius: 3, 
            backgroundColor: 'background.paper',
            height: '100%'
          }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Active Games
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold" color="success.main">
                {activeGames.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ 
            borderRadius: 3, 
            backgroundColor: 'background.paper',
            height: '100%'
          }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Setup Phase
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold" color="info.main">
                {games.filter(game => game.status === 'setup').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={3} sx={{ 
            borderRadius: 3, 
            backgroundColor: 'background.paper',
            height: '100%'
          }}>
            <CardContent>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Completed Games
              </Typography>
              <Typography variant="h3" component="div" fontWeight="bold" color="error.main">
                {games.filter(game => game.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Active Games */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Active Games
      </Typography>
      
      {activeGames.length === 0 ? (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 3, 
            textAlign: 'center', 
            backgroundColor: 'background.paper',
            borderRadius: 2,
            mb: 4
          }}
        >
          <Typography variant="body1" color="text.secondary" paragraph>
            No active games found.
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={handleCreateGame}
          >
            Create New Game
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {activeGames.map((game) => (
            <Grid item xs={12} md={6} lg={4} key={game._id}>
              <Card 
                elevation={3} 
                sx={{ 
                  borderRadius: 3, 
                  backgroundColor: 'background.paper',
                  transition: 'transform 0.2s, box-shadow 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.3)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold" noWrap>
                      {game.name}
                    </Typography>
                    <Chip 
                      label={GAME_STATUS_LABELS[game.status] || game.status}
                      size="small"
                      sx={{ 
                        backgroundColor: getStatusColor(game.status),
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <PeopleIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {game.players?.length || 0} players {game.maxPlayers ? `/ ${game.maxPlayers}` : ''}
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    <SettingsIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {game.numberOfImpostors || 1} impostor{game.numberOfImpostors !== 1 ? 's' : ''}
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" spacing={1} alignItems="center">
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="body2">
                      {formatDate(game.createdAt)}
                    </Typography>
                  </Stack>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ p: 1.5 }}>
                  <Button 
                    size="small" 
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => navigate(game.status === 'setup' ? `/games/${game._id}/lobby` : `/games/${game._id}/play`)}
                    fullWidth
                  >
                    {game.status === 'setup' ? 'Lobby' : 'View Game'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      
      {/* Recent Games */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Recent Games
      </Typography>
      
      {recentGames.length === 0 ? (
        <Paper 
          elevation={1} 
          sx={{ 
            p: 3, 
            textAlign: 'center', 
            backgroundColor: 'background.paper',
            borderRadius: 2
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No completed games found.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {recentGames.map((game, index) => (
            <React.Fragment key={game._id}>
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: 'background.paper',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.05)'
                  }
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {game.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {game.players?.length || 0} players • {timeSince(game.updatedAt)}
                  </Typography>
                </Box>
                
                <Box>
                  <IconButton 
                    size="small" 
                    color="primary" 
                    onClick={() => navigate(`/games/${game._id}`)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    sx={{ ml: 1 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
              {index < recentGames.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;
