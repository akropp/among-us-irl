import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Zoom,
  Fade,
  Tooltip,
  IconButton,
  Snackbar,
  Alert,
  Collapse
} from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import PowerOffIcon from '@mui/icons-material/PowerOff';
import LockIcon from '@mui/icons-material/Lock';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import WarningIcon from '@mui/icons-material/Warning';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BlockIcon from '@mui/icons-material/Block';
import SecurityIcon from '@mui/icons-material/Security';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';

// Sabotage option component
const SabotageOption = ({
  sabotage,
  onSelect,
  cooldowns,
  disabled,
  globalCooldown
}) => {
  // Get icon based on sabotage type
  const getIcon = () => {
    switch (sabotage.type) {
      case 'lights':
        return <PowerOffIcon fontSize="large" />;
      case 'comms':
        return <WifiOffIcon fontSize="large" />;
      case 'doors':
        return <LockIcon fontSize="large" />;
      case 'o2':
        return <DeviceThermostatIcon fontSize="large" />;
      case 'reactor':
        return <LocalFireDepartmentIcon fontSize="large" />;
      case 'security':
        return <SecurityIcon fontSize="large" />;
      default:
        return <WarningIcon fontSize="large" />;
    }
  };
  
  // Get sabotage name
  const getName = () => {
    switch (sabotage.type) {
      case 'lights':
        return 'Lights';
      case 'comms':
        return 'Communications';
      case 'doors':
        return `Lock ${sabotage.location?.name || 'Doors'}`;
      case 'o2':
        return 'Oxygen';
      case 'reactor':
        return 'Reactor';
      case 'security':
        return 'Security';
      default:
        return sabotage.name || 'Sabotage';
    }
  };
  
  // Get sabotage description
  const getDescription = () => {
    switch (sabotage.type) {
      case 'lights':
        return 'Turn off the lights, reducing visibility for crewmates';
      case 'comms':
        return 'Disable communications, preventing access to the task list';
      case 'doors':
        return `Lock doors at ${sabotage.location?.name || 'specific locations'}`;
      case 'o2':
        return 'Shut down oxygen system, create a time-critical emergency';
      case 'reactor':
        return 'Trigger a reactor meltdown, requiring immediate attention';
      case 'security':
        return 'Disable security cameras and alarm systems';
      default:
        return sabotage.description || 'Cause disruption for crewmates';
    }
  };
  
  // Check if this sabotage is on cooldown
  const isOnCooldown = () => {
    return cooldowns[sabotage.type] > 0;
  };
  
  // Get remaining cooldown for this sabotage
  const getRemainingCooldown = () => {
    return cooldowns[sabotage.type] || 0;
  };
  
  // Format cooldown time
  const formatCooldown = (seconds) => {
    return `${Math.floor(seconds)}s`;
  };
  
  // Calculate progress percentage for cooldown
  const getCooldownProgress = () => {
    if (!sabotage.cooldown) return 0;
    return 100 - (getRemainingCooldown() / sabotage.cooldown) * 100;
  };
  
  // Determine if this option should be disabled
  const isDisabled = () => {
    return disabled || isOnCooldown() || globalCooldown > 0;
  };
  
  return (
    <Zoom in={true} style={{ transitionDelay: `${sabotage.order * 100}ms` }}>
      <Paper
        elevation={3}
        onClick={() => !isDisabled() && onSelect(sabotage)}
        sx={{
          p: 3,
          borderRadius: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDisabled() ? 'not-allowed' : 'pointer',
          backgroundColor: isDisabled() 
            ? 'rgba(30, 30, 30, 0.7)' 
            : 'rgba(244, 67, 54, 0.2)',
          transition: 'all 0.3s ease',
          border: '1px solid rgba(244, 67, 54, 0.3)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': !isDisabled() ? {
            backgroundColor: 'rgba(244, 67, 54, 0.3)',
            transform: 'translateY(-3px)',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)'
          } : {}
        }}
      >
        {/* Cooldown Overlay */}
        {isOnCooldown() && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}
          >
            <AccessTimeIcon sx={{ fontSize: 36, mb: 1, opacity: 0.7 }} />
            <Typography variant="h6">
              {formatCooldown(getRemainingCooldown())}
            </Typography>
            <Box
              sx={{
                width: '80%',
                height: 5,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 5,
                mt: 1,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${getCooldownProgress()}%`,
                  backgroundColor: 'rgba(244, 67, 54, 0.7)',
                  borderRadius: 5,
                  transition: 'width 1s linear'
                }}
              />
            </Box>
          </Box>
        )}
        
        {/* Global Cooldown Overlay */}
        {!isOnCooldown() && globalCooldown > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}
          >
            <BlockIcon sx={{ fontSize: 36, mb: 1, opacity: 0.7 }} />
            <Typography variant="body2" align="center">
              Global cooldown
            </Typography>
            <Typography variant="h6">
              {formatCooldown(globalCooldown)}
            </Typography>
          </Box>
        )}
        
        {/* Icon */}
        <Box
          sx={{
            color: 'error.light',
            mb: 2
          }}
        >
          {getIcon()}
        </Box>
        
        {/* Title */}
        <Typography variant="h6" align="center" gutterBottom>
          {getName()}
        </Typography>
        
        {/* Description */}
        <Typography 
          variant="body2" 
          color="textSecondary" 
          align="center"
          sx={{ mt: 1, flexGrow: 1 }}
        >
          {getDescription()}
        </Typography>
        
        {/* Target Location for door sabotages */}
        {sabotage.type === 'doors' && sabotage.location && (
          <Chip 
            label={sabotage.location.name} 
            size="small" 
            color="default" 
            sx={{ mt: 2 }}
          />
        )}
      </Paper>
    </Zoom>
  );
};

// Sabotage component
const Sabotage = () => {
  const navigate = useNavigate();
  const { 
    playerInfo, 
    gameInfo, 
    isImpostor, 
    isAlive,
    sabotage 
  } = usePlayer();
  const { isConnected } = useSocket();
  
  // State
  const [loading, setLoading] = useState(true);
  const [availableSabotages, setAvailableSabotages] = useState([]);
  const [cooldowns, setCooldowns] = useState({});
  const [globalCooldown, setGlobalCooldown] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedSabotage, setSelectedSabotage] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('error');
  const [showAlert, setShowAlert] = useState(false);
  const [sabotageSuccess, setSabotageSuccess] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  
  // Set up available sabotages
  useEffect(() => {
    if (gameInfo && isImpostor) {
      // Check if the game provides sabotages
      if (gameInfo.availableSabotages) {
        // Format sabotages with an order number for animation
        const formattedSabotages = gameInfo.availableSabotages.map((sab, index) => ({
          ...sab,
          order: index
        }));
        
        setAvailableSabotages(formattedSabotages);
      } else {
        // Default sabotages if none provided
        const defaultSabotages = [
          {
            type: 'lights',
            cooldown: 30,
            order: 0
          },
          {
            type: 'comms',
            cooldown: 45,
            order: 1
          },
          {
            type: 'o2',
            cooldown: 60,
            order: 2
          },
          {
            type: 'reactor',
            cooldown: 60,
            order: 3
          }
        ];
        
        // Add door sabotages for each location if available
        if (gameInfo.locations) {
          gameInfo.locations.forEach((location, index) => {
            if (location.canBeSabotaged) {
              defaultSabotages.push({
                type: 'doors',
                cooldown: 20,
                location: location,
                order: 4 + index
              });
            }
          });
        }
        
        setAvailableSabotages(defaultSabotages);
      }
      
      // Initialize cooldowns
      const initialCooldowns = {};
      setLoading(false);
    }
  }, [gameInfo, isImpostor]);
  
  // Set up cooldown timer
  useEffect(() => {
    if (!loading && Object.keys(cooldowns).length > 0) {
      const timer = setInterval(() => {
        let updated = false;
        
        // Update cooldowns
        setCooldowns(prevCooldowns => {
          const newCooldowns = { ...prevCooldowns };
          
          // Reduce each cooldown by 1 second
          Object.keys(newCooldowns).forEach(key => {
            if (newCooldowns[key] > 0) {
              newCooldowns[key] -= 1;
              updated = true;
            }
          });
          
          return updated ? newCooldowns : prevCooldowns;
        });
        
        // Update global cooldown
        setGlobalCooldown(prev => {
          if (prev > 0) {
            updated = true;
            return prev - 1;
          }
          return prev;
        });
        
        // Clear interval if no more cooldowns
        if (!updated) {
          clearInterval(timer);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [loading, cooldowns]);
  
  // Check if player is impostor and alive
  useEffect(() => {
    if (!isImpostor) {
      // Redirect non-impostors
      navigate('/game/tasks');
    }
    
    if (!isAlive) {
      // Show message for dead impostors
      setAlertMessage('You are dead and cannot sabotage.');
      setAlertSeverity('warning');
      setShowAlert(true);
    }
  }, [isImpostor, isAlive, navigate]);
  
  // Handle sabotage selection
  const handleSabotageSelect = (sabotage) => {
    // Cannot sabotage if dead
    if (!isAlive) {
      setAlertMessage('You are dead and cannot sabotage.');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }
    
    // Cannot sabotage if disconnected
    if (!isConnected) {
      setAlertMessage('Cannot sabotage: You are disconnected');
      setAlertSeverity('error');
      setShowAlert(true);
      return;
    }
    
    // Set selected sabotage and open confirmation dialog
    setSelectedSabotage(sabotage);
    setConfirmDialogOpen(true);
  };
  
  // Handle sabotage confirmation
  const handleConfirmSabotage = async () => {
    if (!selectedSabotage) return;
    
    setConfirmDialogOpen(false);
    setLoading(true);
    
    try {
      // Call sabotage function
      await sabotage(selectedSabotage.type, selectedSabotage.location?._id);
      
      // Set cooldown for this sabotage type
      setCooldowns(prev => ({
        ...prev,
        [selectedSabotage.type]: selectedSabotage.cooldown
      }));
      
      // Set global cooldown (10 seconds or from game settings)
      setGlobalCooldown(gameInfo?.globalSabotageCooldown || 10);
      
      // Show success message
      setAlertMessage(`${getSabotageName(selectedSabotage)} sabotage activated!`);
      setAlertSeverity('success');
      setShowAlert(true);
      setSabotageSuccess(true);
      
      // Clear success animation after 3 seconds
      setTimeout(() => {
        setSabotageSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to sabotage:', error);
      setAlertMessage(error.message || 'Failed to sabotage');
      setAlertSeverity('error');
      setShowAlert(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel sabotage
  const handleCancelSabotage = () => {
    setConfirmDialogOpen(false);
  };
  
  // Get sabotage name from type
  const getSabotageName = (sabotage) => {
    if (!sabotage) return 'Unknown';
    
    switch (sabotage.type) {
      case 'lights':
        return 'Lights';
      case 'comms':
        return 'Communications';
      case 'doors':
        return `${sabotage.location?.name || 'Doors'} Lock`;
      case 'o2':
        return 'Oxygen';
      case 'reactor':
        return 'Reactor';
      case 'security':
        return 'Security System';
      default:
        return sabotage.name || 'Sabotage';
    }
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
          Loading sabotage options...
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
      <Fade in={sabotageSuccess} timeout={300}>
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
            display: sabotageSuccess ? 'flex' : 'none',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="h4" color="error" fontWeight="bold" textAlign="center">
            Sabotage Activated
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
          Sabotage Systems
        </Typography>
        
        <Tooltip title="How Sabotage Works">
          <IconButton onClick={() => setHelpDialogOpen(true)}>
            <HelpOutlineIcon />
          </IconButton>
        </Tooltip>
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
            You are dead and cannot perform sabotages. You can still view the options and observe the game.
          </Typography>
        </Paper>
      </Collapse>
      
      {/* Global Cooldown Status */}
      <Collapse in={globalCooldown > 0 && isAlive}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <Box display="flex" alignItems="center">
            <AccessTimeIcon color="error" sx={{ mr: 1.5 }} />
            <Typography variant="body2">
              Global sabotage cooldown active
            </Typography>
          </Box>
          <Chip
            label={`${globalCooldown}s`}
            size="small"
            color="error"
            variant="outlined"
          />
        </Paper>
      </Collapse>
      
      {/* Sabotage Options Grid */}
      <Grid container spacing={2}>
        {availableSabotages.map((sabotage, index) => (
          <Grid item xs={12} sm={6} md={4} key={`${sabotage.type}-${index}`}>
            <SabotageOption
              sabotage={sabotage}
              onSelect={handleSabotageSelect}
              cooldowns={cooldowns}
              disabled={!isAlive || !isConnected}
              globalCooldown={globalCooldown}
            />
          </Grid>
        ))}
        
        {availableSabotages.length === 0 && (
          <Grid item xs={12}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 3,
                backgroundColor: 'rgba(30, 30, 30, 0.7)'
              }}
            >
              <Typography variant="body1" paragraph>
                No sabotage options available for this game.
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelSabotage}
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
            Confirm Sabotage
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to sabotage <strong>{getSabotageName(selectedSabotage)}</strong>?
            
            {selectedSabotage?.cooldown > 0 && (
              <Typography 
                variant="body2" 
                sx={{ mt: 2, display: 'flex', alignItems: 'center' }}
              >
                <AccessTimeIcon fontSize="small" sx={{ mr: 0.5 }} />
                This will have a cooldown of {selectedSabotage.cooldown} seconds.
              </Typography>
            )}
            
            {gameInfo?.globalSabotageCooldown > 0 && (
              <Typography 
                variant="body2" 
                sx={{ display: 'flex', alignItems: 'center', mt: 1 }}
              >
                <BlockIcon fontSize="small" sx={{ mr: 0.5 }} />
                There will be a {gameInfo.globalSabotageCooldown}s global cooldown before any sabotage.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSabotage}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleConfirmSabotage}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? 'Activating...' : 'Sabotage'}
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
        <DialogTitle>How Sabotage Works</DialogTitle>
        <DialogContent>
          <DialogContentText component="div">
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
              Types of Sabotage:
            </Typography>
            <ul>
              <li><strong>Lights</strong> - Reduces crew visibility</li>
              <li><strong>Communications</strong> - Disables task notifications</li>
              <li><strong>Doors</strong> - Locks doors temporarily at specific locations</li>
              <li><strong>Oxygen/Reactor</strong> - Creates a critical emergency that crew must fix</li>
            </ul>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
              Strategy Tips:
            </Typography>
            <ul>
              <li>Use sabotage to separate crew members</li>
              <li>Create distractions away from your location</li>
              <li>Time sabotages to coincide with your kills</li>
              <li>Lock doors to trap targets or block escape routes</li>
              <li>Critical sabotages like O2 or Reactor force crew to gather</li>
            </ul>
            <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ mt: 2 }}>
              Cooldowns:
            </Typography>
            <Typography variant="body2" paragraph>
              Each sabotage has its own cooldown period. Additionally, there's a global
              cooldown that prevents any sabotage immediately after using one.
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

export default Sabotage;
