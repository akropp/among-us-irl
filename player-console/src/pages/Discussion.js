import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Button,
  IconButton,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  LinearProgress,
  Zoom,
  Slide,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import TimerIcon from '@mui/icons-material/Timer';
import PersonIcon from '@mui/icons-material/Person';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import BlockIcon from '@mui/icons-material/Block';
import WarningIcon from '@mui/icons-material/Warning';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';
import { PLAYER_COLORS } from '../config/api';

// Message component
const ChatMessage = ({ message, playerInfo }) => {
  // Get the message style based on sender
  const getMessageStyle = () => {
    // System message
    if (message.systemMessage) {
      return {
        backgroundColor: 'rgba(103, 58, 183, 0.2)',
        color: '#fff',
        borderRadius: 2,
        p: 1.5,
        width: '100%',
        textAlign: 'center',
        mx: 0,
        mb: 1.5
      };
    }
    
    // Self message
    if (message.sender?._id === playerInfo?._id) {
      return {
        backgroundColor: 'rgba(103, 58, 183, 0.7)',
        color: '#fff',
        borderRadius: 2,
        py: 1.5,
        px: 2,
        ml: 'auto',
        mr: 1,
        maxWidth: '80%'
      };
    }
    
    // Other player message
    return {
      backgroundColor: 'rgba(55, 65, 81, 0.9)',
      color: '#fff',
      borderRadius: 2,
      py: 1.5,
      px: 2,
      ml: 1,
      mr: 'auto',
      maxWidth: '80%'
    };
  };
  
  // Get player color
  const getPlayerColor = () => {
    if (!message.sender || !message.sender.color) return '#F22929';
    const colorObj = PLAYER_COLORS.find(c => c.id === message.sender.color);
    return colorObj?.hex || '#F22929';
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mb: 2 }}>
      {/* Sender name for other player messages */}
      {message.sender && message.sender._id !== playerInfo?._id && !message.systemMessage && (
        <Typography 
          variant="caption" 
          sx={{ ml: 2, mb: 0.5, color: 'rgba(255, 255, 255, 0.7)' }}
        >
          {message.sender.name}
        </Typography>
      )}
      
      {/* Message content */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {/* Sender avatar for other player messages */}
        {message.sender && message.sender._id !== playerInfo?._id && !message.systemMessage && (
          <Avatar 
            sx={{ 
              bgcolor: getPlayerColor(),
              width: 36, 
              height: 36
            }}
          >
            {message.sender.name[0].toUpperCase()}
          </Avatar>
        )}
        
        {/* Message bubble */}
        <Box sx={getMessageStyle()}>
          {message.systemMessage ? (
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              {message.content}
            </Typography>
          ) : (
            <Typography variant="body1">
              {message.content}
            </Typography>
          )}
          
          {/* Message time */}
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              textAlign: message.sender?._id === playerInfo?._id ? 'right' : 'left',
              mt: 0.5,
              opacity: 0.7
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Typography>
        </Box>
        
        {/* Self avatar for own messages */}
        {message.sender && message.sender._id === playerInfo?._id && (
          <Avatar 
            sx={{ 
              bgcolor: getPlayerColor(),
              width: 36, 
              height: 36
            }}
          >
            {message.sender.name[0].toUpperCase()}
          </Avatar>
        )}
      </Box>
    </Box>
  );
};

