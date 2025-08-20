import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Button,
  CircularProgress,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ReportIcon from '@mui/icons-material/Report';
import TaskIcon from '@mui/icons-material/Task';
import RoomIcon from '@mui/icons-material/Room';
import ChatIcon from '@mui/icons-material/Chat';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import api from '../../config/api';
import io from 'socket.io-client';

const GamePlay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [gameEvents, setGameEvents] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [meetingActive, setMeetingActive] = useState(false);
  const [meetingData, setMeetingData] = useState(null);
  const [votingResults, setVotingResults] = useState(null);
  
  // Socket connection reference
  const socketRef = useRef(null);
  // Auto-scroll ref for game events
  const eventsEndRef = useRef(null);

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
    
    newSocket.on('game:event', (data) => {
      console.log('Game event:', data);
      setGameEvents(prev => [...prev, data]);
    });
    
    newSocket.on('player:update', (data) => {
      console.log('Player update:', data);
      setPlayers(currentPlayers => 
        currentPlayers.map(p => 
          p._id === data._id ? { ...p, ...data } : p
        )
      );
    });
    
    newSocket.on('player:killed', (data) => {
      console.log('Player killed:', data);
      setGameEvents(prev => [...prev, {
        type: 'kill',
        timestamp: new Date().toISOString(),
        data: data
      }]);
      
      // Update player status
      setPlayers(currentPlayers => 
        currentPlayers.map(p => 
          p._id === data.victimId ? { ...p, isAlive: false } : p
        )
      );
    });
    
    newSocket.on('task:completed', (data) => {
      console.log('Task completed:', data);
      setGameEvents(prev => [...prev, {
        type: 'task',
        timestamp: new Date().toISOString(),
        data: data
      }]);
      
      // Update task status
      setTasks(currentTasks => 
        currentTasks.map(t => 
          t._id === data.taskId ? { ...t, completedCount: (t.completedCount || 0) + 1 } : t
        )
      );
    });
    
    newSocket.on('meeting:started', (data) => {
      console.log('Meeting started:', data);
      setMeetingActive(true);
      setMeetingData(data);
      setGameEvents(prev => [...prev, {
        type: 'meeting',
        timestamp: new Date().toISOString(),
        data: data
      }]);
    });
    
    newSocket.on('meeting:ended', (data) => {
      console.log('Meeting ended:', data);
      setMeetingActive(false);
      setVotingResults(data.votes);
      setGameEvents(prev => [...prev, {
        type: 'meeting_end',
        timestamp: new Date().toISOString(),
        data: data
      }]);
      
      // If someone was ejected
      if (data.ejectedPlayer) {
        setPlayers(currentPlayers => 
          currentPlayers.map(p => 
            p._id === data.ejectedPlayer._id ? { ...p, isAlive: false } : p
          )
        );
      }
    });
    
    newSocket.on('game:ended', (data) => {
      console.log('Game ended:', data);
      setGameEvents(prev => [...prev, {
        type: 'game_end',
        timestamp: new Date().toISOString(),
        data: data
      }]);
      
      // Show game over dialog
      // Implementation depends on your UI/UX approach
    });
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);
  
  // Auto-scroll for game events
  useEffect(() => {
    if (eventsEndRef.current) {
      eventsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [gameEvents]);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      const [gameResponse, playersResponse, tasksResponse, roomsResponse] = await Promise.all([
        api.get(`/api/admin/games/${id}`),
        api.get(`/api/admin/games/${id}/players`),
        api.get(`/api/admin/games/${id}/tasks`),
        api.get(`/api/admin/games/${id}/rooms`)
      ]);
      
      setGame(gameResponse.data);
      setPlayers(playersResponse.data);
      setTasks(tasksResponse.data);
      setRooms(roomsResponse.data);
      setError('');
    } catch (err) {
      console.error('Error fetching game data:', err);
      setError('Failed to load game data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEndGame = async () => {
    try {
      await api.post(`/api/admin/games/${id}/end`);
      navigate(`/games/${id}`);
    } catch (err) {
      console.error('Error ending game:', err);
      setError('Failed to end game. Please try again.');
    }
  };

  const handleCallEmergencyMeeting = async () => {
    try {
      await api.post(`/api/admin/games/${id}/emergency-meeting`, {
        calledBy: 'admin'
      });
      setEmergencyDialogOpen(false);
    } catch (err) {
      console.error('Error calling emergency meeting:', err);
      setError('Failed to call emergency meeting. Please try again.');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Function to render game event
  const renderGameEvent = (event, index) => {
    const eventTime = new Date(event.timestamp).toLocaleTimeString();
    
    switch (event.type) {
      case 'kill':
        const killer = players.find(p => p._id === event.data.killerId);
        const victim = players.find(p => p._id === event.data.victimId);
        return (
          <ListItem key={index} sx={{ color: 'error.main' }}>
            <ListItemText
              primary={`[${eventTime}] ${killer?.name || 'Impostor'} killed ${victim?.name || 'a crewmate'}`}
            />
          </ListItem>
        );
      
      case 'task':
        const player = players.find(p => p._id === event.data.playerId);
        const task = tasks.find(t => t._id === event.data.taskId);
        return (
          <ListItem key={index} sx={{ color: 'success.main' }}>
            <ListItemText
              primary={`[${eventTime}] ${player?.name || 'A player'} completed task: ${task?.name || 'Unknown'}`}
            />
          </ListItem>
        );
        
      case 'meeting':
        const caller = players.find(p => p._id === event.data.calledBy);
        return (
          <ListItem key={index} sx={{ color: 'primary.main' }}>
            <ListItemText
              primary={`[${eventTime}] Emergency meeting called by ${caller?.name || 'Admin'}`}
              secondary="Voting in progress..."
            />
          </ListItem>
        );
        
      case 'meeting_end':
        let resultText = 'No one was ejected.';
        if (event.data.ejectedPlayer) {
          const ejected = players.find(p => p._id === event.data.ejectedPlayer._id);
          resultText = `${ejected?.name || 'A player'} was ejected.`;
          
          if (event.data.ejectedPlayer.role) {
            resultText += ` They were a ${event.data.ejectedPlayer.role}.`;
          }
        }
        return (
          <ListItem key={index} sx={{ color: 'warning.main' }}>
            <ListItemText
              primary={`[${eventTime}] Meeting ended.`}
              secondary={resultText}
            />
          </ListItem>
        );
        
      case 'game_end':
        return (
          <ListItem key={index} sx={{ fontWeight: 'bold' }}>
            <ListItemText
              primary={`[${eventTime}] Game Over`}
              secondary={`${event.data.winner === 'impostor' ? 'Impostors' : 'Crewmates'} win!`}
            />
          </ListItem>
        );
        
      default:
        return (
          <ListItem key={index}>
            <ListItemText
              primary={`[${eventTime}] ${event.type}: ${JSON.stringify(event.data)}`}
            />
          </ListItem>
        );
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
  if (game.status !== 'active') {
    return (
      <Box p={3}>
        <Alert severity="warning">
          This game is not active. Current status: {game.status}
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

  // Calculate game stats
  const alivePlayers = players.filter(p => p.isAlive !== false);
  const deadPlayers = players.filter(p => p.isAlive === false);
  const impostors = players.filter(p => p.role === 'impostor');
  const crewmates = players.filter(p => p.role === 'crewmate');
  const aliveImpostors = impostors.filter(p => p.isAlive !== false);
  const aliveCrewmates = crewmates.filter(p => p.isAlive !== false);
  
  const completedTasks = tasks.reduce((sum, task) => sum + (task.completedCount || 0), 0);
  const totalTasks = players.length * game.taskCount;
  const taskCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1">
              Game: {game.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Code: {game.gameCode}
            </Typography>
          </Box>
          
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<NotificationsIcon />}
              onClick={() => setEmergencyDialogOpen(true)}
              disabled={meetingActive}
            >
              Call Emergency Meeting
            </Button>
            
            <Button
              variant="contained"
              color="error"
              onClick={handleEndGame}
            >
              End Game
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

        {meetingActive && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Emergency meeting in progress. Discussion time: {meetingData?.discussionTime || 30}s, Voting time: {meetingData?.votingTime || 60}s
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left column: Game Statistics and Player List */}
          <Grid item xs={12} md={4}>
            {/* Game Statistics */}
            <Card sx={{ mb: 3 }}>
              <CardHeader title="Game Statistics" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Players</Typography>
                    <Typography variant="h6">{alivePlayers.length} / {players.length}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Impostors</Typography>
                    <Typography variant="h6">{aliveImpostors.length} / {impostors.length}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Tasks</Typography>
                    <Typography variant="h6">{completedTasks} / {totalTasks} ({taskCompletion}%)</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Rooms</Typography>
                    <Typography variant="h6">{rooms.length}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            {/* Player List */}
            <Card>
              <CardHeader 
                title="Players" 
                subheader={`${alivePlayers.length} alive / ${deadPlayers.length} dead`}
              />
              <CardContent sx={{ maxHeight: '400px', overflow: 'auto' }}>
                <List>
                  {players.map(player => (
                    <ListItem 
                      key={player._id}
                      sx={{
                        bgcolor: player.isAlive === false ? 'rgba(0,0,0,0.05)' : 'transparent',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ 
                            bgcolor: player.role === 'impostor' ? 'error.main' : 'primary.main',
                            opacity: player.isAlive === false ? 0.5 : 1
                          }}
                        >
                          <PersonIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center">
                            <Typography
                              variant="body1"
                              sx={{ 
                                textDecoration: player.isAlive === false ? 'line-through' : 'none',
                                color: player.isAlive === false ? 'text.secondary' : 'text.primary'
                              }}
                            >
                              {player.name}
                            </Typography>
                            {player.isConnected === false && (
                              <Chip 
                                label="Offline" 
                                size="small" 
                                color="default" 
                                sx={{ ml: 1, height: 20 }} 
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" color={player.role === 'impostor' ? 'error' : 'primary'}>
                            {player.role || 'Unknown'}
                            {player.isAlive === false && ' • Dead'}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Right column: Main game information */}
          <Grid item xs={12} md={8}>
            <Card sx={{ mb: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="game tabs">
                  <Tab icon={<ChatIcon />} label="Game Feed" />
                  <Tab icon={<TaskIcon />} label="Tasks" />
                  <Tab icon={<RoomIcon />} label="Rooms" />
                </Tabs>
              </Box>
              
              {/* Game Feed Tab */}
              <Box role="tabpanel" hidden={tabValue !== 0} sx={{ pt: 2 }}>
                {tabValue === 0 && (
                  <CardContent sx={{ height: '500px', overflow: 'auto' }}>
                    {gameEvents.length === 0 ? (
                      <Typography color="textSecondary" align="center" py={4}>
                        No game events yet. Events will appear here as the game progresses.
                      </Typography>
                    ) : (
                      <List dense>
                        {gameEvents.map((event, index) => renderGameEvent(event, index))}
                        <div ref={eventsEndRef} />
                      </List>
                    )}
                  </CardContent>
                )}
              </Box>
              
              {/* Tasks Tab */}
              <Box role="tabpanel" hidden={tabValue !== 1} sx={{ pt: 2 }}>
                {tabValue === 1 && (
                  <CardContent sx={{ height: '500px', overflow: 'auto' }}>
                    <Grid container spacing={2}>
                      {tasks.length === 0 ? (
                        <Grid item xs={12}>
                          <Typography color="textSecondary" align="center" py={4}>
                            No tasks configured for this game.
                          </Typography>
                        </Grid>
                      ) : (
                        tasks.map(task => (
                          <Grid item xs={12} sm={6} key={task._id}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="h6">{task.name}</Typography>
                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                  Type: {task.type}
                                </Typography>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                  <Typography variant="body2">
                                    Completed: {task.completedCount || 0} time(s)
                                  </Typography>
                                  <Chip 
                                    label={task.room?.name || 'No Room'} 
                                    size="small"
                                    icon={<RoomIcon fontSize="small" />}
                                  />
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))
                      )}
                    </Grid>
                  </CardContent>
                )}
              </Box>
              
              {/* Rooms Tab */}
              <Box role="tabpanel" hidden={tabValue !== 2} sx={{ pt: 2 }}>
                {tabValue === 2 && (
                  <CardContent sx={{ height: '500px', overflow: 'auto' }}>
                    <Grid container spacing={2}>
                      {rooms.length === 0 ? (
                        <Grid item xs={12}>
                          <Typography color="textSecondary" align="center" py={4}>
                            No rooms configured for this game.
                          </Typography>
                        </Grid>
                      ) : (
                        rooms.map(room => (
                          <Grid item xs={12} sm={6} md={4} key={room._id}>
                            <Card variant="outlined">
                              <CardContent>
                                <Typography variant="h6">{room.name}</Typography>
                                <Typography variant="body2" color="textSecondary" noWrap gutterBottom>
                                  {room.description}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                  Tasks: {room.tasks?.length || 0}
                                </Typography>
                                
                                {/* Player presence could be added here if implemented */}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))
                      )}
                    </Grid>
                  </CardContent>
                )}
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Emergency Meeting Dialog */}
      <Dialog open={emergencyDialogOpen} onClose={() => setEmergencyDialogOpen(false)}>
        <DialogTitle>Call Emergency Meeting</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to call an emergency meeting?
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={2}>
            This will pause the game and bring all players to a discussion and voting phase.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmergencyDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCallEmergencyMeeting} color="primary">Call Meeting</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GamePlay;
