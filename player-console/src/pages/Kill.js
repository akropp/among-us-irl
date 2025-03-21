import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Zoom,
  Fade,
  Collapse,
  Chip,
  Snackbar,
  Alert,
  LinearProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BlockIcon from '@mui/icons-material/Block';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';
import { PLAYER_COLORS } from '../config/api';

// Player item component for kill targets
const PlayerTargetItem = ({ player, onSelect, disabled, currentLocation }) => {
  // Get player color
  const getPlayerColor = () => {
    const colorObj = PLAYER_COLORS.find(c => c.id === player.color);
    return colorObj?.hex || '#F22929';
  };
  
  // Get player proximity
  const getProximityLabel = () => {
    if (player.currentLocation === currentLocation) {
      return 'Same Location';
    }
    
    if (player.proximity === 'near') {
      return 'Nearby';
    }
    
    return 'Out of Range';
  };
  
  // Check if player is in range for killing
  const isInRange = () => {
    return player.currentLocation === currentLocation || player.proximity === 'near';
  };
  
  return (
    <ListItem
      onClick={() => !disabled && isInRange() && onSelect(player)}
      sx={{
        borderRadius: 2,
        mb: 1.5,
        backgroundColor: 'rgba(30, 30, 30, 0.7)',
        border: isInRange() 
          ? '1px solid rgba(244, 67, 54, 0.5)' 
          : '1px solid rgba(255, 255, 255, 0.1)',
        cursor: disabled || !isInRange() ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        '&:hover': !disabled && isInRange() ? {
          backgroundColor: 'rgba(244, 67, 54, 0.2)',
          transform: 'translateY(-2px)'
        } : {}
      }}
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            bgcolor: getPlayerColor(),
            opacity: isInRange() ? 1 : 0.5
          }}
        >
          {player.name[0].toUpperCase()}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography variant="body1" sx={{ opacity: isInRange() ? 1 : 0.6 }}>
            {player.name}
          </Typography>
        }
        secondary={
          <Box display="flex" alignItems="center" mt={0.5}>
            <Chip
              size="small"
              icon={<LocationOnIcon fontSize="small" />}
              label={getProximityLabel()}
              color={isInRange() ? 'error' : 'default'}
              variant={isInRange() ? 'filled' : 'outlined'}
              sx={{ height: 24 }}
            />
          </Box>
        }
      />
    </ListItem>
  );
};

