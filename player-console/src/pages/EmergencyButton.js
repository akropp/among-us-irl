import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Zoom,
  Slide,
  Fade,
  IconButton,
  Tooltip,
  LinearProgress,
  Snackbar,
  Alert
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningIcon from '@mui/icons-material/Warning';
import TimerIcon from '@mui/icons-material/Timer';
import LockIcon from '@mui/icons-material/Lock';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';

// Emergency button component
const EmergencyButton = () => {
  const navigate = useNavigate();
  const { 
    playerInfo, 
    gameInfo, 
    isAlive, 
    callEmergencyMeeting, 
    meetingCooldown 
  } = usePlayer();
  const { isConnected } = useSocket();
  
  // State
  const [isButtonPressed, setIsButtonPressed] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownError, setCooldownError] = useState(false);
  const [emergenciesLeft, setEmergenciesLeft] = useState(1);
  const [disabled, setDisabled] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  
  // Set up emergency meeting count
  useEffect(() => {
    if (gameInfo && playerInfo) {
      // Get emergency count settings from game
      const totalEmergencies = gameInfo.emergencyMeetingsPerPlayer || 1;
      
      // Calculate how many meetings this player has left
      const usedEmergencies = playerInfo.emergencyMeetingsCalled || 0;
      setEmergenciesLeft(Math.max(0, totalEmergencies - usedEmergencies));
      
      // Disable button if player has no emergencies left
      if (emergenciesLeft <= 0) {
        setDisabled(true);
      }
    }
  }, [gameInfo, playerInfo]);
  
  // Check cooldown status
  useEffect(() => {
    if (meetingCooldown > 0) {
      setDisabled(true);
      
      // Create cooldown timer
      const timer = setInterval(() => {
        if (meetingCooldown <= 0) {
          clearInterval(timer);
          setDisabled(false);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    } else {
      // If not on cooldown and player has emergency meetings left, enable button
      if (emergenciesLeft > 0) {
        setDisabled(false);
      }
    }
  }, [meetingCooldown]);
  
  // Handle emergency button press
  const handleEmergencyPress = () => {
    // Button animation
    setIsButtonPressed(true);
    setTimeout(() => setIsButtonPressed(false), 300);
    
    // Check if player can call a meeting
    if (disabled) {
      // If on cooldown
      if (meetingCooldown > 0) {
        setCooldownError(true);
        setTimeout(() => setCooldownError(false), 2000);
        
        // Show error message
        setErrorMessage(`Emergency meetings on cooldown: ${formatCooldown(meetingCooldown)} remaining`);
        setShowError(true);
        return;
      }
      
      // If no meetings left
      if (emergenciesLeft <= 0) {
        // Show error message
        setErrorMessage('No emergency meetings remaining');
        setShowError(true);
        return;
      }
      
      return;
    }
    
    // If not connected
    if (!isConnected) {
      setErrorMessage('Cannot call meeting: You are disconnected');
      setShowError(true);
      return;
    }
    
    // If player is dead
    if (!isAlive) {
      setErrorMessage('Dead players cannot call emergency meetings');
      setShowError(true);
      return;
    }
    
    // If checks pass, open confirmation dialog
    setConfirmDialogOpen(true);
  };
  
  // Handle confirmation
  const handleConfirmEmergency = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);
    
    try {
      // Call emergency meeting
      await callEmergencyMeeting();
      
      // After successful call, redirect to discussion
      navigate('/game/discussion');
    } catch (error) {
      console.error('Failed to call emergency meeting:', error);
      setErrorMessage(error.message || 'Failed to call emergency meeting');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel emergency meeting
  const handleCancelEmergency = () => {
    setConfirmDialogOpen(false);
  };
  
  // Format cooldown time
  const formatCooldown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Handle error alert close
  const handleCloseError = () => {
    setShowError(false);
  };
  
  // Determine button text based on various states
  const getButtonText = () => {
    if (loading) return 'Calling...';
    if (!isAlive) return 'Dead players cannot call meetings';
    if (emergenciesLeft <= 0) return 'No emergency meetings left';
    if (meetingCooldown > 0) return `Cooldown: ${formatCooldown(meetingCooldown)}`;
    return 'EMERGENCY';
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={2}
      height="calc(100vh - 120px)"
      sx={{
        backgroundImage: 'radial-gradient(circle, rgba(255, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.5) 70%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          top: 0,
          left: 0,
          overflow: 'hidden',
          zIndex: 0,
          opacity: 0.2
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: '80vw',
            height: '80vw',
            maxWidth: '500px',
            maxHeight: '500px',
            borderRadius: '50%',
            border: '2px dashed rgba(255, 0, 0, 0.5)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '60vw',
            height: '60vw',
            maxWidth: '400px',
            maxHeight: '400px',
            borderRadius: '50%',
            border: '2px dashed rgba(255, 0, 0, 0.5)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '40vw',
            height: '40vw',
            maxWidth: '300px',
            maxHeight: '300px',
            borderRadius: '50%',
            border: '2px dashed rgba(255, 0, 0, 0.5)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      </Box>
      
      {/* Header */}
      <Fade in={true}>
        <Typography variant="h5" gutterBottom sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center' }}>
          Emergency Meeting
        </Typography>
      </Fade>
      
      {/* Emergency Button */}
      <Zoom in={true} style={{ transitionDelay: '200ms' }}>
        <Box
          sx={{
            position: 'relative',
            marginBottom: 5,
            zIndex: 1
          }}
        >
          {/* Button Shadow Pulsing Effect */}
          <Box
            sx={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 0, 0, 0.2)',
              boxShadow: '0 0 30px 10px rgba(255, 0, 0, 0.3)',
              animation: cooldownError ? 'none' : 'pulse 2s infinite',
              top: 0,
              left: 0,
              zIndex: -1,
              opacity: disabled ? 0.2 : 0.8
            }}
          />
          
          {/* Button Base */}
          <Box
            onClick={handleEmergencyPress}
            sx={{
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 0, 0, 0.9)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: disabled ? 'not-allowed' : 'pointer',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5), inset 0 -7px 0 rgba(0, 0, 0, 0.3)',
              border: '8px solid #D00000',
              opacity: disabled ? 0.7 : 1,
              transform: isButtonPressed ? 'scale(0.95) translateY(5px)' : 'scale(1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Button Content */}
            {loading ? (
              <CircularProgress size={40} color="inherit" />
            ) : (
              <>
                <Typography variant="h6" fontWeight="bold" align="center">
                  {getButtonText()}
                </Typography>
                
                {disabled && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {meetingCooldown > 0 ? (
                      <TimerIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                    ) : (
                      <LockIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>
          
          {/* Cooldown Progress */}
          {meetingCooldown > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: -10,
                left: -10,
                right: -10,
                bottom: -10,
                borderRadius: '50%',
                overflow: 'hidden',
                pointerEvents: 'none'
              }}
            >
              <CircularProgress
                variant="determinate"
                value={
                  (1 - meetingCooldown / (gameInfo?.emergencyCooldown || 30)) * 100
                }
                size={200}
                thickness={4}
                sx={{
                  color: 'rgba(255, 255, 255, 0.3)',
                  position: 'absolute',
                  top: 0,
                  left: 0
                }}
              />
            </Box>
          )}
        </Box>
      </Zoom>
      
      {/* Information */}
      <Box textAlign="center" zIndex={1}>
        <Typography variant="body2" color="textSecondary" paragraph>
          Press the emergency button to call a meeting when you suspect an impostor.
        </Typography>
        <Typography variant="body2" fontWeight="medium" color="textSecondary">
          Meetings Remaining: {emergenciesLeft} / {gameInfo?.emergencyMeetingsPerPlayer || 1}
        </Typography>
      </Box>
      
      {/* Help button */}
      <Tooltip title="Emergency Meeting Help">
        <IconButton
          onClick={() => setHelpDialogOpen(true)}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16
          }}
        >
          <HelpOutlineIcon />
        </IconButton>
      </Tooltip>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelEmergency}
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
            Confirm Emergency Meeting
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to call an emergency meeting? This will interrupt 
            the game for all players and cannot be canceled once initiated.
            {emergenciesLeft === 1 && (
              <Typography 
                variant="body2" 
                color="error" 
                sx={{ mt: 2, display: 'flex', alignItems: 'center' }}
              >
                <ErrorOutlineIcon fontSize="small" sx={{ mr: 0.5 }} />
                This is your last emergency meeting.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEmergency}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleConfirmEmergency}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? 'Calling...' : 'Call Meeting'}
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
        <DialogTitle>Emergency Meeting Help</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              When to use the emergency button:
            </Typography>
            <ul>
              <li>When you suspect someone is an impostor</li>
              <li>When you need to share important information with the group</li>
              <li>When the group needs to coordinate</li>
            </ul>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
              Limitations:
            </Typography>
            <ul>
              <li>Each player has a limited number of emergency meetings</li>
              <li>There is a cooldown period after someone calls a meeting</li>
              <li>Dead players cannot call emergency meetings</li>
            </ul>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
              Note:
            </Typography>
            <Typography variant="body2" paragraph>
              Using the emergency button without good reason can hurt your team's
              progress and make others suspicious of you. Use it wisely!
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Error Snackbar */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
      
      {/* CSS for animations */}
      <style jsx="true">{`
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.7;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 0.7;
          }
        }
      `}</style>
    </Box>
  );
};

export default EmergencyButton;