// Discussion component
const Discussion = () => {
  const navigate = useNavigate();
  const { 
    playerInfo, 
    gameInfo, 
    isAlive, 
    isImpostor,
    playerTasks,
    votePlayer
  } = usePlayer();
  const { 
    chatMessages, 
    setChatMessages, 
    sendChatMessage,
    isConnected
  } = useSocket();
  
  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  
  // State
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [discussionPhase, setDiscussionPhase] = useState('discussion'); // 'discussion' or 'voting'
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [votingComplete, setVotingComplete] = useState(false);
  const [playersInMeeting, setPlayersInMeeting] = useState([]);
  const [deadPlayerReported, setDeadPlayerReported] = useState(null);
  const [reporterPlayer, setReporterPlayer] = useState(null);
  const [votingResults, setVotingResults] = useState(null);
  
  // Set up discussion timer when game info changes
  useEffect(() => {
    if (gameInfo) {
      // Get discussion time from game settings or use defaults
      const discussionTime = gameInfo.discussionTime || 60;
      const votingTime = gameInfo.votingTime || 30;
      
      // Set initial time
      setTimeLeft(discussionTime);
      setDiscussionPhase('discussion');
      
      // Start the timer
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // When discussion time ends, switch to voting phase
            if (discussionPhase === 'discussion') {
              setDiscussionPhase('voting');
              return votingTime;
            } else {
              // When voting time ends, clear interval
              clearInterval(timer);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
      
      // Clear interval on unmount
      return () => clearInterval(timer);
    }
  }, [gameInfo]);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
  // Focus on input when discussion phase changes
  useEffect(() => {
    if (discussionPhase === 'discussion' && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [discussionPhase]);
  
  // Set up players in meeting when game info changes
  useEffect(() => {
    if (gameInfo && gameInfo.players) {
      // Only include alive players in the meeting
      const alivePlayers = gameInfo.players.filter(player => player.isAlive);
      setPlayersInMeeting(alivePlayers);
    }
  }, [gameInfo]);
  
  // Add system messages when discussion/voting starts
  useEffect(() => {
    // Add discussion start message
    if (discussionPhase === 'discussion') {
      const discussionStartMessage = {
        systemMessage: true,
        content: deadPlayerReported 
          ? `${reporterPlayer?.name || 'Someone'} reported ${deadPlayerReported?.name || 'a dead body'}!`
          : 'Emergency meeting called!',
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [discussionStartMessage, ...prev]);
    }
    
    // Add voting start message
    if (discussionPhase === 'voting') {
      const votingStartMessage = {
        systemMessage: true,
        content: 'Voting has started. Choose who to eject or skip your vote.',
        timestamp: new Date().toISOString()
      };
      
      setChatMessages(prev => [...prev, votingStartMessage]);
    }
  }, [discussionPhase]);
  
  // Handle game status change
  useEffect(() => {
    // If game is no longer in discussion or voting phase, redirect
    if (gameInfo && gameInfo.status !== 'discussion' && gameInfo.status !== 'voting') {
      navigate('/game/tasks');
    }
  }, [gameInfo?.status, navigate]);
  
  // Handle message input change
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };
  
  // Handle message send
  const handleSendMessage = () => {
    if (message.trim() && isConnected && isAlive) {
      // Only alive players can send messages
      sendChatMessage(message.trim());
      setMessage('');
    }
  };
  
  // Handle input key press (send on Enter)
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle player selection for voting
  const handlePlayerSelect = (player) => {
    if (discussionPhase !== 'voting' || !isAlive || votingComplete) return;
    
    // Can't vote for yourself
    if (player._id === playerInfo._id) return;
    
    setSelectedPlayer(player);
    setConfirmDialogOpen(true);
  };
  
  // Handle vote confirmation
  const handleConfirmVote = async () => {
    if (!selectedPlayer) return;
    
    // Submit vote
    await votePlayer(selectedPlayer._id);
    setConfirmDialogOpen(false);
    setVotingComplete(true);
    
    // Add system message for vote
    const voteMessage = {
      systemMessage: true,
      content: `You voted for ${selectedPlayer.name}`,
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, voteMessage]);
  };
  
  // Handle skip vote
  const handleSkipVote = async () => {
    // Submit skip vote (null player ID)
    await votePlayer(null);
    setVotingComplete(true);
    
    // Add system message for skip
    const skipMessage = {
      systemMessage: true,
      content: 'You skipped your vote',
      timestamp: new Date().toISOString()
    };
    
    setChatMessages(prev => [...prev, skipMessage]);
  };
  
  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Get progress value for timer
  const getTimerProgress = () => {
    if (discussionPhase === 'discussion') {
      return (timeLeft / (gameInfo?.discussionTime || 60)) * 100;
    } else {
      return (timeLeft / (gameInfo?.votingTime || 30)) * 100;
    }
  };
  
  // Get player color
  const getPlayerColor = (colorId) => {
    const colorObj = PLAYER_COLORS.find(c => c.id === colorId);
    return colorObj?.hex || '#F22929';
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="calc(100vh - 120px)"
    >
      {/* Header */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: { xs: 0, sm: 3 },
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          background: discussionPhase === 'voting' 
            ? 'linear-gradient(rgba(25, 118, 210, 0.8), rgba(25, 118, 210, 0.6))'
            : 'linear-gradient(rgba(103, 58, 183, 0.8), rgba(103, 58, 183, 0.6))',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="bold">
            {discussionPhase === 'voting' ? 'Voting' : 'Discussion'}
          </Typography>
          
          <Chip
            icon={<TimerIcon />}
            label={formatTime(timeLeft)}
            color={timeLeft < 10 ? 'error' : 'default'}
            variant="outlined"
            sx={{ borderColor: 'rgba(255, 255, 255, 0.5)', color: '#fff' }}
          />
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={getTimerProgress()}
          sx={{ 
            mt: 1.5,
            height: 6,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.2)'
          }}
        />
        
        {discussionPhase === 'voting' && (
          <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'rgba(255, 255, 255, 0.9)' }}>
            {votingComplete 
              ? 'Vote submitted. Waiting for other players...'
              : 'Vote for who you think is the Impostor. Choose carefully!'}
          </Typography>
        )}
      </Paper>
      
      {/* Content - Different based on phase */}
      {discussionPhase === 'discussion' ? (
        <Box
          display="flex"
          flexDirection="column"
          flexGrow={1}
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            position: 'relative'
          }}
        >
          {/* Chat Messages */}
          <Box
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start'
            }}
          >
            {chatMessages.length === 0 ? (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                width="100%"
                height="100%"
              >
                <Typography variant="body2" color="text.secondary" align="center">
                  The discussion has started. Share your findings and suspicions.
                </Typography>
              </Box>
            ) : (
              chatMessages.map((msg, index) => (
                <ChatMessage key={index} message={msg} playerInfo={playerInfo} />
              ))
            )}
            <div ref={messagesEndRef} />
          </Box>
          
          {/* Message Input */}
          <Box
            sx={{
              p: 2,
              backgroundColor: 'rgba(43, 47, 60, 0.9)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Box display="flex" alignItems="center">
              <TextField
                fullWidth
                placeholder={
                  isAlive 
                    ? "Type your message..." 
                    : "You are dead. Only other ghosts can see your messages."
                }
                variant="outlined"
                value={message}
                onChange={handleMessageChange}
                onKeyPress={handleKeyPress}
                inputRef={messageInputRef}
                disabled={!isAlive || !isConnected}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    backgroundColor: 'rgba(0, 0, 0, 0.2)'
                  }
                }}
              />
              
              <IconButton
                color="secondary"
                sx={{ ml: 1 }}
                onClick={handleSendMessage}
                disabled={!message.trim() || !isAlive || !isConnected}
              >
                <SendIcon />
              </IconButton>
            </Box>
            
            {!isConnected && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                You are disconnected. Reconnecting...
              </Typography>
            )}
            
            {!isAlive && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Dead players can only chat with other dead players.
              </Typography>
            )}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            flexGrow: 1,
            overflowY: 'auto',
            p: 2
          }}
        >
          {/* Voting Section */}
          {!isAlive ? (
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: 'rgba(43, 47, 60, 0.7)',
                textAlign: 'center',
                mt: 2
              }}
            >
              <PersonOffIcon sx={{ fontSize: 48, opacity: 0.7, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                You are Dead
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dead players cannot vote. You can only observe the outcome.
              </Typography>
            </Paper>
          ) : votingComplete ? (
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 3,
                backgroundColor: 'rgba(43, 47, 60, 0.7)',
                textAlign: 'center',
                mt: 2
              }}
            >
              <HowToVoteIcon sx={{ fontSize: 48, opacity: 0.7, mb: 2, color: 'secondary.main' }} />
              <Typography variant="h6" gutterBottom>
                Vote Submitted
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You've cast your vote. Waiting for other players to vote...
              </Typography>
              <LinearProgress 
                sx={{ mt: 3, mb: 2, borderRadius: 1 }} 
                color="secondary"
              />
            </Paper>
          ) : (
            <Box>
              <Typography 
                variant="subtitle1" 
                fontWeight="medium" 
                sx={{ mb: 2, display: 'flex', alignItems: 'center' }}
              >
                <HowToVoteIcon sx={{ mr: 1 }} />
                Choose who to vote for:
              </Typography>
              
              <Grid container spacing={2}>
                {playersInMeeting.map(player => (
                  <Grid item xs={6} sm={4} md={3} key={player._id}>
                    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                      <Paper
                        elevation={3}
                        onClick={() => handlePlayerSelect(player)}
                        sx={{
                          p: 2,
                          borderRadius: 3,
                          backgroundColor: 'rgba(43, 47, 60, 0.7)',
                          border: player._id === playerInfo._id 
                            ? '2px solid rgba(255, 255, 255, 0.3)' 
                            : '1px solid rgba(255, 255, 255, 0.1)',
                          cursor: player._id === playerInfo._id ? 'default' : 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': player._id !== playerInfo._id ? {
                            backgroundColor: 'rgba(103, 58, 183, 0.3)',
                            transform: 'translateY(-2px)'
                          } : {}
                        }}
                      >
                        <Box
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Avatar
                            sx={{
                              bgcolor: getPlayerColor(player.color),
                              width: 56,
                              height: 56,
                              mb: 1
                            }}
                          >
                            {player.name[0].toUpperCase()}
                          </Avatar>
                          
                          <Typography 
                            variant="body2" 
                            align="center"
                            sx={{
                              fontWeight: player._id === playerInfo._id ? 'bold' : 'normal'
                            }}
                          >
                            {player.name}
                            {player._id === playerInfo._id && ' (You)'}
                          </Typography>
                        </Box>
                      </Paper>
                    </Zoom>
                  </Grid>
                ))}
                
                {/* Skip Vote Option */}
                <Grid item xs={6} sm={4} md={3}>
                  <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                    <Paper
                      elevation={3}
                      onClick={handleSkipVote}
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        backgroundColor: 'rgba(43, 47, 60, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          backgroundColor: 'rgba(103, 58, 183, 0.3)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Avatar
                          sx={{
                            bgcolor: 'rgba(0, 0, 0, 0.5)',
                            width: 56,
                            height: 56,
                            mb: 1
                          }}
                        >
                          <BlockIcon />
                        </Avatar>
                        
                        <Typography variant="body2" align="center">
                          Skip Vote
                        </Typography>
                      </Box>
                    </Paper>
                  </Zoom>
                </Grid>
              </Grid>
            </Box>
          )}
        </Box>
      )}
      
      {/* Voting Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: 'background.paper'
          }
        }}
      >
        <DialogTitle>Confirm Vote</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to vote for <strong>{selectedPlayer?.name}</strong>? This action cannot be undone.
          </DialogContentText>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            mt={2}
          >
            <Avatar
              sx={{
                bgcolor: selectedPlayer ? getPlayerColor(selectedPlayer.color) : 'primary.main',
                width: 64,
                height: 64
              }}
            >
              {selectedPlayer?.name[0].toUpperCase()}
            </Avatar>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmVote} 
            variant="contained"
            color="primary"
            startIcon={<HowToVoteIcon />}
          >
            Confirm Vote
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Discussion;
