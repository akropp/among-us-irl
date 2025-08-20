import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  CircularProgress,
  Divider,
  Alert,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QrCodeIcon from '@mui/icons-material/QrCode';
import api from '../../config/api';
import io from 'socket.io-client';

const GameLobby = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [assignRolesDialogOpen, setAssignRolesDialogOpen] = useState(false);
  const [startingGame, setStartingGame] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  
  // Socket connection reference
  const socketRef = useRef(null);

  useEffect(() => {
    fetchGameData();
    
    // Set up socket connection
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
    const newSocket = io(apiUrl, {
      query: { gameId: id, isAdmin: true }
    });
    
    socketRef.current = newSocket;
    setSocket(newSocket);
    
    // Socket event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected');
      setConnected(true);
    });
    
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });
    
    newSocket.on('player:joined', (data) => {
      console.log('Player joined:', data);
      // Update players list
      setPlayers(currentPlayers => {
        const playerExists = currentPlayers.some(p => p._id === data._id);
        if (playerExists) {
          return currentPlayers.map(p => p._id === data._id ? { ...p, ...data } : p);
        } else {
          return [...currentPlayers, data];
        }
      });
    });
    
    newSocket.on('player:left', (data) => {
      console.log('Player left:', data);
      // Update players list
      setPlayers(currentPlayers => 
        currentPlayers.map(p => 
          p._id === data.playerId ? { ...p, isConnected: false } : p
        )
      );
    });
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      const [gameResponse, playersResponse] = await Promise.all([
        api.get(`/api/admin/games/${id}`),
        api.get(`/api/admin/games/${id}/players`)
      ]);
      
      setGame(gameResponse.data);
      setPlayers(playersResponse.data);
      setError('');
    } catch (err) {
      console.error('Error fetching game data:', err);
      setError('Failed to load game data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGame = async () => {
    try {
      setStartingGame(true);
      await api.post(`/api/admin/games/${id}/start`);
      
      // Navigate to game play screen
      navigate(`/games/${id}/play`);
    } catch (err) {
      console.error('Error starting game:', err);
      setError('Failed to start game. Please try again.');
      setStartingGame(false);
    }
  };

  const handleAssignRoles = async () => {
    try {
      await api.post(`/api/admin/games/${id}/assign-roles`);
      setAssignRolesDialogOpen(false);
      
      // Refresh player data
      const playersResponse = await api.get(`/api/admin/games/${id}/players`);
      setPlayers(playersResponse.data);
    } catch (err) {
      console.error('Error assigning roles:', err);
      setError('Failed to assign roles. Please try again.');
    }
  };

  const copyGameCode = () => {
    if (game && game.gameCode) {
      navigator.clipboard.writeText(game.gameCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!game) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error || 'Game not found. It may have been deleted.'}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/games"
          sx={{ mt: 2 }}
        >
          Back to Games
        </Button>
      </Box>
    );
  }

  // Check if game is in the wrong status
  if (game.status !== 'lobby') {
    return (
      <Box p={3}>
        <Alert severity="warning">
          This game is not in lobby mode. Current status: {game.status}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to={`/games/${id}`}
          sx={{ mt: 2 }}
        >
          Back to Game Details
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Game Lobby: {game.name}
          </Typography>
          
          <Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartGame}
              disabled={players.length < 4 || startingGame}
            >
              {startingGame ? 'Starting...' : 'Start Game'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!connected && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Not connected to game server. Real-time updates are disabled.
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Players ({players.length}/{game.playerLimit})
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    onClick={() => setAssignRolesDialogOpen(true)}
                    disabled={players.length < 4}
                  >
                    Assign Roles
                  </Button>
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                {players.length === 0 ? (
                  <Typography color="textSecondary" align="center" py={4}>
                    No players have joined yet. Share the game code below to invite players.
                  </Typography>
                ) : (
                  <List>
                    {players.map((player) => (
                      <ListItem
                        key={player._id}
                        secondaryAction={
                          player.role && (
                            <Tooltip title={player.role}>
                              <Typography variant="body2" color={player.role === 'impostor' ? 'error' : 'primary'}>
                                {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
                              </Typography>
                            </Tooltip>
                          )
                        }
                        sx={{
                          bgcolor: player.isConnected ? 'transparent' : 'rgba(0,0,0,0.05)',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: player.isConnected ? 'primary.main' : 'grey.500' }}>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={player.name || `Player ${player.deviceId.substring(0, 6)}`}
                          secondary={player.isConnected ? 'Connected' : 'Disconnected'}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Game Information
                </Typography>
                
                <Divider sx={{ mb: 2 }} />
                
                <Box mb={3}>
                  <Typography variant="subtitle1">Game Settings:</Typography>
                  <Box ml={2} mt={1}>
                    <Typography variant="body2">
                      Player Limit: {game.playerLimit}
                    </Typography>
                    <Typography variant="body2">
                      Impostor Count: {game.impostorCount}
                    </Typography>
                    <Typography variant="body2">
                      Tasks Per Player: {game.taskCount || 'Default'}
                    </Typography>
                  </Box>
                </Box>
                
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>
                    Share Game Code:
                  </Typography>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    bgcolor="#f5f5f5" 
                    p={2} 
                    borderRadius={1}
                    mb={2}
                  >
                    <Typography variant="h5" fontWeight="bold" flex={1}>
                      {game.gameCode}
                    </Typography>
                    <Tooltip title={copiedCode ? "Copied!" : "Copy Code"}>
                      <IconButton onClick={copyGameCode} size="small">
                        <ContentCopyIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<QrCodeIcon />}
                    onClick={() => setQrDialogOpen(true)}
                  >
                    Show QR Code
                  </Button>
                </Box>
                
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Ready to Start?
                  </Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Once all players have joined, click the Start Game button to begin.
                    {players.length < 4 && " You need at least 4 players to start."}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)}>
        <DialogTitle>Game QR Code</DialogTitle>
        <DialogContent>
          <Box textAlign="center" p={2}>
            <Typography variant="body1" gutterBottom>
              Scan this QR code to join the game:
            </Typography>
            <Box p={2} bgcolor="#f5f5f5" borderRadius={1}>
              {/* We'd include a QR code component here in a real implementation */}
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  m: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #ddd'
                }}
              >
                <Typography>Game Code: {game.gameCode}</Typography>
              </Box>
            </Box>
            <Typography variant="h6" mt={2}>
              {game.gameCode}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Roles Dialog */}
      <Dialog open={assignRolesDialogOpen} onClose={() => setAssignRolesDialogOpen(false)}>
        <DialogTitle>Assign Roles</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Randomly assign roles to all players? This will set {game.impostorCount} player(s) as Impostors and the rest as Crewmates.
          </Typography>
          <Typography variant="body2" color="error" mt={2}>
            Warning: This will override any manual role assignments.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignRolesDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignRoles} color="primary">Assign Roles</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GameLobby;