// Kill interface component
const Kill = () => {
  const navigate = useNavigate();
  const { 
    playerInfo, 
    gameInfo, 
    isImpostor, 
    isAlive,
    killPlayer,
    killCooldown 
  } = usePlayer();
  const { nearbyPlayers, isConnected } = useSocket();
  
  // State
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('error');
  const [showAlert, setShowAlert] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [killSuccess, setKillSuccess] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // Check if player is impostor
  useEffect(() => {
    if (!isImpostor) {
      // Redirect non-impostors
      navigate('/game/tasks');
    } else {
      setLoading(false);
    }
  }, [isImpostor, navigate]);
  
  // Update target list when nearby players changes
  useEffect(() => {
    if (nearbyPlayers && isImpostor) {
      // Filter out dead players and self
      const validTargets = Object.values(nearbyPlayers).filter(player => 
        player.isAlive && player._id !== playerInfo?._id && !player.isImpostor
      );
      
      setTargets(validTargets);
    }
  }, [nearbyPlayers, playerInfo, isImpostor]);
  
  // Handle target selection
  const handleTargetSelect = (target) => {
    // Can't kill if dead
    if (!isAlive) {
      setAlertMessage('You are dead and cannot kill.');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }
    
    // Can't kill if on cooldown
    if (killCooldown > 0) {
      setAlertMessage(`Kill ability on cooldown: ${killCooldown}s remaining`);
      setAlertSeverity('warning');
      setShowAlert(true);
      return;
    }
    
    // Can't kill if disconnected
    if (!isConnected) {
      setAlertMessage('Cannot kill: You are disconnected');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }
    
    // Set selected target and open confirmation dialog
    setSelectedTarget(target);
    setConfirmDialogOpen(true);
  };
  
  // Handle kill confirmation
  const handleConfirmKill = async () => {
    if (!selectedTarget) return;
    
    setConfirmDialogOpen(false);
    setLoading(true);
    
    try {
      // Call kill function
      await killPlayer(selectedTarget._id);
      
      // Remove target from list
      setTargets(prev => prev.filter(t => t._id !== selectedTarget._id));
      
      // Show success message
      setAlertMessage(`Successfully eliminated ${selectedTarget.name}`);
      setAlertSeverity('success');
      setShowAlert(true);
      setKillSuccess(true);
      
      // Clear success animation after 3 seconds
      setTimeout(() => {
        setKillSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to kill player:', error);
      setAlertMessage(error.message || 'Failed to kill player');
      setAlertSeverity('error');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel kill
  const handleCancelKill = () => {
    setConfirmDialogOpen(false);
  };
  
  // Handle refresh of nearby players
  const handleRefresh = () => {
    setRefreshing(true);
    // In a real app, we would fetch updated nearby player data here
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  // Format cooldown time
  const formatCooldown = (seconds) => {
    return `${Math.floor(seconds)}s`;
  };
  
  // Calculate progress percentage for cooldown
  const getCooldownProgress = () => {
    if (!gameInfo || !gameInfo.killCooldown) return 0;
    return 100 - (killCooldown / gameInfo.killCooldown) * 100;
  };
  
  // Handle alert close
  const handleAlertClose = () => {
    setShowAlert(false);
  };
  
  // If loading, show loading spinner
  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="calc(100vh - 120px)"
      >
        <CircularProgress size={50} color="error" />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading kill interface...
        </Typography>
      </Box>
    );
  }
  
  // If player is not an impostor, don't render anything (navigate effect will redirect)
  if (!isImpostor) {
    return null;
  }

  return (
    <Box
      sx={{
        p: 2,
        backgroundImage: 'radial-gradient(circle, rgba(244, 67, 54, 0.1) 0%, rgba(0, 0, 0, 0.8) 70%)',
        minHeight: 'calc(100vh - 120px)',
        position: 'relative'
      }}
    >
      {/* Success Animation Overlay */}
      <Fade in={killSuccess} timeout={300}>
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(244, 67, 54, 0.3)',
            zIndex: 2,
            pointerEvents: 'none',
            display: killSuccess ? 'flex' : 'none',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="h4" color="error" fontWeight="bold" textAlign="center">
            Target Eliminated
          </Typography>
        </Box>
      </Fade>
      
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" color="error" fontWeight="bold">
          Eliminate Players
        </Typography>
        
        <Box>
          <Tooltip title="How Kill Works">
            <IconButton onClick={() => setHelpDialogOpen(true)} sx={{ mr: 1 }}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Refresh Nearby Players">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <RefreshIcon />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Dead Impostor Warning */}
      <Collapse in={!isAlive}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            border: '1px solid rgba(255, 152, 0, 0.5)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <WarningIcon color="warning" sx={{ mr: 1.5 }} />
          <Typography variant="body2">
            You are dead and cannot eliminate players. You can still view the interface but cannot take action.
          </Typography>
        </Paper>
      </Collapse>
      
      {/* Kill Cooldown Display */}
      <Collapse in={killCooldown > 0 && isAlive}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 2
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={1}
          >
            <Typography variant="body2" display="flex" alignItems="center">
              <AccessTimeIcon color="error" sx={{ mr: 1 }} />
              Kill ability on cooldown
            </Typography>
            <Chip
              label={formatCooldown(killCooldown)}
              color="error"
              size="small"
            />
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={getCooldownProgress()}
            color="error"
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Paper>
      </Collapse>
      
      {/* Target List */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          backgroundColor: 'rgba(30, 30, 30, 0.7)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6" display="flex" alignItems="center">
            <GroupIcon sx={{ mr: 1 }} />
            Nearby Players
          </Typography>
          <Chip
            label={`${targets.length} Targets`}
            size="small"
            color={targets.length > 0 ? 'error' : 'default'}
            icon={<PersonIcon />}
          />
        </Box>
        
        {targets.length > 0 ? (
          <List>
            {targets.map(target => (
              <PlayerTargetItem
                key={target._id}
                player={target}
                onSelect={handleTargetSelect}
                disabled={!isAlive || killCooldown > 0 || !isConnected}
                currentLocation={playerInfo?.currentLocation}
              />
            ))}
          </List>
        ) : (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={4}
          >
            <PersonOffIcon sx={{ fontSize: 48, opacity: 0.7, mb: 2 }} />
            <Typography variant="body1" align="center" gutterBottom>
              No valid targets nearby
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              Move to locations where crewmates are present.
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Kill Tips */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 3,
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Kill Tactics
        </Typography>
        <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
          <li>
            <Typography variant="body2" paragraph sx={{ mb: 1 }}>
              Only kill when no other crewmates are nearby to witness.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph sx={{ mb: 1 }}>
              Use sabotage to separate crewmates before killing.
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph sx={{ mb: 1 }}>
              Be aware of your kill cooldown and plan accordingly.
            </Typography>
          </li>
        </ul>
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelKill}
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: 'background.paper'
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center">
            <WarningIcon color="error" sx={{ mr: 1 }} />
            Confirm Elimination
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to eliminate <strong>{selectedTarget?.name}</strong>?
            
            <Typography 
              variant="body2" 
              color="error" 
              sx={{ mt: 2, display: 'flex', alignItems: 'center' }}
            >
              <CloseIcon fontSize="small" sx={{ mr: 0.5 }} />
              This action will leave evidence (a body) that can be reported.
            </Typography>
            
            {gameInfo?.killCooldown > 0 && (
              <Typography 
                variant="body2" 
                sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
              >
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                Your kill ability will be on cooldown for {gameInfo.killCooldown} seconds.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelKill}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleConfirmKill}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? 'Eliminating...' : 'Eliminate Player'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Help Dialog */}
      <Dialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: 'background.paper'
          }
        }}
      >
        <DialogTitle>How Elimination Works</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Elimination Rules:
            </Typography>
            <ul>
              <li>You can only eliminate players who are at the same location or nearby</li>
              <li>You must wait for the cooldown timer to expire between kills</li>
              <li>Dead impostors cannot eliminate players</li>
              <li>When you eliminate a player, their body remains at that location</li>
            </ul>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
              Strategy Tips:
            </Typography>
            <ul>
              <li>Only kill when you're alone with a crewmate</li>
              <li>Use sabotage to split up groups before attempting a kill</li>
              <li>Create an alibi by being seen in other locations</li>
              <li>Consider combining kills with strategic sabotages</li>
              <li>Be aware that your kill cooldown is shared with other impostors</li>
            </ul>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
              Warnings:
            </Typography>
            <Typography variant="body2" paragraph>
              Bodies left behind can be reported by crewmates, which will trigger
              a discussion and voting session. Try to kill in areas crewmates rarely visit.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Alerts */}
      <Snackbar
        open={showAlert}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleAlertClose} 
          severity={alertSeverity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Kill;
