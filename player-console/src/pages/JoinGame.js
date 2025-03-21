import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { usePlayer } from '../contexts/PlayerContext';
import { PLAYER_COLORS } from '../config/api';
import amongUsLogo from '../assets/among-us-logo.png';

const JoinGame = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { joinGame, loading, generateDeviceId } = usePlayer();
  
  // State
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);

  // Ensure device ID is generated on mount
  useEffect(() => {
    generateDeviceId();
  }, [generateDeviceId]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    const formErrors = {};
    
    if (!gameCode.trim()) {
      formErrors.gameCode = 'Game code is required';
    }
    
    if (!playerName.trim()) {
      formErrors.playerName = 'Player name is required';
    } else if (playerName.length > 10) {
      formErrors.playerName = 'Name must be 10 characters or less';
    }
    
    if (!selectedColor) {
      formErrors.selectedColor = 'Please select a color';
    }
    
    // If there are errors, set them and return
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    // Clear errors
    setErrors({});
    
    // Set submitting state
    setIsSubmitting(true);
    
    // Attempt to join the game
    const success = await joinGame(gameCode, playerName, selectedColor);
    
    if (success) {
      navigate('/game/lobby');
    }
    
    // Reset submitting state
    setIsSubmitting(false);
  };

  // Function to get the selected color object
  const getColorObject = () => {
    return PLAYER_COLORS.find(color => color.id === selectedColor) || null;
  };

  // Open color selection dialog
  const handleOpenColorDialog = () => {
    setColorDialogOpen(true);
  };

  // Close color selection dialog
  const handleCloseColorDialog = () => {
    setColorDialogOpen(false);
  };

  // Select a color
  const handleColorSelect = (colorId) => {
    setSelectedColor(colorId);
    setErrors({ ...errors, selectedColor: null });
    handleCloseColorDialog();
  };

  return (
    <Container 
      maxWidth="xs" 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        pt: isMobile ? 0 : 4,
        pb: isMobile ? 8 : 4
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Logo */}
        <Box 
          component="img"
          src={amongUsLogo}
          alt="Among Us"
          sx={{ 
            width: isMobile ? 200 : 250,
            height: 'auto',
            mb: 4
          }}
        />
        
        <Typography 
          component="h1" 
          variant="h4" 
          fontWeight="bold" 
          color="secondary"
          sx={{ mb: 1 }}
        >
          JOIN GAME
        </Typography>
        
        <Typography 
          variant="subtitle1" 
          color="text.secondary" 
          sx={{ mb: 3, textAlign: 'center' }}
        >
          Enter the game code and choose your identity
        </Typography>
        
        <Paper
          elevation={6}
          sx={{
            p: 3,
            width: '100%',
            borderRadius: 4,
            backgroundColor: 'background.paper',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="gameCode"
              label="Game Code"
              name="gameCode"
              autoComplete="off"
              autoFocus
              inputProps={{ maxLength: 6, style: { textTransform: 'uppercase' } }}
              value={gameCode}
              onChange={(e) => {
                // Convert to uppercase and remove non-alphanumeric characters
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setGameCode(value);
                if (errors.gameCode) {
                  setErrors({ ...errors, gameCode: null });
                }
              }}
              error={!!errors.gameCode}
              helperText={errors.gameCode}
              sx={{ mb: 2 }}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="playerName"
              label="Your Name"
              name="playerName"
              autoComplete="nickname"
              inputProps={{ maxLength: 10 }}
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                if (errors.playerName) {
                  setErrors({ ...errors, playerName: null });
                }
              }}
              error={!!errors.playerName}
              helperText={errors.playerName}
              sx={{ mb: 3 }}
            />
            
            <Typography 
              variant="subtitle2" 
              sx={{ 
                mb: 1,
                color: errors.selectedColor ? 'error.main' : 'text.secondary'
              }}
            >
              Select Color:
            </Typography>
            
            <Box 
              sx={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={handleOpenColorDialog}
              >
                {selectedColor ? (
                  <Avatar 
                    sx={{ 
                      bgcolor: getColorObject()?.hex,
                      width: 48,
                      height: 48,
                      mr: 2,
                      border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                ) : (
                  <Avatar 
                    sx={{ 
                      bgcolor: 'transparent',
                      border: '2px dashed rgba(255, 255, 255, 0.5)',
                      width: 48,
                      height: 48,
                      mr: 2
                    }}
                  />
                )}
                
                <Typography variant="body1">
                  {selectedColor 
                    ? getColorObject()?.name 
                    : 'Choose Your Color'}
                </Typography>
              </Box>
              
              <Button 
                variant="outlined" 
                onClick={handleOpenColorDialog}
                sx={{ borderRadius: 2 }}
              >
                Change
              </Button>
            </Box>
            
            {errors.selectedColor && (
              <Typography 
                variant="caption" 
                color="error" 
                sx={{ display: 'block', mb: 2, ml: 1 }}
              >
                {errors.selectedColor}
              </Typography>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="secondary"
              size="large"
              disabled={loading || isSubmitting}
              sx={{ 
                mt: 2, 
                mb: 2,
                py: 1.5,
                borderRadius: 3,
                fontSize: '1.1rem'
              }}
            >
              {isSubmitting || loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Join Game'
              )}
            </Button>
          </Box>
        </Paper>
        
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mt: 4, mb: 2, textAlign: 'center' }}
        >
          Among Us IRL © {new Date().getFullYear()}<br />
          Based on the game by InnerSloth
        </Typography>
      </Box>
      
      {/* Color Selection Dialog */}
      <Dialog 
        open={colorDialogOpen} 
        onClose={handleCloseColorDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'background.paper',
            borderRadius: 4
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          Choose Your Color
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {PLAYER_COLORS.map((color) => (
              <Grid item xs={3} key={color.id}>
                <IconButton
                  onClick={() => handleColorSelect(color.id)}
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    border: selectedColor === color.id 
                      ? `3px solid ${theme.palette.secondary.main}` 
                      : '3px solid transparent'
                  }}
                >
                  <Avatar 
                    sx={{ 
                      bgcolor: color.hex,
                      width: 48,
                      height: 48
                    }}
                  />
                </IconButton>
                <Typography 
                  variant="caption" 
                  align="center" 
                  sx={{ 
                    display: 'block',
                    mt: 0.5,
                    fontWeight: selectedColor === color.id ? 'bold' : 'normal',
                    color: selectedColor === color.id ? 'secondary.main' : 'text.secondary'
                  }}
                >
                  {color.name}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', pb: 2 }}>
          <Button 
            onClick={handleCloseColorDialog}
            variant="contained"
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default JoinGame;
