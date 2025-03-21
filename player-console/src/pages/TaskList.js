import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  CircularProgress,
  LinearProgress,
  Collapse,
  Divider,
  Alert,
  Card,
  CardContent
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import RoomIcon from '@mui/icons-material/Room';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RefreshIcon from '@mui/icons-material/Refresh';
import { usePlayer } from '../contexts/PlayerContext';

const TaskList = () => {
  const navigate = useNavigate();
  const { playerTasks, fetchTasks, loading, isImpostor, gameInfo } = usePlayer();
  
  // State
  const [taskProgress, setTaskProgress] = useState(0);
  const [expandedTask, setExpandedTask] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFakeTasks, setShowFakeTasks] = useState(false);

  // Calculate task progress
  useEffect(() => {
    if (playerTasks && playerTasks.length > 0) {
      const completedTasks = playerTasks.filter(task => task.completed).length;
      const totalTasks = playerTasks.length;
      const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      setTaskProgress(progress);
    }
  }, [playerTasks]);

  // Handle task refresh
  const handleRefreshTasks = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  // Handle task click
  const handleTaskClick = (taskId) => {
    navigate(`/game/tasks/${taskId}`);
  };

  // Toggle task details
  const handleToggleTask = (taskId) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  // Group tasks by location
  const groupedTasks = React.useMemo(() => {
    if (!playerTasks || playerTasks.length === 0) return {};
    
    const grouped = {};
    
    playerTasks.forEach(task => {
      const locationName = task.location?.name || 'Unknown Location';
      
      if (!grouped[locationName]) {
        grouped[locationName] = [];
      }
      
      grouped[locationName].push(task);
    });
    
    return grouped;
  }, [playerTasks]);

  // Check if there are no tasks
  const noTasks = !playerTasks || playerTasks.length === 0;

  // If loading, show loading spinner
  if (loading && !refreshing) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="calc(100vh - 120px)"
      >
        <CircularProgress size={60} color="secondary" />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading tasks...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      px={2}
      pt={2}
      pb={4}
    >
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
        px={1}
      >
        <Typography variant="h5" fontWeight="bold" color="secondary">
          Your Tasks
        </Typography>
        
        <IconButton 
          color="primary" 
          onClick={handleRefreshTasks}
          disabled={refreshing}
        >
          {refreshing ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            <RefreshIcon />
          )}
        </IconButton>
      </Box>
      
      {/* Task Progress */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          background: 'rgba(43, 47, 60, 0.7)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body1">
            Task Progress:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {playerTasks.filter(task => task.completed).length}/{playerTasks.length}
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={taskProgress}
          color="secondary"
          sx={{ 
            height: 10,
            borderRadius: 5,
            mb: 1
          }}
        />
        
        {isImpostor && (
          <Box mt={2}>
            <Alert 
              severity="warning" 
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              As an impostor, completing tasks is optional. They are only for blending in!
            </Alert>
            
            <Box display="flex" justifyContent="flex-end" mt={1}>
              <Chip
                label={showFakeTasks ? "Hide Task Info" : "Show Task Info"}
                size="small"
                color="secondary"
                variant="outlined"
                onClick={() => setShowFakeTasks(!showFakeTasks)}
              />
            </Box>
          </Box>
        )}
      </Paper>
      
      {/* Game Information */}
      {gameInfo && (
        <Card sx={{ mb: 3, borderRadius: 3, bgcolor: 'rgba(43, 47, 60, 0.7)' }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              Game Status
            </Typography>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">
                {gameInfo.name || "Among Us IRL"}
              </Typography>
              <Chip 
                label={gameInfo.status === 'in-progress' ? 'In Progress' : gameInfo.status}
                color="primary"
                size="small"
              />
            </Box>
            
            {gameInfo.taskBarUpdates === 'meetings' && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Task progress updates during meetings
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Task List */}
      {noTasks ? (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(43, 47, 60, 0.5)'
          }}
        >
          <AssignmentIcon sx={{ fontSize: 40, opacity: 0.5, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Tasks Assigned
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center">
            {isImpostor
              ? "As an impostor, you don't have real tasks. Pretend to complete tasks to blend in!"
              : "Waiting for tasks to be assigned. Check back soon or try refreshing."}
          </Typography>
        </Paper>
      ) : (
        Object.entries(groupedTasks).map(([location, tasks]) => (
          <Paper
            key={location}
            elevation={3}
            sx={{
              mb: 3,
              borderRadius: 3,
              overflow: 'hidden',
              background: 'rgba(43, 47, 60, 0.7)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <Box
              sx={{
                py: 1,
                px: 2,
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <RoomIcon sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight="medium">
                {location}
              </Typography>
              <Box flexGrow={1} />
              <Chip
                size="small"
                label={`${tasks.filter(t => t.completed).length}/${tasks.length}`}
                color={tasks.every(t => t.completed) ? "success" : "default"}
                variant={tasks.every(t => t.completed) ? "filled" : "outlined"}
              />
            </Box>
            
            <List disablePadding>
              {tasks.map((task, index) => (
                <React.Fragment key={task._id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItem>
                    <ListItemIcon>
                      {task.completed ? (
                        <CheckCircleIcon color="success" />
                      ) : (
                        <RadioButtonUncheckedIcon color="disabled" />
                      )}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={task.name}
                      secondary={
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          component="span"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mt: 0.5
                          }}
                        >
                          {task.type}{' '}
                          {task.shortDescription && (
                            <IconButton 
                              size="small" 
                              sx={{ ml: 0.5, p: 0.5 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleTask(task._id);
                              }}
                            >
                              {expandedTask === task._id ? (
                                <ExpandLessIcon fontSize="small" />
                              ) : (
                                <ExpandMoreIcon fontSize="small" />
                              )}
                            </IconButton>
                          )}
                        </Typography>
                      }
                    />
                    
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        disabled={task.completed && !isImpostor}
                        onClick={() => handleTaskClick(task._id)}
                      >
                        <ChevronRightIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  
                  {task.shortDescription && (
                    <Collapse in={expandedTask === task._id} timeout="auto" unmountOnExit>
                      <Box sx={{ pl: 8, pr: 2, pb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          {task.shortDescription}
                        </Typography>
                      </Box>
                    </Collapse>
                  )}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        ))
      )}
      
      {/* Task Info for Impostors */}
      {isImpostor && showFakeTasks && (
        <Paper
          elevation={3}
          sx={{
            p: 3,
            mt: 2,
            borderRadius: 3,
            backgroundColor: 'rgba(242, 41, 41, 0.2)',
            border: '1px solid rgba(242, 41, 41, 0.4)'
          }}
        >
          <Box display="flex" alignItems="center" mb={2}>
            <InfoIcon color="error" sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight="medium" color="error">
              Impostor Tips
            </Typography>
          </Box>
          
          <Typography variant="body2" paragraph>
            These tasks are <b>fake</b>. You can pretend to complete them to blend in with crewmates.
          </Typography>
          
          <Typography variant="body2" paragraph>
            Visit task locations and stand near them for a believable amount of time. 
            Try to be seen entering and leaving task areas.
          </Typography>
          
          <Typography variant="body2">
            Remember: Your main objective is to eliminate crewmates without being caught!
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default TaskList;
