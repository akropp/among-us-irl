import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Divider,
  IconButton,
  Chip,
  Badge,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Zoom
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import WarningIcon from '@mui/icons-material/Warning';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';

// Map location component
const MapLocation = ({ location, players, tasks, onLocationClick, isCurrentLocation }) => {
  const { isImpostor, isAlive } = usePlayer();
  
  // Count players at this location
  const playerCount = players.filter(p => p.currentLocation === location._id).length;
  
  // Count tasks at this location
  const taskCount = tasks.filter(t => t.location?._id === location._id && !t.completed).length;
  
  // Location style based on whether there are tasks or players
  const getLocationStyle = () => {
    const baseStyle = {
      position: 'absolute',
      top: `${location.mapPosition.y}%`,
      left: `${location.mapPosition.x}%`,
      transform: 'translate(-50%, -50%)',
      zIndex: isCurrentLocation ? 10 : 1
    };
    
    if (isCurrentLocation) {
      return {
        ...baseStyle,
        animation: 'pulse 2s infinite'
      };
    }
    
    return baseStyle;
  };
  
  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="subtitle2">{location.name}</Typography>
          {taskCount > 0 && (
            <Typography variant="caption" display="block">
              Tasks: {taskCount}
            </Typography>
          )}
          {playerCount > 0 && isImpostor && isAlive && (
            <Typography variant="caption" display="block">
              Players: {playerCount}
            </Typography>
          )}
        </Box>
      }
      arrow
    >
      <IconButton
        onClick={() => onLocationClick(location)}
        sx={{
          ...getLocationStyle(),
          backgroundColor: isCurrentLocation 
            ? 'rgba(103, 58, 183, 0.9)'
            : taskCount > 0
              ? 'rgba(255, 193, 7, 0.9)'
              : 'rgba(158, 158, 158, 0.6)',
          color: '#fff',
          border: isCurrentLocation ? '2px solid #fff' : 'none',
          boxShadow: isCurrentLocation ? '0 0 10px rgba(103, 58, 183, 0.7)' : 'none',
        }}
      >
        <Badge
          badgeContent={taskCount > 0 ? taskCount : null}
          color="error"
          overlap="circular"
        >
          <LocationOnIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

// Player marker component
const PlayerMarker = ({ player, currentPlayerId, isImpostor }) => {
  const { playerInfo } = usePlayer();
  
  // Don't show dead players or self
  if (!player.isAlive || player._id === currentPlayerId) {
    return null;
  }
  
  // If not impostor, don't show player positions
  if (!isImpostor && player._id !== currentPlayerId) {
    return null;
  }
  
  // Get player position based on their location
  const getPosition = () => {
    if (!player.mapPosition) {
      return {
        top: '50%',
        left: '50%'
      };
    }
    
    return {
      top: `${player.mapPosition.y}%`,
      left: `${player.mapPosition.x}%`
    };
  };
  
  // Get player color
  const getPlayerColor = () => {
    const colorObj = PLAYER_COLORS.find(c => c.id === player.color) || null;
    return colorObj?.hex || '#F22929';
  };
  
  return (
    <Tooltip title={player.name}>
      <Box
        sx={{
          position: 'absolute',
          ...getPosition(),
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          width: 30,
          height: 30,
          borderRadius: '50%',
          backgroundColor: getPlayerColor(),
          border: '2px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          transition: 'all 0.5s ease',
        }}
      >
        <PersonIcon style={{ color: '#fff', fontSize: 18 }} />
      </Box>
    </Tooltip>
  );
};

// Dead body marker component
const DeadBodyMarker = ({ body, isImpostor, isAlive }) => {
  // Don't show bodies to crewmates unless they're close
  if (!isImpostor && !body.isVisible) {
    return null;
  }
  
  // Get body position
  const getPosition = () => {
    if (!body.position) {
      return {
        top: '50%',
        left: '50%'
      };
    }
    
    return {
      top: `${body.position.y}%`,
      left: `${body.position.x}%`
    };
  };
  
  return (
    <Zoom in={true}>
      <Box
        sx={{
          position: 'absolute',
          ...getPosition(),
          transform: 'translate(-50%, -50%)',
          zIndex: 5,
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: 'rgba(244, 67, 54, 0.8)',
          border: '2px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 8px rgba(244, 67, 54, 0.6)',
          animation: 'pulse 2s infinite'
        }}
      >
        {isAlive && (
          <Tooltip title="Report Body">
            <WarningIcon style={{ color: '#fff', fontSize: 18 }} />
          </Tooltip>
        )}
      </Box>
    </Zoom>
  );
};

