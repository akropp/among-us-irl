import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Grid,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Zoom,
  Chip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { toast } from 'react-toastify';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';
import { PLAYER_COLORS, GAME_STATUS } from '../config/api';

const GameLobby = () => {
  const navigate = useNavigate();
  const { playerInfo, gameInfo, isRegistered } = usePlayer();
  const { isConnected } = useSocket();
  
  // State
  const [players, setPlayers] = useState([]);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(null);
  
  // If game has started, redirect to tasks
  useEffect(() => {
    if (gameInfo && gameInfo.status === GAME_STATUS.IN_PROGRESS) {
      navigate('/game/tasks');
    } else if (gameInfo && gameInfo.status === GAME_STATUS.DISCUSSION) {
      navigate('/game/discussion');
    } else if (gameInfo && gameInfo.status === GAME_STATUS.VOTING) {
      navigate('/game/voting');
    } else if (gameInfo && gameInfo.status === GAME_STATUS.COMPLETED) {
      navigate('/game/end');
    }
  }, [gameInfo?.status, navigate]);
  
  // Handle player list update
  useEffect(() => {
    if (gameInfo && gameInfo.players) {
      setPlayers(gameInfo.players);
    }
  }, [gameInfo]);
  
  // Handle game countdown
  useEffect(() => {
    if (gameInfo && gameInfo.startTime) {
      const startTime = new Date(gameInfo.startTime).getTime();
      const now = new Date().getTime();
      const timeLeft = startTime - now;
      
      if (timeLeft > 0) {
        const timer = setInterval(() => {
          const currentTime = new Date().getTime();
          const remainingTime = startTime - currentTime;
          
          if (remainingTime <= 0) {
            clearInterval(timer);
            setCountdown(0);
          } else {
            setCountdown(Math.ceil(remainingTime / 1000));
          }
        }, 1000);
        
        return () => clearInterval(timer);
      }
    }
  }, [gameInfo?.startTime]);
  
  // Copy game code to clipboard
  const handleCopyGameCode = () => {
    if (gameInfo?.code) {
      navigator.clipboard.writeText(gameInfo.code)
        .then(() => {
          setCopied(true);
          toast.success('Game code copied to clipboard!');
          setTimeout(() => setCopied(false), 3000);
        })
        .catch(err => {
          console.error('Failed to copy game code:', err);
          toast.error('Failed to copy game code');
        });
    }
  };

  // Get player color hex
  const getPlayerColorHex = (colorId) => {
    const color = PLAYER_COLORS.find(c => c.id === colorId);
    return color ? color.hex : '#CCCCCC';
  };

  // Render loading state if needed
  if (!isRegistered || !gameInfo) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="calc(100vh - 120px)"
        px={3}
      >
        <CircularProgress size={60} thickness={4} color="secondary" />
        <Typography variant="h6" sx={{ mt: 3 }}>
          Loading game...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      px={3}
      pt={2}
      pb={4}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 600,
          borderRadius: 4,
          mb: 3,
          background: 'rgba(43, 47, 60, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          overflow: 'hidden'
        }}
      >
        <Box
          sx={{
            p: 3,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <Typography 
            variant="h5" 
            fontWeight="bold"
            color="secondary"
            gutterBottom
          >
            Game Lobby
          </Typography>
          
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            mt={1}
          >
            <Typography variant="body1" sx={{ mr: 1 }}>
              Game Code:
            </Typography>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={handleCopyGameCode}
              endIcon={copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
              sx={{ borderRadius: 2, px: 2 }}
            >
              {gameInfo?.code || 'XXXXXX'}
            </Button>
          </Box>
          
          <Chip
            icon={<HourglassEmptyIcon />}
            label={
              countdown 
                ? `Game starting in ${countdown} seconds` 
                : 'Waiting for game to start'
            }
            color={countdown ? 'secondary' : 'default'}
            variant={countdown ? 'filled' : 'outlined'}
            sx={{ mt: 2 }}
          />
          
          {!isConnected && (
            <Chip
              label="Connection lost. Reconnecting..."
              color="error"
              variant="outlined"
              sx={{ mt: 2 }}
            />
          )}
        </Box>
        
        <Divider />
        
        <Box p={3}>
          <Typography 
            variant="subtitle1" 
            sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
          >
            <PersonIcon sx={{ mr: 1 }} />
            Players ({players.length}/{gameInfo.maxPlayers || 10})
          </Typography>
          
          <Grid container spacing={2}>
            {players.map((player) => (
              <Grid item xs={6} sm={4} key={player._id}>
                <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 3,
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: player._id === playerInfo?._id 
                        ? '2px solid rgba(255, 255, 255, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: getPlayerColorHex(player.color),
                        width: 40,
                        height: 40,
                        mr: 1.5
                      }}
                    />
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        maxWidth: '70%',
                        fontWeight: player._id === playerInfo?._id ? 'bold' : 'normal'
                      }}
                    >
                      {player.name}
                      {player._id === playerInfo?._id && ' (You)'}
                    </Typography>
                  </Paper>
                </Zoom>
              </Grid>
            ))}
            
            {/* Empty slots */}
            {Array.from(Array(Math.max(0, (gameInfo.maxPlayers || 10) - players.length))).map((_, index) => (
              <Grid item xs={6} sm={4} key={`empty-${index}`}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    opacity: 0.5
                  }}
                >
                  <Avatar
                    sx={{
                      bgcolor: 'transparent',
                      width: 40,
                      height: 40,
                      mr: 1.5,
                      border: '1px dashed rgba(255, 255, 255, 0.3)'
                    }}
                  />
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{ color: 'text.disabled' }}
                  >
                    Waiting...
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Paper>
      
      <Box
        sx={{
          mt: 2,
          padding: 3,
          backgroundColor: 'rgba(43, 47, 60, 0.5)',
          borderRadius: 4,
          width: '100%',
          maxWidth: 600
        }}
      >
        <Typography variant="h6" color="secondary" gutterBottom>
          How to Play
        </Typography>
        
        <Typography variant="body2" paragraph>
          <b>Crewmates:</b> Complete all tasks around the building before impostors eliminate you. Use the emergency button or report dead bodies to call meetings.
        </Typography>
        
        <Typography variant="body2" paragraph>
          <b>Impostors:</b> Blend in and eliminate crewmates without getting caught. Sabotage systems to create chaos and separate the crew.
        </Typography>
        
        <Typography variant="body2">
          Visit locations marked on your map, scan QR codes to complete tasks, and be careful who you trust!
        </Typography>
      </Box>
    </Box>
  );
};

export default GameLobby;
