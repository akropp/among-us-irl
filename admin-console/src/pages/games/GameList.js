import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Chip,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import api from '../../config/api';

const GameList = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/games');
      setGames(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (game) => {
    setGameToDelete(game);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gameToDelete) return;
    
    try {
      await api.delete(`/api/admin/games/${gameToDelete._id}`);
      setGames(games.filter(game => game._id !== gameToDelete._id));
      setDeleteDialogOpen(false);
      setGameToDelete(null);
    } catch (err) {
      console.error('Error deleting game:', err);
      setError('Failed to delete game. Please try again.');
    }
  };

  const handleStartGame = async (gameId) => {
    try {
      await api.post(`/api/admin/games/${gameId}/start`);
      // Refresh the game list
      fetchGames();
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game. Please try again.');
    }
  };

  const handleEndGame = async (gameId) => {
    try {
      await api.post(`/api/admin/games/${gameId}/end`);
      // Refresh the game list
      fetchGames();
    } catch (err) {
      console.error('Error ending game:', err);
      setError('Failed to end game. Please try again.');
    }
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'setup':
        return <Chip label="Setup" color="default" size="small" />;
      case 'lobby':
        return <Chip label="Lobby" color="primary" size="small" />;
      case 'active':
        return <Chip label="Active" color="success" size="small" />;
      case 'completed':
        return <Chip label="Completed" color="info" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Games</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/games/create"
        >
          Create Game
        </Button>
      </Box>

      {error && (
        <Box mb={3}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {games.length === 0 ? (
          <Grid item xs={12}>
            <Box textAlign="center" p={5}>
              <Typography variant="h6" color="textSecondary">
                No games found. Create your first game to get started!
              </Typography>
            </Box>
          </Grid>
        ) : (
          games.map(game => (
            <Grid item xs={12} sm={6} md={4} key={game._id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-5px)'
                  }
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="h6" noWrap>{game.name}</Typography>
                    {getStatusChip(game.status)}
                  </Box>
                  <Typography color="textSecondary" gutterBottom>
                    Code: {game.gameCode}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Players: {game.players?.length || 0}/{game.playerLimit || 10}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Created: {new Date(game.createdAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/games/${game._id}`)}
                  >
                    View
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/games/${game._id}/lobby`)}
                    disabled={game.status !== 'lobby'}
                  >
                    Lobby
                  </Button>
                  <IconButton 
                    size="small" 
                    onClick={() => navigate(`/games/${game._id}/play`)}
                    disabled={game.status !== 'active'}
                    color="primary"
                  >
                    <PlayArrowIcon />
                  </IconButton>
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  {game.status === 'setup' || game.status === 'lobby' ? (
                    <IconButton 
                      size="small" 
                      color="success"
                      onClick={() => handleStartGame(game._id)}
                      disabled={game.status === 'active' || game.status === 'completed'}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                  ) : (
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleEndGame(game._id)}
                      disabled={game.status === 'completed'}
                    >
                      <PauseIcon />
                    </IconButton>
                  )}
                  
                  <IconButton 
                    size="small" 
                    onClick={() => navigate(`/games/${game._id}`)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteClick(game)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the game "{gameToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameList;
