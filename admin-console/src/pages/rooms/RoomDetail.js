import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  TextField,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Alert,
  Snackbar
} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import TaskIcon from '@mui/icons-material/Task';
import QrCodeIcon from '@mui/icons-material/QrCode';
import AddIcon from '@mui/icons-material/Add';
import api from '../../config/api';

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [tasks, setTasks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [qrDialogOpen, setQrDialogOpen] = useState(false);

  useEffect(() => {
    fetchRoomData();
  }, [id]);

  const fetchRoomData = async () => {
    try {
      setLoading(true);
      const roomResponse = await api.get(`/api/admin/rooms/${id}`);
      setRoom(roomResponse.data);
      setFormData({
        name: roomResponse.data.name,
        description: roomResponse.data.description || '',
        haEntityId: roomResponse.data.haEntityId || '',
        haAreaId: roomResponse.data.haAreaId || '',
        notes: roomResponse.data.notes || ''
      });

      // Fetch tasks in this room
      const tasksResponse = await api.get(`/api/admin/rooms/${id}/tasks`);
      setTasks(tasksResponse.data);

      setError('');
    } catch (err) {
      console.error('Error fetching room data:', err);
      setError('Failed to load room data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put(`/api/admin/rooms/${id}`, formData);
      setEditing(false);
      
      // Refresh room data
      await fetchRoomData();
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Room updated successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error('Error updating room:', err);
      setSnackbar({
        open: true,
        message: 'Failed to update room. Please try again.',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!room) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error || 'Room not found. It may have been deleted.'}
        </Alert>
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to="/rooms"
          sx={{ mt: 2 }}
        >
          Back to Rooms
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h4" component="h1">
            {editing ? 'Edit Room' : room.name}
          </Typography>
          
          <Box>
            {!editing ? (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<EditIcon />}
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
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

        {editing ? (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Room Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                required
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
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Home Assistant Entity ID"
                name="haEntityId"
                value={formData.haEntityId}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                helperText="For Home Assistant integration"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Home Assistant Area ID"
                name="haAreaId"
                value={formData.haAreaId}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                helperText="For Home Assistant integration"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                margin="normal"
                variant="outlined"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        ) : (
          <Box mt={2} mb={4}>
            <Typography variant="body1">
              {room.description || 'No description provided.'}
            </Typography>
            
            {(room.haEntityId || room.haAreaId) && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Home Assistant Integration:
                </Typography>
                <Grid container spacing={2}>
                  {room.haEntityId && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Entity ID: {room.haEntityId}
                      </Typography>
                    </Grid>
                  )}
                  {room.haAreaId && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="textSecondary">
                        Area ID: {room.haAreaId}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            )}
            
            {room.notes && (
              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Notes:
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {room.notes}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">Tasks</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            component={Link}
            to={`/tasks/create?roomId=${id}`}
          >
            Add Task
          </Button>
        </Box>

        <Grid container spacing={2}>
          {tasks.length === 0 ? (
            <Grid item xs={12}>
              <Box textAlign="center" p={5}>
                <Typography variant="subtitle1" color="textSecondary">
                  No tasks assigned to this room yet.
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  component={Link}
                  to={`/tasks/create?roomId=${id}`}
                  sx={{ mt: 2 }}
                >
                  Create First Task
                </Button>
              </Box>
            </Grid>
          ) : (
            tasks.map(task => (
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
                    {task.haEntity && (
                      <Chip 
                        label="Home Assistant" 
                        size="small" 
                        color="info" 
                        sx={{ mt: 1 }} 
                      />
                    )}
                    {task.type === 'QR' && (
                      <Chip 
                        label="QR Code" 
                        size="small" 
                        color="success" 
                        sx={{ mt: 1, ml: task.haEntity ? 1 : 0 }} 
                      />
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      component={Link}
                      to={`/tasks/${task._id}`}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      startIcon={<QrCodeIcon sx={{ fontSize: 16 }} />}
                      onClick={() => {
                        // QR code functionality would go here
                      }}
                      disabled={task.type !== 'QR'}
                    >
                      QR
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Paper>

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

export default RoomDetail;
