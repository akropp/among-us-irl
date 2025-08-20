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
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import QrCodeIcon from '@mui/icons-material/QrCode';
import RoomIcon from '@mui/icons-material/Room';
import api from '../../config/api';

const TaskList = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [filterRoom, setFilterRoom] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksResponse, roomsResponse] = await Promise.all([
        api.get('/api/admin/tasks'),
        api.get('/api/admin/rooms')
      ]);
      
      setTasks(tasksResponse.data);
      setRooms(roomsResponse.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load tasks. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    
    try {
      await api.delete(`/api/admin/tasks/${taskToDelete._id}`);
      setTasks(tasks.filter(task => task._id !== taskToDelete._id));
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task. Please try again.');
    }
  };

  const handleRoomFilterChange = (event) => {
    setFilterRoom(event.target.value);
  };

  const filteredTasks = filterRoom === 'all' 
    ? tasks 
    : tasks.filter(task => task.roomId === filterRoom);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // Find room name by ID
  const getRoomName = (roomId) => {
    const room = rooms.find(r => r._id === roomId);
    return room ? room.name : 'No Room';
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tasks</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/tasks/create"
        >
          Create Task
        </Button>
      </Box>

      {error && (
        <Box mb={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Box mb={3}>
        <FormControl variant="outlined" sx={{ minWidth: 200 }}>
          <InputLabel id="room-filter-label">Filter by Room</InputLabel>
          <Select
            labelId="room-filter-label"
            value={filterRoom}
            onChange={handleRoomFilterChange}
            label="Filter by Room"
          >
            <MenuItem value="all">All Rooms</MenuItem>
            {rooms.map(room => (
              <MenuItem key={room._id} value={room._id}>{room.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {filteredTasks.length === 0 ? (
          <Grid item xs={12}>
            <Box textAlign="center" p={5}>
              <Typography variant="h6" color="textSecondary">
                No tasks found. Create your first task to get started!
              </Typography>
            </Box>
          </Grid>
        ) : (
          filteredTasks.map(task => (
            <Grid item xs={12} sm={6} md={4} key={task._id}>
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
                  <Typography variant="h6" gutterBottom>{task.name}</Typography>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <RoomIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="textSecondary">
                      {getRoomName(task.roomId)}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Type: {task.type}
                  </Typography>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }} noWrap>
                    {task.description}
                  </Typography>
                  
                  <Box>
                    {task.haEntity && (
                      <Chip 
                        label="Home Assistant" 
                        size="small" 
                        color="info" 
                        sx={{ mr: 0.5 }} 
                      />
                    )}
                    {task.type === 'QR' && (
                      <Chip 
                        label="QR Code" 
                        size="small" 
                        color="success" 
                      />
                    )}
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/tasks/${task._id}`)}
                  >
                    View
                  </Button>
                  
                  {task.type === 'QR' && (
                    <Button 
                      size="small"
                      startIcon={<QrCodeIcon />}
                      onClick={() => navigate(`/tasks/${task._id}/qr`)}
                    >
                      QR
                    </Button>
                  )}
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  <IconButton 
                    size="small" 
                    onClick={() => navigate(`/tasks/${task._id}/edit`)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteClick(task)}
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
            Are you sure you want to delete the task "{taskToDelete?.name}"? This action cannot be undone.
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

export default TaskList;
