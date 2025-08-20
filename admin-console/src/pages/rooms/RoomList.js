import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import TaskIcon from '@mui/icons-material/Task';
import api from '../../config/api';

const RoomList = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/rooms');
      setRooms(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load rooms. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (room) => {
    setRoomToDelete(room);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;
    
    try {
      await api.delete(`/api/admin/rooms/${roomToDelete._id}`);
      setRooms(rooms.filter(room => room._id !== roomToDelete._id));
      setDeleteDialogOpen(false);
      setRoomToDelete(null);
    } catch (err) {
      console.error('Error deleting room:', err);
      setError('Failed to delete room. Please try again.');
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
        <Typography variant="h4">Rooms</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={Link}
          to="/rooms/create"
        >
          Create Room
        </Button>
      </Box>

      {error && (
        <Box mb={3}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Grid container spacing={3}>
        {rooms.length === 0 ? (
          <Grid item xs={12}>
            <Box textAlign="center" p={5}>
              <Typography variant="h6" color="textSecondary">
                No rooms found. Create your first room to get started!
              </Typography>
            </Box>
          </Grid>
        ) : (
          rooms.map(room => (
            <Grid item xs={12} sm={6} md={4} key={room._id}>
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
                  <Typography variant="h6" noWrap>{room.name}</Typography>
                  <Typography variant="body2" color="textSecondary" gutterBottom noWrap>
                    {room.description}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <TaskIcon fontSize="small" color="action" />
                    <Typography variant="body2" color="textSecondary" ml={1}>
                      Tasks: {room.tasks?.length || 0}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/rooms/${room._id}`)}
                  >
                    View
                  </Button>
                  <Button 
                    size="small" 
                    component={Link}
                    to={`/rooms/${room._id}/tasks`}
                  >
                    Tasks
                  </Button>
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  <IconButton 
                    size="small" 
                    onClick={() => navigate(`/rooms/${room._id}/edit`)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  
                  <IconButton 
                    size="small" 
                    onClick={() => handleDeleteClick(room)}
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
            Are you sure you want to delete the room "{roomToDelete?.name}"? This action cannot be undone.
          </Typography>
          {roomToDelete?.tasks?.length > 0 && (
            <Typography color="error" mt={2}>
              Warning: This room has {roomToDelete.tasks.length} task(s) associated with it. Deleting this room may affect games that use these tasks.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoomList;
