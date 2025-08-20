import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Slider,
  FormHelperText,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../config/api';

const GameCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    playerLimit: 10,
    impostorCount: 2,
    taskCount: 6,
    emergencyMeetingLimit: 1,
    votingTime: 60,
    discussionTime: 30,
    killCooldown: 45
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSliderChange = (name) => (e, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/api/admin/games', formData);
      
      // Navigate to the game detail page
      navigate(`/games/${response.data._id}`);
    } catch (err) {
      console.error('Error creating game:', err);
      setError(err.response?.data?.message || 'Failed to create game. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Create New Game</Typography>
      
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
                label="Game Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                variant="outlined"
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
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                required
                fullWidth
                label="Player Limit"
                name="playerLimit"
                type="number"
                value={formData.playerLimit}
                onChange={handleChange}
                variant="outlined"
                InputProps={{ inputProps: { min: 4, max: 15 } }}
                helperText="Min: 4, Max: 15"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Impostor Count</InputLabel>
                <Select
                  required
                  label="Impostor Count"
                  name="impostorCount"
                  value={formData.impostorCount}
                  onChange={handleChange}
                >
                  <MenuItem value={1}>1 Impostor</MenuItem>
                  <MenuItem value={2}>2 Impostors</MenuItem>
                  <MenuItem value={3}>3 Impostors</MenuItem>
                </Select>
                <FormHelperText>
                  Number of impostors in the game
                </FormHelperText>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Typography id="task-count-slider" gutterBottom>
                Tasks Per Crewmate: {formData.taskCount}
              </Typography>
              <Slider
                value={formData.taskCount}
                onChange={handleSliderChange('taskCount')}
                aria-labelledby="task-count-slider"
                step={1}
                marks
                min={1}
                max={10}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Typography id="emergency-meeting-slider" gutterBottom>
                Emergency Meetings Per Player: {formData.emergencyMeetingLimit}
              </Typography>
              <Slider
                value={formData.emergencyMeetingLimit}
                onChange={handleSliderChange('emergencyMeetingLimit')}
                aria-labelledby="emergency-meeting-slider"
                step={1}
                marks
                min={0}
                max={3}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography id="voting-time-slider" gutterBottom>
                Voting Time (seconds): {formData.votingTime}
              </Typography>
              <Slider
                value={formData.votingTime}
                onChange={handleSliderChange('votingTime')}
                aria-labelledby="voting-time-slider"
                step={15}
                marks
                min={15}
                max={120}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography id="discussion-time-slider" gutterBottom>
                Discussion Time (seconds): {formData.discussionTime}
              </Typography>
              <Slider
                value={formData.discussionTime}
                onChange={handleSliderChange('discussionTime')}
                aria-labelledby="discussion-time-slider"
                step={15}
                marks
                min={0}
                max={120}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Typography id="kill-cooldown-slider" gutterBottom>
                Kill Cooldown (seconds): {formData.killCooldown}
              </Typography>
              <Slider
                value={formData.killCooldown}
                onChange={handleSliderChange('killCooldown')}
                aria-labelledby="kill-cooldown-slider"
                step={5}
                marks
                min={10}
                max={60}
                valueLabelDisplay="auto"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end" mt={2}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/games')}
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
                  {loading ? 'Creating...' : 'Create Game'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default GameCreate;
