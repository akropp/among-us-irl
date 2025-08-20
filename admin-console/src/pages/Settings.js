import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Snackbar,
  Card,
  CardContent,
  CardHeader,
  IconButton
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SecurityIcon from '@mui/icons-material/Security';
import EditIcon from '@mui/icons-material/Edit';
import NotificationsIcon from '@mui/icons-material/Notifications';
import DeveloperModeIcon from '@mui/icons-material/DeveloperMode';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';

const Settings = () => {
  const { user, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('success');
  const [open, setOpen] = useState(false);

  // Profile settings
  const [profile, setProfile] = useState({
    email: '',
    name: '',
    organization: ''
  });

  // Game settings
  const [gameSettings, setGameSettings] = useState({
    defaultTaskCount: 5,
    defaultImpostorCount: 1,
    defaultPlayerLimit: 10,
    enableVotingFeature: true,
    enableEmergencyMeetings: true
  });

  // Home Assistant settings
  const [haSettings, setHaSettings] = useState({
    enabled: false,
    url: '',
    token: '',
    isConnected: false
  });

  useEffect(() => {
    if (user) {
      setProfile({
        email: user.email || '',
        name: user.name || '',
        organization: user.organization || ''
      });
    }

    // Load saved settings
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/admin/settings');
        if (response.data) {
          if (response.data.gameSettings) {
            setGameSettings(response.data.gameSettings);
          }
          if (response.data.haSettings) {
            setHaSettings(response.data.haSettings);
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value
    });
  };

  const handleGameSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setGameSettings({
      ...gameSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleHaSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHaSettings({
      ...haSettings,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await updateUserProfile(profile);
      showMessage('Profile updated successfully', 'success');
    } catch (err) {
      showMessage('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGameSettings = async () => {
    try {
      setLoading(true);
      await api.post('/api/admin/settings/game', gameSettings);
      showMessage('Game settings updated successfully', 'success');
    } catch (err) {
      showMessage('Failed to update game settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHaSettings = async () => {
    try {
      setLoading(true);
      await api.post('/api/admin/settings/homeassistant', haSettings);
      showMessage('Home Assistant settings updated successfully', 'success');
    } catch (err) {
      showMessage('Failed to update Home Assistant settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const testHaConnection = async () => {
    try {
      setLoading(true);
      const response = await api.post('/api/admin/settings/homeassistant/test', {
        url: haSettings.url,
        token: haSettings.token
      });
      setHaSettings({
        ...haSettings,
        isConnected: response.data.connected
      });
      showMessage(
        response.data.connected
          ? 'Successfully connected to Home Assistant'
          : 'Failed to connect to Home Assistant',
        response.data.connected ? 'success' : 'error'
      );
    } catch (err) {
      showMessage('Failed to test Home Assistant connection', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message, severity) => {
    setMessage(message);
    setSeverity(severity);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  if (loading && !profile.email) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              avatar={<SecurityIcon />}
              title="Profile Settings"
              action={
                <IconButton aria-label="edit" onClick={handleSaveProfile}>
                  <SaveIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    margin="normal"
                    disabled
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Organization"
                    name="organization"
                    value={profile.organization}
                    onChange={handleProfileChange}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Game Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<EditIcon />}
              title="Game Settings"
              action={
                <IconButton aria-label="save" onClick={handleSaveGameSettings}>
                  <SaveIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Default Task Count"
                    name="defaultTaskCount"
                    type="number"
                    value={gameSettings.defaultTaskCount}
                    onChange={handleGameSettingsChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 1, max: 20 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Default Impostor Count"
                    name="defaultImpostorCount"
                    type="number"
                    value={gameSettings.defaultImpostorCount}
                    onChange={handleGameSettingsChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 1, max: 3 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Default Player Limit"
                    name="defaultPlayerLimit"
                    type="number"
                    value={gameSettings.defaultPlayerLimit}
                    onChange={handleGameSettingsChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 4, max: 15 } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={gameSettings.enableVotingFeature}
                        onChange={handleGameSettingsChange}
                        name="enableVotingFeature"
                      />
                    }
                    label="Enable Voting Feature"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={gameSettings.enableEmergencyMeetings}
                        onChange={handleGameSettingsChange}
                        name="enableEmergencyMeetings"
                      />
                    }
                    label="Enable Emergency Meetings"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Home Assistant Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              avatar={<DeveloperModeIcon />}
              title="Home Assistant Integration"
              action={
                <IconButton aria-label="save" onClick={handleSaveHaSettings}>
                  <SaveIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={haSettings.enabled}
                    onChange={handleHaSettingsChange}
                    name="enabled"
                  />
                }
                label="Enable Home Assistant Integration"
              />
              
              <TextField
                fullWidth
                label="Home Assistant URL"
                name="url"
                value={haSettings.url}
                onChange={handleHaSettingsChange}
                margin="normal"
                disabled={!haSettings.enabled}
                placeholder="http://your-home-assistant-instance:8123"
              />
              
              <TextField
                fullWidth
                label="Long-lived Access Token"
                name="token"
                value={haSettings.token}
                onChange={handleHaSettingsChange}
                margin="normal"
                type="password"
                disabled={!haSettings.enabled}
              />
              
              <Box mt={2}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={testHaConnection}
                  disabled={!haSettings.enabled || !haSettings.url || !haSettings.token}
                >
                  Test Connection
                </Button>
                
                {haSettings.isConnected && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Connected to Home Assistant
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity={severity}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