// Map component
const Map = () => {
  const navigate = useNavigate();
  const { playerInfo, playerTasks, gameInfo, isImpostor, isAlive } = usePlayer();
  const { playerLocations, deadBodies, emitLocation } = useSocket();
  
  // State
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showPlayers, setShowPlayers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  // Set up locations
  useEffect(() => {
    if (gameInfo && gameInfo.locations) {
      setLocations(gameInfo.locations);
      setLoading(false);
    }
  }, [gameInfo]);
  
  // Get tasks for a specific location
  const getTasksForLocation = (locationId) => {
    if (!playerTasks) return [];
    return playerTasks.filter(task => task.location && task.location._id === locationId);
  };
  
  // Handle location click
  const handleLocationClick = (location) => {
    setSelectedLocation(location);
    
    // If player is alive, update their location
    if (isAlive) {
      emitLocation(location._id);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
    }
  };
  
  // Toggle player visibility
  const togglePlayerVisibility = () => {
    setShowPlayers(!showPlayers);
  };
  
  // Get current location of player
  const getCurrentLocationId = () => {
    if (!playerInfo || !playerInfo.currentLocation) return null;
    return playerInfo.currentLocation;
  };
  
  // Refresh map data
  const handleRefresh = () => {
    setRefreshing(true);
    // In a real app, we would fetch updated map data here
    setTimeout(() => setRefreshing(false), 1000);
  };
  
  // Get filtered locations
  const filteredLocations = React.useMemo(() => {
    if (filter === 'all') return locations;
    
    if (filter === 'tasks') {
      return locations.filter(location => 
        playerTasks.some(task => 
          task.location && task.location._id === location._id && !task.completed
        )
      );
    }
    
    return locations;
  }, [locations, playerTasks, filter]);
  
  // Get players at each location
  const getPlayersForLocations = () => {
    return Object.values(playerLocations || {});
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
          Loading map...
        </Typography>
      </Box>
    );
  }

  return (
    <Box p={2}>
      {/* Map Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5" fontWeight="bold" color="secondary">
          Game Map
        </Typography>
        
        <Box>
          <IconButton 
            onClick={togglePlayerVisibility}
            color={showPlayers ? 'primary' : 'default'}
            sx={{ mr: 1 }}
          >
            {showPlayers ? <VisibilityIcon /> : <VisibilityOffIcon />}
          </IconButton>
          
          <IconButton 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              <RefreshIcon />
            )}
          </IconButton>
        </Box>
      </Box>
      
      {/* Filters */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        mb={2}
      >
        <FilterListIcon sx={{ mr: 1, opacity: 0.6 }} />
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={handleFilterChange}
          aria-label="map filter"
          size="small"
          sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)' }}
        >
          <ToggleButton value="all">
            All Locations
          </ToggleButton>
          <ToggleButton value="tasks">
            Task Locations
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      {/* Map Container */}
      <Paper
        elevation={3}
        sx={{
          position: 'relative',
          borderRadius: 3,
          overflow: 'hidden',
          background: 'rgba(43, 47, 60, 0.7)',
          backdropFilter: 'blur(10px)',
          height: '60vh',
          width: '100%',
          mb: 3
        }}
      >
        {/* Map Background Image */}
        <Box
          sx={{
            backgroundImage: `url(${gameInfo?.mapImageUrl || '/map-placeholder.jpg'})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100%',
            width: '100%',
            position: 'relative',
            backgroundColor: 'rgba(0, 0, 0, 0.3)'
          }}
        >
          {/* Map Locations */}
          {filteredLocations.map(location => (
            <MapLocation
              key={location._id}
              location={location}
              players={getPlayersForLocations()}
              tasks={getTasksForLocation(location._id)}
              onLocationClick={handleLocationClick}
              isCurrentLocation={location._id === getCurrentLocationId()}
            />
          ))}
          
          {/* Player Markers */}
          {showPlayers && getPlayersForLocations().map(player => (
            <PlayerMarker
              key={player._id}
              player={player}
              currentPlayerId={playerInfo?._id}
              isImpostor={isImpostor}
            />
          ))}
          
          {/* Dead Bodies */}
          {deadBodies.map(body => (
            <DeadBodyMarker
              key={body.playerId}
              body={body}
              isImpostor={isImpostor}
              isAlive={isAlive}
            />
          ))}
        </Box>
      </Paper>
      
      {/* Selected Location Details */}
      {selectedLocation && (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'rgba(43, 47, 60, 0.7)',
            backdropFilter: 'blur(10px)',
            mb: 3
          }}
        >
          <Typography variant="h6" gutterBottom>
            {selectedLocation.name}
          </Typography>
          
          <Divider sx={{ my: 1.5 }} />
          
          <Typography variant="body2" paragraph>
            {selectedLocation.description || 'No description available.'}
          </Typography>
          
          {/* Tasks at this location */}
          {getTasksForLocation(selectedLocation._id).length > 0 ? (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Tasks at this location:
              </Typography>
              
              {getTasksForLocation(selectedLocation._id).map(task => (
                <Chip
                  key={task._id}
                  icon={<AssignmentIcon />}
                  label={task.name}
                  variant={task.completed ? "outlined" : "filled"}
                  color={task.completed ? "default" : "secondary"}
                  sx={{ m: 0.5 }}
                  onClick={() => navigate(`/game/tasks/${task._id}`)}
                />
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No tasks at this location.
            </Typography>
          )}
        </Paper>
      )}
      
      {/* Map Legend */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 3,
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }}
      >
        <Typography variant="subtitle2" gutterBottom>
          Map Legend
        </Typography>
        
        <Box
          display="flex"
          flexWrap="wrap"
          alignItems="center"
          gap={2}
          mt={1}
        >
          <Box display="flex" alignItems="center">
            <IconButton size="small" sx={{ bgcolor: 'rgba(103, 58, 183, 0.9)', color: '#fff', mr: 1 }}>
              <LocationOnIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption">Current Location</Typography>
          </Box>
          
          <Box display="flex" alignItems="center">
            <IconButton size="small" sx={{ bgcolor: 'rgba(255, 193, 7, 0.9)', color: '#fff', mr: 1 }}>
              <LocationOnIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption">Task Location</Typography>
          </Box>
          
          <Box display="flex" alignItems="center">
            <IconButton size="small" sx={{ bgcolor: 'rgba(158, 158, 158, 0.6)', color: '#fff', mr: 1 }}>
              <LocationOnIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption">Other Location</Typography>
          </Box>
          
          {isImpostor && (
            <Box display="flex" alignItems="center">
              <Box sx={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                bgcolor: '#F22929', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mr: 1
              }}>
                <PersonIcon style={{ color: '#fff', fontSize: 16 }} />
              </Box>
              <Typography variant="caption">Crewmate</Typography>
            </Box>
          )}
          
          <Box display="flex" alignItems="center">
            <Box sx={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              bgcolor: 'rgba(244, 67, 54, 0.8)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mr: 1
            }}>
              <WarningIcon style={{ color: '#fff', fontSize: 16 }} />
            </Box>
            <Typography variant="caption">Dead Body</Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* CSS for animations */}
      <style jsx="true">{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(103, 58, 183, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(103, 58, 183, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(103, 58, 183, 0);
          }
        }
      `}</style>
    </Box>
  );
};

export default Map;

// Mock player colors (replace with imported data in actual implementation)
const PLAYER_COLORS = [
  { id: 'red', name: 'Red', hex: '#F22929' },
  { id: 'blue', name: 'Blue', hex: '#31A2F2' },
  { id: 'green', name: 'Green', hex: '#5DF243' },
  { id: 'pink', name: 'Pink', hex: '#F261D4' },
  { id: 'orange', name: 'Orange', hex: '#F28422' },
  { id: 'yellow', name: 'Yellow', hex: '#F2BF27' },
  { id: 'black', name: 'Black', hex: '#3F474E' },
  { id: 'white', name: 'White', hex: '#D7E1F1' },
  { id: 'purple', name: 'Purple', hex: '#8F2BF2' },
  { id: 'brown', name: 'Brown', hex: '#916359' },
  { id: 'cyan', name: 'Cyan', hex: '#44E5EA' },
  { id: 'lime', name: 'Lime', hex: '#B8F243' }
];
