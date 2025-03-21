import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Chip,
  CircularProgress,
  Grid,
  Fade,
  Zoom,
  Collapse,
  IconButton,
  Card,
  CardContent,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import CloseIcon from '@mui/icons-material/Close';
import ReplayIcon from '@mui/icons-material/Replay';
import { usePlayer } from '../contexts/PlayerContext';
import { PLAYER_COLORS } from '../config/api';

// Player result item component
const PlayerResultItem = ({ player, showRole = true }) => {
  // Get player color
  const getPlayerColor = () => {
    const colorObj = PLAYER_COLORS.find(c => c.id === player.color);
    return colorObj?.hex || '#F22929';
  };
  
  return (
    <ListItem
      sx={{
        borderRadius: 2,
        mb: 1,
        backgroundColor: player.isImpostor 
          ? 'rgba(244, 67, 54, 0.1)' 
          : 'rgba(76, 175, 80, 0.1)'
      }}
    >
      <ListItemAvatar>
        <Tooltip title={player.isAlive ? 'Survived' : 'Died'}>
          <Avatar
            sx={{
              bgcolor: getPlayerColor(),
              border: player.isAlive 
                ? '2px solid rgba(76, 175, 80, 0.8)' 
                : '2px solid rgba(244, 67, 54, 0.8)'
            }}
          >
            {player.isAlive 
              ? <PersonIcon />
              : <PersonOffIcon />
            }
          </Avatar>
        </Tooltip>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center">
            <Typography variant="body1" fontWeight="medium">
              {player.name}
            </Typography>
            {player.isImpostor && showRole && (
              <Chip 
                label="Impostor" 
                size="small" 
                color="error" 
                variant="outlined" 
                sx={{ ml: 1 }}
              />
            )}
            {!player.isImpostor && showRole && (
              <Chip 
                label="Crewmate" 
                size="small" 
                color="success" 
                variant="outlined" 
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        }
        secondary={
          <Box display="flex" alignItems="center" mt={0.5}>
            <Tooltip title="Tasks Completed">
              <Box display="flex" alignItems="center" mr={2}>
                <TaskAltIcon fontSize="small" color="disabled" sx={{ mr: 0.5 }} />
                <Typography variant="body2" color="textSecondary">
                  {player.tasksCompleted || 0}/{player.totalTasks || 0}
                </Typography>
              </Box>
            </Tooltip>
            
            {player.isImpostor && (
              <Tooltip title="Kills">
                <Box display="flex" alignItems="center">
                  <CloseIcon fontSize="small" color="error" sx={{ mr: 0.5, opacity: 0.7 }} />
                  <Typography variant="body2" color="textSecondary">
                    {player.kills || 0}
                  </Typography>
                </Box>
              </Tooltip>
            )}
          </Box>
        }
      />
    </ListItem>
  );
};

// Game stats component
const GameStats = ({ gameStats, expanded, onToggle }) => {
  return (
    <Card 
      elevation={3}
      sx={{ 
        mb: 3,
        backgroundColor: 'rgba(30, 30, 30, 0.6)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        <Box 
          display="flex" 
          justifyContent="space-between"
          alignItems="center"
          onClick={onToggle}
          sx={{ cursor: 'pointer' }}
        >
          <Typography variant="h6">
            Game Statistics
          </Typography>
          <IconButton
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s'
            }}
          >
            <ExpandMoreIcon />
          </IconButton>
        </Box>
        
        <Collapse in={expanded}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <AccessTimeIcon color="primary" fontSize="large" />
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Duration
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {gameStats.duration 
                    ? `${Math.floor(gameStats.duration / 60)}m ${gameStats.duration % 60}s` 
                    : '00:00'
                  }
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <PeopleIcon color="primary" fontSize="large" />
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Players
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {gameStats.totalPlayers || 0}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <TaskAltIcon color="primary" fontSize="large" />
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Tasks Completed
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {gameStats.tasksCompleted || 0}/{gameStats.totalTasks || 0}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <PersonOffIcon color="primary" fontSize="large" />
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Eliminations
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {gameStats.eliminations || 0}
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Voting Results
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {gameStats.meetings?.map((meeting, index) => (
                <Chip
                  key={index}
                  label={
                    meeting.ejectedPlayer
                      ? `${meeting.ejectedPlayer.name} ejected`
                      : 'No one ejected'
                  }
                  color={meeting.ejectedPlayer ? 'primary' : 'default'}
                  size="small"
                  variant="outlined"
                />
              ))}
              {(!gameStats.meetings || gameStats.meetings.length === 0) && (
                <Typography variant="body2" color="textSecondary">
                  No meetings were called
                </Typography>
              )}
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

// Game over component
const GameOver = () => {
  const navigate = useNavigate();
  const { playerInfo, gameInfo, leaveGame } = usePlayer();
  
  // State
  const [loading, setLoading] = useState(true);
  const [gameResult, setGameResult] = useState(null);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [currentPlayerData, setCurrentPlayerData] = useState(null);
  const [impostors, setImpostors] = useState([]);
  const [crewmates, setCrewmates] = useState([]);
  
  // Set up game result
  useEffect(() => {
    if (gameInfo && gameInfo.status === 'ended') {
      // Get game result
      setGameResult({
        winner: gameInfo.winner || 'unknown',
        reason: gameInfo.endReason || '',
        stats: {
          duration: gameInfo.duration || 0,
          totalPlayers: gameInfo.players?.length || 0,
          tasksCompleted: gameInfo.completedTasksCount || 0,
          totalTasks: gameInfo.totalTasksCount || 0,
          eliminations: gameInfo.eliminationsCount || 0,
          meetings: gameInfo.meetings || []
        }
      });
      
      // Set current player data
      if (playerInfo && gameInfo.players) {
        const currentPlayer = gameInfo.players.find(p => p._id === playerInfo._id);
        setCurrentPlayerData(currentPlayer);
      }
      
      // Set impostors and crewmates
      if (gameInfo.players) {
        const imposters = gameInfo.players.filter(p => p.isImpostor);
        const crew = gameInfo.players.filter(p => !p.isImpostor);
        setImpostors(imposters);
        setCrewmates(crew);
      }
      
      setLoading(false);
    }
  }, [gameInfo, playerInfo]);
  
  // Handle leave game
  const handleLeaveGame = async () => {
    try {
      await leaveGame();
      navigate('/join');
    } catch (error) {
      console.error('Failed to leave game:', error);
    }
  };
  
  // Toggle stats expanded
  const toggleStats = () => {
    setStatsExpanded(!statsExpanded);
  };
  
  // Get result message
  const getResultMessage = () => {
    if (!gameResult) return '';
    
    if (gameResult.winner === 'impostor') {
      return 'Impostors Win!';
    } else if (gameResult.winner === 'crewmate') {
      return 'Crewmates Win!';
    } else {
      return 'Game Over';
    }
  };
  
  // Get result reason
  const getResultReason = () => {
    if (!gameResult) return '';
    
    if (gameResult.winner === 'impostor') {
      if (gameResult.reason === 'all_crewmates_dead') {
        return 'All crewmates have been eliminated.';
      } else {
        return 'The impostors have sabotaged the station beyond repair.';
      }
    } else if (gameResult.winner === 'crewmate') {
      if (gameResult.reason === 'all_tasks_completed') {
        return 'All tasks have been completed.';
      } else if (gameResult.reason === 'impostors_ejected') {
        return 'All impostors have been ejected.';
      } else {
        return 'The crewmates have secured the station.';
      }
    }
    
    return '';
  };
  
  // Get player result
  const getPlayerResult = () => {
    if (!currentPlayerData || !gameResult) return '';
    
    // Player is impostor
    if (currentPlayerData.isImpostor) {
      return gameResult.winner === 'impostor' ? 'Victory' : 'Defeat';
    }
    
    // Player is crewmate
    return gameResult.winner === 'crewmate' ? 'Victory' : 'Defeat';
  };
  
  // Get color for player result
  const getResultColor = () => {
    const result = getPlayerResult();
    return result === 'Victory' ? 'success.main' : 'error.main';
  };
  
  // Get background based on winner
  const getBackgroundColor = () => {
    if (!gameResult) return 'rgba(0, 0, 0, 0.5)';
    
    if (gameResult.winner === 'impostor') {
      return 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(244, 67, 54, 0.4))';
    } else if (gameResult.winner === 'crewmate') {
      return 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(76, 175, 80, 0.4))';
    }
    
    return 'rgba(0, 0, 0, 0.5)';
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
        <CircularProgress size={50} color="secondary" />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading game results...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        background: getBackgroundColor(),
        minHeight: 'calc(100vh - 120px)',
        p: { xs: 2, sm: 3 },
        overflowY: 'auto'
      }}
    >
      {/* Game Result Header */}
      <Fade in={true} timeout={1000}>
        <Box textAlign="center" mb={4}>
          <Typography 
            variant="h4" 
            fontWeight="bold" 
            gutterBottom
            sx={{
              color: gameResult?.winner === 'impostor' ? 'error.light' : 'success.light'
            }}
          >
            {getResultMessage()}
          </Typography>
          <Typography variant="body1" paragraph>
            {getResultReason()}
          </Typography>
          
          <Chip
            label={getPlayerResult()}
            color={getPlayerResult() === 'Victory' ? 'success' : 'error'}
            icon={<EmojiEventsIcon />}
            sx={{ mt: 1 }}
          />
        </Box>
      </Fade>
      
      {/* Game Stats */}
      <Zoom in={true} style={{ transitionDelay: '200ms' }}>
        <Box>
          <GameStats
            gameStats={gameResult?.stats || {}}
            expanded={statsExpanded}
            onToggle={toggleStats}
          />
        </Box>
      </Zoom>
      
      {/* Player Role Reveal */}
      <Zoom in={true} style={{ transitionDelay: '300ms' }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            backgroundColor: 'rgba(30, 30, 30, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Impostors
          </Typography>
          <List>
            {impostors.length > 0 ? (
              impostors.map(player => (
                <PlayerResultItem
                  key={player._id}
                  player={player}
                  showRole={false}
                />
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No impostors in this game
              </Typography>
            )}
          </List>
        </Paper>
      </Zoom>
      
      {/* Crewmates */}
      <Zoom in={true} style={{ transitionDelay: '400ms' }}>
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            backgroundColor: 'rgba(30, 30, 30, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Typography variant="h6" gutterBottom>
            Crewmates
          </Typography>
          <List>
            {crewmates.length > 0 ? (
              crewmates.map(player => (
                <PlayerResultItem
                  key={player._id}
                  player={player}
                  showRole={false}
                />
              ))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No crewmates in this game
              </Typography>
            )}
          </List>
        </Paper>
      </Zoom>
      
      {/* Action Buttons */}
      <Box
        display="flex"
        justifyContent="center"
        mt={4}
        mb={2}
      >
        <Button
          variant="contained"
          color="primary"
          startIcon={<ReplayIcon />}
          onClick={handleLeaveGame}
          size="large"
          sx={{ borderRadius: 3, px: 4 }}
        >
          Back to Lobby
        </Button>
      </Box>
    </Box>
  );
};

export default GameOver;
