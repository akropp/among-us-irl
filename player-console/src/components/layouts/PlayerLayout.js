import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  CircularProgress,
  Fab,
  Zoom,
  useMediaQuery,
  useTheme,
  Slide,
  Chip
} from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import ChatIcon from '@mui/icons-material/Chat';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import ConstructionIcon from '@mui/icons-material/Construction';
import { usePlayer } from '../../contexts/PlayerContext';
import { useSocket } from '../../contexts/SocketContext';
import { PLAYER_COLORS } from '../../config/api';
import ResponsiveContainer from '../ResponsiveContainer';
import GameActionButton from '../GameActionButton';

const PlayerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { 
    playerInfo, 
    gameInfo, 
    isAlive, 
    isImpostor, 
    leaveGame, 
    emergencyMeetingsLeft,
    assignedTasks,
    completedTasks 
  } = usePlayer();
  const { isConnected, visualEffects } = useSocket();
  
  // State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [emergencyDialogOpen, setEmergencyDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showGameActions, setShowGameActions] = useState(true);

  // Check if we're in game playing mode (not in discussion, voting, or end screens)
  const isGameplayMode = gameInfo?.status === 'in-progress';
  
  // Determine if emergency button should be visible
  const showEmergencyButton = isGameplayMode && isAlive && emergencyMeetingsLeft > 0;
  
  // Calculate task completion percentage
  const taskCompletionPercentage = assignedTasks && assignedTasks.length > 0 
    ? Math.round((completedTasks?.length || 0) / assignedTasks.length * 100) 
    : 0;
  
  // Get player color
  const getPlayerColor = () => {
    const colorObj = PLAYER_COLORS.find(c => c.id === playerInfo?.color) || null;
    return colorObj?.hex || '#F22929';
  };

  // Handle navigation
  const handleNavigate = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  // Toggle game action buttons on mobile
  const toggleGameActions = () => {
    setShowGameActions(prev => !prev);
  };

  // Handle drawer toggle
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Handle leave game
  const handleLeaveGame = async () => {
    setLoading(true);
    await leaveGame();
    setLoading(false);
    setLeaveDialogOpen(false);
    navigate('/join');
  };

  // Handle emergency meeting
  const handleEmergencyMeeting = () => {
    setEmergencyDialogOpen(true);
  };

  // Calculate which bottom nav option is active
  const getActiveNavOption = () => {
    const path = location.pathname;
    
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/map')) return 'map';
    if (path.includes('/chat')) return 'chat';
    
    return 'tasks'; // Default to tasks
  };

  // Handle visual effects
  useEffect(() => {
    if (visualEffects) {
      switch (visualEffects) {
        case 'emergency':
          // Add emergency effect to body
          document.body.classList.add('emergency-flash');
          setTimeout(() => {
            document.body.classList.remove('emergency-flash');
          }, 3000);
          break;
        
        case 'killed':
          // Add killed effect
          document.body.classList.add('kill-animation');
          setTimeout(() => {
            document.body.classList.remove('kill-animation');
          }, 1000);
          break;
          
        default:
          break;
      }
    }
  }, [visualEffects]);

  // Listen for device orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.matchMedia("(orientation: portrait)").matches) {
        // Portrait mode
        document.body.classList.add('portrait-mode');
        document.body.classList.remove('landscape-mode');
      } else {
        // Landscape mode
        document.body.classList.add('landscape-mode');
        document.body.classList.remove('portrait-mode');
      }
    };
    
    // Check orientation on mount
    handleOrientationChange();
    
    // Add orientation change listener
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          backgroundColor: isImpostor ? 'rgba(242, 41, 41, 0.9)' : 'rgba(29, 32, 41, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: 3,
          height: isMobile ? 56 : 64,
          transition: 'all 0.3s ease'
        }}
      >
        <Toolbar sx={{ 
          minHeight: { xs: 56, sm: 64 }, 
          padding: { xs: '0 8px', sm: '0 16px' },
          transition: 'padding 0.3s ease'
        }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{ mr: { xs: 0.5, sm: 1 } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <Box
                  sx={{
                    width: isMobile ? 8 : 12,
                    height: isMobile ? 8 : 12,
                    borderRadius: '50%',
                    bgcolor: isConnected ? 'success.main' : 'error.main',
                    border: '2px solid #1d2029'
                  }}
                />
              }
            >
              <Avatar 
                sx={{ 
                  bgcolor: getPlayerColor(),
                  filter: !isAlive ? 'grayscale(80%)' : 'none',
                  opacity: !isAlive ? 0.7 : 1,
                  width: isMobile ? 32 : 36,
                  height: isMobile ? 32 : 36,
                  transition: 'all 0.3s ease'
                }}
              >
                {playerInfo?.name ? playerInfo.name[0].toUpperCase() : 'P'}
              </Avatar>
            </Badge>
            
            <Box sx={{ ml: 1.5 }}>
              <Typography 
                variant={isMobile ? "body2" : "subtitle1"} 
                sx={{ 
                  lineHeight: 1.2,
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: { xs: '120px', sm: '200px' }
                }}
              >
                {playerInfo?.name || 'Player'}
                {!isAlive && <span> (Dead)</span>}
              </Typography>
              
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  opacity: 0.7,
                  lineHeight: 1.2,
                  fontSize: isMobile ? '0.65rem' : '0.75rem'
                }}
              >
                {isImpostor ? 'Impostor' : 'Crewmate'}
                {gameInfo && ` • ${gameInfo.name}`}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {!isMobile && (
            <Chip 
              label={`Tasks: ${completedTasks?.length || 0}/${assignedTasks?.length || 0}`} 
              color="secondary" 
              size="small" 
              variant="outlined"
              sx={{ mr: 2 }}
            />
          )}

          <IconButton 
            color="inherit" 
            onClick={() => setLeaveDialogOpen(true)} 
            edge="end"
            size={isMobile ? "small" : "medium"}
          >
            <ExitToAppIcon fontSize={isMobile ? "small" : "medium"} />
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: '85%',
            maxWidth: 300,
            backgroundColor: 'background.paper',
            backgroundImage: 'linear-gradient(rgba(29, 32, 41, 0.95), rgba(29, 32, 41, 0.95))',
            backdropFilter: 'blur(10px)',
            boxSizing: 'border-box',
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Box
            sx={{
              p: { xs: 1.5, sm: 2 },
              display: 'flex',
              alignItems: 'center',
              backgroundColor: isImpostor ? 'rgba(242, 41, 41, 0.8)' : 'rgba(49, 162, 242, 0.2)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <Avatar
              sx={{
                bgcolor: getPlayerColor(),
                filter: !isAlive ? 'grayscale(80%)' : 'none',
                opacity: !isAlive ? 0.7 : 1,
                width: 50,
                height: 50,
                mr: 2,
                border: '2px solid rgba(255,255,255,0.2)'
              }}
            >
              {playerInfo?.name ? playerInfo.name[0].toUpperCase() : 'P'}
            </Avatar>
            
            <Box>
              <Typography variant="h6">
                {playerInfo?.name || 'Player'}
              </Typography>
              
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.7,
                  color: isImpostor ? '#FFFFFF' : 'inherit',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                {isImpostor ? (
                  <>
                    <LocalPoliceIcon fontSize="small" /> Impostor
                  </>
                ) : (
                  <>
                    <ConstructionIcon fontSize="small" /> Crewmate
                  </>
                )}
              </Typography>
            </Box>
            
            <IconButton 
              sx={{ ml: 'auto' }} 
              onClick={toggleDrawer}
              color="inherit"
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          {isGameplayMode && (
            <Box 
              sx={{ 
                p: 2, 
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderBottom: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <Typography variant="overline" sx={{ display: 'block', mb: 0.5 }}>
                Game Progress
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box 
                  sx={{ 
                    flexGrow: 1, 
                    height: 8, 
                    bgcolor: 'rgba(255,255,255,0.1)', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}
                >
                  <Box 
                    sx={{ 
                      height: '100%', 
                      width: `${taskCompletionPercentage}%`, 
                      bgcolor: 'secondary.main',
                      transition: 'width 0.5s ease-in-out'
                    }} 
                  />
                </Box>
                <Typography variant="body2">
                  {taskCompletionPercentage}%
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {completedTasks?.length || 0}/{assignedTasks?.length || 0} Tasks Completed
              </Typography>
            </Box>
          )}
          
          <List sx={{ flexGrow: 1, pt: 1 }}>
            <ListItem 
              button 
              onClick={() => handleNavigate('/game/tasks')}
              selected={location.pathname.includes('/tasks')}
              sx={{
                borderRadius: '0 20px 20px 0',
                ml: 1,
                mb: 0.5,
                pr: 2,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  }
                }
              }}
            >
              <ListItemIcon>
                <AssignmentIcon color={location.pathname.includes('/tasks') ? 'secondary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Tasks" />
            </ListItem>
            
            <ListItem 
              button 
              onClick={() => handleNavigate('/game/map')}
              selected={location.pathname.includes('/map')}
              sx={{
                borderRadius: '0 20px 20px 0',
                ml: 1,
                mb: 0.5,
                pr: 2,
                transition: 'all 0.2s ease',
                '&.Mui-selected': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.15)',
                  }
                }
              }}
            >
              <ListItemIcon>
                <MapIcon color={location.pathname.includes('/map') ? 'secondary' : 'inherit'} />
              </ListItemIcon>
              <ListItemText primary="Map" />
            </ListItem>
            
            {isGameplayMode && isAlive && isImpostor && (
              <ListItem 
                button 
                onClick={() => handleNavigate('/game/kill')}
                selected={location.pathname.includes('/kill')}
                sx={{
                  borderRadius: '0 20px 20px 0',
                  ml: 1,
                  mb: 0.5,
                  pr: 2,
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(242, 41, 41, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(242, 41, 41, 0.3)',
                    }
                  }
                }}
              >
                <ListItemIcon>
                  <DirectionsRunIcon color={location.pathname.includes('/kill') ? 'error' : 'inherit'} />
                </ListItemIcon>
                <ListItemText primary="Kill" sx={{ color: location.pathname.includes('/kill') ? 'error.main' : 'inherit' }} />
              </ListItem>
            )}
            
            {isGameplayMode && isAlive && (
              <ListItem 
                button 
                onClick={() => handleNavigate('/game/emergency')}
                selected={location.pathname.includes('/emergency')}
                disabled={emergencyMeetingsLeft <= 0}
                sx={{
                  borderRadius: '0 20px 20px 0',
                  ml: 1,
                  mb: 0.5,
                  pr: 2,
                  transition: 'all 0.2s ease',
                  opacity: emergencyMeetingsLeft <= 0 ? 0.5 : 1,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(237, 108, 2, 0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(237, 108, 2, 0.3)',
                    }
                  }
                }}
              >
                <ListItemIcon>
                  <Badge badgeContent={emergencyMeetingsLeft} color="error">
                    <ReportProblemIcon color={location.pathname.includes('/emergency') ? 'warning' : 'inherit'} />
                  </Badge>
                </ListItemIcon>
                <ListItemText 
                  primary="Emergency Meeting" 
                  sx={{ color: location.pathname.includes('/emergency') ? 'warning.main' : 'inherit' }}
                />
              </ListItem>
            )}
          </List>
          
          <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <GameActionButton
              label="Leave Game"
              color="error"
              size="medium"
              icon={<ExitToAppIcon />}
              onClick={() => {
                setDrawerOpen(false);
                setLeaveDialogOpen(true);
              }}
              sx={{ width: '100%' }}
            />
            
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ display: 'block', textAlign: 'center', mt: 2 }}
            >
              Among Us IRL v1.0.0
            </Typography>
          </Box>
        </Box>
      </Drawer>
      
      {/* Main Content */}
      <ResponsiveContainer
        mobileStyles={{
          pt: `${isMobile ? 56 : 64}px`,
          pb: '56px',
          minHeight: '100vh',
        }}
        desktopStyles={{
          pt: '64px',
          pb: '56px',
          minHeight: '100vh',
        }}
      >
        <Outlet />
      </ResponsiveContainer>
      
      {/* Bottom Navigation */}
      <BottomNavigation
        value={getActiveNavOption()}
        onChange={(event, newValue) => {
          navigate(`/game/${newValue}`);
        }}
        showLabels
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 56,
          zIndex: 1000,
          backgroundColor: 'rgba(29, 32, 41, 0.95)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'transform 0.3s ease',
          transform: (isGameplayMode && isMobile && showGameActions) ? 'translateY(56px)' : 'translateY(0)',
        }}
      >
        <BottomNavigationAction 
          label="Tasks" 
          value="tasks" 
          icon={<AssignmentIcon />} 
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' }
            }
          }}
        />
        <BottomNavigationAction 
          label="Map" 
          value="map" 
          icon={<MapIcon />} 
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' }
            }
          }}
        />
        <BottomNavigationAction 
          label="Chat" 
          value="chat" 
          icon={<ChatIcon />} 
          sx={{
            '& .MuiBottomNavigationAction-label': {
              fontSize: { xs: '0.65rem', sm: '0.75rem' }
            }
          }}
        />
      </BottomNavigation>
      
      {/* Game Actions Bar (Mobile) */}
      {isGameplayMode && isMobile && (
        <Slide direction="up" in={showGameActions} mountOnEnter unmountOnExit>
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              height: 56,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-around',
              backgroundColor: isImpostor ? 'rgba(242, 41, 41, 0.9)' : 'rgba(49, 162, 242, 0.8)',
              backdropFilter: 'blur(10px)',
              zIndex: 1001,
              px: 1,
              gap: 0.5
            }}
          >
            {isImpostor && isAlive && (
              <GameActionButton
                label="Kill"
                color="error"
                size="small"
                onClick={() => handleNavigate('/game/kill')}
                icon={<DirectionsRunIcon />}
              />
            )}
            
            {isAlive && emergencyMeetingsLeft > 0 && (
              <GameActionButton
                label="Emergency"
                color="warning"
                size="small"
                onClick={handleEmergencyMeeting}
                icon={<ReportProblemIcon />}
                cooldownTime={`${emergencyMeetingsLeft}`}
              />
            )}
            
            {/* Toggle button for nav bar */}
            <Fab
              size="small"
              color="secondary"
              sx={{ 
                position: 'absolute', 
                top: -20, 
                right: 16, 
                zIndex: 1002,
                boxShadow: 3
              }}
              onClick={toggleGameActions}
            >
              {showGameActions ? <MenuIcon /> : <CloseIcon />}
            </Fab>
          </Box>
        </Slide>
      )}
      
      {/* Emergency Meeting Button (Desktop) */}
      {isGameplayMode && !isMobile && showEmergencyButton && (
        <Zoom in={true}>
          <Fab
            color="error"
            aria-label="Emergency Meeting"
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              zIndex: 1000,
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
            onClick={handleEmergencyMeeting}
          >
            <ReportProblemIcon />
          </Fab>
        </Zoom>
      )}
      
      {/* Leave Game Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onClose={() => setLeaveDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: 'background.paper',
            backgroundImage: 'linear-gradient(rgba(29, 32, 41, 0.95), rgba(29, 32, 41, 0.95))',
            backdropFilter: 'blur(10px)',
            maxWidth: '90%'
          }
        }}
      >
        <DialogTitle>
          Leave Game?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ opacity: 0.8 }}>
            Are you sure you want to leave the current game? You will not be able to rejoin unless the game is still in the setup phase.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setLeaveDialogOpen(false)} 
            disabled={loading}
          >
            Cancel
          </Button>
          <GameActionButton
            label="Leave Game"
            color="error"
            size="small"
            disabled={loading}
            icon={loading ? <CircularProgress size={20} color="inherit" /> : <ExitToAppIcon />}
            onClick={handleLeaveGame}
          />
        </DialogActions>
      </Dialog>
      
      {/* Emergency Meeting Dialog */}
      <Dialog
        open={emergencyDialogOpen}
        onClose={() => setEmergencyDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: 'background.paper',
            backgroundImage: 'linear-gradient(rgba(29, 32, 41, 0.95), rgba(29, 32, 41, 0.95))',
            backdropFilter: 'blur(10px)',
            maxWidth: '90%'
          }
        }}
      >
        <DialogTitle sx={{ color: 'error.main' }}>
          Call Emergency Meeting?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ opacity: 0.8 }}>
            Are you sure you want to call an emergency meeting? You have {emergencyMeetingsLeft} emergency meeting{emergencyMeetingsLeft !== 1 ? 's' : ''} left.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEmergencyDialogOpen(false)}
          >
            Cancel
          </Button>
          <GameActionButton
            label="Call Meeting"
            color="error"
            size="small"
            onClick={() => {
              setEmergencyDialogOpen(false);
              navigate('/game/emergency');
            }}
            icon={<ReportProblemIcon />}
          />
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PlayerLayout;
