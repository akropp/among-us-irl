import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../config/api';

// Helper function to get query params
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const TaskCreate = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const preselectedRoomId = query.get('roomId');
  
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'QR',
    roomId: preselectedRoomId || '',
    haEntity: '',
    haAction: '',
    haState: '',
    duration: 10,
    isCommon: false,
    difficultyLevel: 'medium',
    notes: ''
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const response = await api.get('/api/admin/rooms');
      setRooms(response.data);
      
      // If we don't have a preselected room but rooms exist, select the first one
      if (!preselectedRoomId && response.data.length > 0 && !formData.roomId) {
        setFormData(prev => ({ ...prev, roomId: response.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load rooms. Please try again.');
    } finally {
      setRoomsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData({ ...formData, [name]: checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.roomId) {
      setError('Please select a room for this task.');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/api/admin/tasks', formData);
      
      // Navigate to the task detail page
      navigate(`/tasks/${response.data._id}`);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.message || 'Failed to create task. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Create New Task</Typography>
      
      <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Task Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                variant="outlined"
                helperText="Enter a descriptive name for the task"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                variant="outlined"
                multiline
                rows={3}
                helperText="Describe what the player needs to do"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" required>
                <InputLabel>Task Type</InputLabel>
                <Select
                  label="Task Type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <MenuItem value="QR">QR Code</MenuItem>
                  <MenuItem value="Button">Physical Button</MenuItem>
                  <MenuItem value="HomeAssistant">Home Assistant</MenuItem>
                  <MenuItem value="Manual">Manual (Admin Verification)</MenuItem>
                </Select>
                <FormHelperText>
                  How will the task be verified?
                </FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined" required disabled={roomsLoading}>
                <InputLabel>Room</InputLabel>
                <Select
                  label="Room"
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleChange}
                >
                  {rooms.map(room => (
                    <MenuItem key={room._id} value={room._id}>{room.name}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  {roomsLoading ? 'Loading rooms...' : 'Where is this task located?'}
                </FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isCommon}
                    onChange={handleSwitchChange}
                    name="isCommon"
                    color="primary"
                  />
                }
                label="Common Task (assigned to all players)"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  label="Difficulty Level"
                  name="difficultyLevel"
                  value={formData.difficultyLevel}
                  onChange={handleChange}
                >
                  <MenuItem value="easy">Easy</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="hard">Hard</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Duration (seconds)"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                variant="outlined"
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Estimated time to complete (0 for instant)"
              />
            </Grid>
            
            {/* Home Assistant specific fields */}
            {formData.type === 'HomeAssistant' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Home Assistant Configuration
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    required
                    fullWidth
                    label="Entity ID"
                    name="haEntity"
                    value={formData.haEntity}
                    onChange={handleChange}
                    variant="outlined"
                    helperText="Home Assistant entity ID"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Action"
                    name="haAction"
                    value={formData.haAction}
                    onChange={handleChange}
                    variant="outlined"
                    helperText="Action to trigger (e.g., 'turn_on')"
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Target State"
                    name="haState"
                    value={formData.haState}
                    onChange={handleChange}
                    variant="outlined"
                    helperText="Target state to verify task completion"
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Admin Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                variant="outlined"
                multiline
                rows={2}
                helperText="Optional: Any additional notes for admins"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/tasks')}
                  sx={{ mr: 2 }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'Creating...' : 'Create Task'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default TaskCreate;
