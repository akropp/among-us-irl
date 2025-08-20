import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Chip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import RoomIcon from '@mui/icons-material/Room';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GroupIcon from '@mui/icons-material/Group';
import TaskIcon from '@mui/icons-material/Task';
import QrCodeIcon from '@mui/icons-material/QrCode';
import api from '../../config/api';

const GameDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [players, setPlayers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  useEffect(() => {
    fetchGameData();
  }, [id]);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      const gameResponse = await api.get(`/api/admin/games/${id}`);
      setGame(gameResponse.data);
      setFormData({
        name: gameResponse.data.name,
        description: gameResponse.data.description || '',
        playerLimit: gameResponse.data.playerLimit || 10,
        impostorCount: gameResponse.data.impostorCount || 1
      });

      // Fetch related data
      const [playersResponse, roomsResponse, tasksResponse] = await Promise.all([
        api.get(`/api/admin/games/${id}/players`),
        api.get(`/api/admin/games/${id}/rooms`),
        api.get(`/api/admin/games/${id}/tasks`)
      ]);

      setPlayers(playersResponse.data);
      setRooms(roomsResponse.data);
      setTasks(tasksResponse.data);

      setError('');
    } catch (err) {
      console.error('Error fetching game data:', err);
      setError('Failed to load game data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/api/admin/games/${id}`, formData);
      setEditing(false);
      
      // Refresh game data
      await fetchGameData();
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Game updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating game:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update game. Please try again.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStartGame = async () => {
    try {
      await api.post(`/api/admin/games/${id}/start`);
      await fetchGameData();
      setSnackbar({
        open: true,
        message: 'Game started successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error starting game:', err);
      setSnackbar({
        open: true,
        message: 'Failed to start game. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Typography variant="h4" component="h1">
              {editing ? 'Edit Game' : game.name}
            </Typography>
            <Box ml={2}>{getStatusChip(game.status)}</Box>
          </Box>
          
          <Box>
            {!editing ? (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => setEditing(true)}
                  sx={{ mr: 1 }}
                >
                  Edit
                </Button>
                
                {game.status === 'setup' && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PlayArrowIcon />}
                    onClick={handleStartGame}
                  >
                    Start Game
                  </Button>
                )}
                
                {game.status === 'lobby' && (
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to={`/games/${id}/lobby`}
                  >
                    Go to Lobby
                  </Button>
                )}
                
                {game.status === 'active' && (
                  <Button
                    variant="contained"
                    color="primary"
                    component={Link}
                    to={`/games/${id}/play`}
                  >
                    Monitor Game
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => setEditing(false)}
                  sx={{ mr: 1 }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  Save
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Game Code Display */}
        <Box mb={3} display="flex" alignItems="center">
          <Typography variant="h6" component="span" mr={2}>
            Game Code: <strong>{game.gameCode}</strong>
          </Typography>
          <Button
            variant="outlined"
            startIcon={<QrCodeIcon />}
            onClick={() => setQrDialogOpen(true)}
            size="small"
          >
            Show QR
          </Button>
        </Box>

        {editing ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Game Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Player Limit"
                name="playerLimit"
                type="number"
                value={formData.playerLimit}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                InputProps={{ inputProps: { min: 4, max: 15 } }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Impostor Count"
                name="impostorCount"
                type="number"
                value={formData.impostorCount}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                InputProps={{ inputProps: { min: 1, max: 3 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        ) : (
          <Box mt={2} mb={4}>
            <Typography variant="body1">
              {game.description || 'No description provided.'}
            </Typography>
            <Grid container spacing={2} mt={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Player Limit: {game.playerLimit}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Impostor Count: {game.impostorCount}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Created: {new Date(game.createdAt).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="textSecondary">
                  Tasks Per Player: {game.taskCount || 'Default'}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="game tabs">
              <Tab icon={<GroupIcon />} label="Players" />
              <Tab icon={<RoomIcon />} label="Rooms" />
              <Tab icon={<TaskIcon />} label="Tasks" />
            </Tabs>
          </Box>
          
          {/* Players Tab */}
          <Box role="tabpanel" hidden={tabValue !== 0} sx={{ pt: 3 }}>
            {tabValue === 0 && (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    Players ({players.length}/{game.playerLimit})
                  </Typography>
                </Box>
                
                {players.length === 0 ? (
                  <Typography color="textSecondary">
                    No players have joined this game yet.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {players.map(player => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={player._id}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" noWrap>
                              {player.name || `Player ${player.deviceId.substring(0, 6)}`}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Role: {player.role || 'Not Assigned'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Status: {player.isConnected ? 'Online' : 'Offline'}
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Button
                              size="small"
                              component={Link}
                              to={`/games/${id}/players/${player._id}`}
                            >
                              View
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Box>
          
          {/* Rooms Tab */}
          <Box role="tabpanel" hidden={tabValue !== 1} sx={{ pt: 3 }}>
            {tabValue === 1 && (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Rooms ({rooms.length})</Typography>
                  <Button
                    variant="contained"
                    component={Link}
                    to={`/games/${id}/rooms/create`}
                    startIcon={<RoomIcon />}
                  >
                    Add Room
                  </Button>
                </Box>
                
                {rooms.length === 0 ? (
                  <Typography color="textSecondary">
                    No rooms have been created for this game yet.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {rooms.map(room => (
                      <Grid item xs={12} sm={6} md={4} key={room._id}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">{room.name}</Typography>
                            <Typography variant="body2" color="textSecondary" noWrap>
                              {room.description}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Tasks: {room.tasks?.length || 0}
                            </Typography>
                          </CardContent>
                          <CardActions>
                            <Button
                              size="small"
                              component={Link}
                              to={`/games/${id}/rooms/${room._id}`}
                            >
                              View
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Box>
          
          {/* Tasks Tab */}
          <Box role="tabpanel" hidden={tabValue !== 2} sx={{ pt: 3 }}>
            {tabValue === 2 && (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Tasks ({tasks.length})</Typography>
                  <Button
                    variant="contained"
                    component={Link}
                    to={`/games/${id}/tasks/create`}
                    startIcon={<TaskIcon />}
                  >
                    Add Task
                  </Button>
                </Box>
                
                {tasks.length === 0 ? (
                  <Typography color="textSecondary">
                    No tasks have been created for this game yet.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {tasks.map(task => (
                      <Grid item xs={12} sm={6} md={4} key={task._id}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6">{task.name}</Typography>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Type: {task.type}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" noWrap>
                              {task.description}
                            </Typography>
                            <Box mt={1}>
                              {task.haEntity && (
                                <Chip
                                  label="Home Assistant"
                                  size="small"
                                  color="info"
                                  sx={{ mr: 1 }}
                                />
                              )}
                              {task.type === 'QR' && (
                                <Chip label="QR Code" size="small" color="success" />
                              )}
                            </Box>
                          </CardContent>
                          <CardActions>
                            <Button
                              size="small"
                              component={Link}
                              to={`/games/${id}/tasks/${task._id}`}
                            >
                              View
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Box>
        </Box>
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default GameDetail;
