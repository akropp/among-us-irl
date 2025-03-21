import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Dialog,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Alert,
  Snackbar,
  Zoom,
  Badge
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CloseIcon from '@mui/icons-material/Close';
import InfoIcon from '@mui/icons-material/Info';
import { usePlayer } from '../contexts/PlayerContext';
import { useSocket } from '../contexts/SocketContext';
import QrReader from 'react-qr-reader';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playerTasks, completeTask, isImpostor } = usePlayer();
  const { triggerVisualEffect } = useSocket();
  
  // Refs
  const qrReaderRef = useRef(null);
  
  // State
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [completionStatus, setCompletionStatus] = useState({
    loading: false,
    success: false,
    error: null
  });
  const [fakingTask, setFakingTask] = useState(false);
  const [fakingProgress, setFakingProgress] = useState(0);
  const [fakeTaskComplete, setFakeTaskComplete] = useState(false);
  
  // Find the task
  useEffect(() => {
    if (playerTasks && playerTasks.length > 0) {
      const foundTask = playerTasks.find(t => t._id === id);
      if (foundTask) {
        setTask(foundTask);
        
        // Set active step based on completion status
        if (foundTask.completed) {
          setActiveStep(Number.MAX_SAFE_INTEGER); // Set to a high number to show all steps completed
        }
      } else {
        // Task not found
        navigate('/game/tasks');
      }
      setLoading(false);
    }
  }, [id, playerTasks, navigate]);
  
  // Generate task steps from description
  const taskSteps = React.useMemo(() => {
    if (!task) return [];
    
    // Split task description by newlines or periods to create steps
    if (task.description) {
      return task.description
        .split(/\.\s+|\n+/)
        .filter(step => step.trim().length > 0)
        .map(step => step.trim());
    }
    
    return ['Go to the task location', 'Complete the assigned task'];
  }, [task]);
  
  // Handle QR code scan
  const handleScan = async (data) => {
    if (data) {
      setScanning(true);
      
      try {
        // Extract task ID and verification data from QR code
        const scannedData = JSON.parse(data);
        
        if (scannedData.taskId === task._id) {
          // Correct QR code for this task
          setScanSuccess(true);
          
          // Update UI
          setCompletionStatus({
            loading: true,
            success: false,
            error: null
          });
          
          // Complete the task
          await completeTask(task._id, 'qr', scannedData.verificationToken);
          
          // Update UI
          setCompletionStatus({
            loading: false,
            success: true,
            error: null
          });
          
          // Show completion effect
          triggerVisualEffect('taskComplete');
          
          // Close the scanner
          setTimeout(() => {
            setScannerOpen(false);
            setActiveStep(Number.MAX_SAFE_INTEGER); // Mark all steps as completed
          }, 1500);
        } else {
          // Wrong QR code
          setScanError('This QR code is for a different task. Please find the correct QR code.');
        }
      } catch (error) {
        // Invalid QR code
        setScanError('Invalid QR code. Please try again.');
      }
      
      setScanning(false);
    }
  };
  
  // Handle scan error
  const handleScanError = (err) => {
    console.error('QR scan error:', err);
    setScanError('Error accessing camera. Please check permissions and try again.');
  };
  
  // Navigate back
  const handleBack = () => {
    navigate('/game/tasks');
  };
  
  // Open QR scanner
  const handleOpenScanner = () => {
    setScannerOpen(true);
    setScanError('');
    setScanSuccess(false);
  };
  
  // Close QR scanner
  const handleCloseScanner = () => {
    setScannerOpen(false);
    setScanError('');
  };
  
  // Reset scan error
  const handleCloseScanError = () => {
    setScanError('');
  };
  
  // Advance to next step
  const handleNextStep = () => {
    setActiveStep((prevStep) => Math.min(prevStep + 1, taskSteps.length));
  };
  
  // Fake task completion (for impostors)
  const handleFakeTask = () => {
    setFakingTask(true);
    
    // Simulate random progress updates
    const fakeInterval = setInterval(() => {
      setFakingProgress(prev => {
        const newProgress = prev + Math.random() * 15;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 300);
    
    // Complete the fake task after a random time
    const fakeTime = 3000 + Math.random() * 3000;
    setTimeout(() => {
      clearInterval(fakeInterval);
      setFakingProgress(100);
      setFakeTaskComplete(true);
      
      // Pretend the task was completed
      setTimeout(() => {
        setActiveStep(Number.MAX_SAFE_INTEGER);
      }, 500);
    }, fakeTime);
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
          Loading task...
        </Typography>
      </Box>
    );
  }
  
  // If task not found, show error
  if (!task) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        p={3}
        minHeight="calc(100vh - 120px)"
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          Task not found
        </Alert>
        <Button 
          variant="contained" 
          color="primary"
          onClick={handleBack}
        >
          Back to Tasks
        </Button>
      </Box>
    );
  }

  return (
    <Box p={2}>
      {/* Header */}
      <Box
        display="flex"
        alignItems="center"
        mb={2}
      >
        <IconButton onClick={handleBack}>
          <ArrowBackIcon />
        </IconButton>
        
        <Typography variant="h5" component="h1" fontWeight="bold" sx={{ ml: 1 }}>
          {task.name}
        </Typography>
        
        {task.completed && (
          <Badge 
            color="success"
            sx={{ ml: 1 }}
            badgeContent={<CheckCircleIcon fontSize="small" />} 
          />
        )}
      </Box>
      
      {/* Task Info */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: 'rgba(43, 47, 60, 0.7)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Box
          display="flex"
          alignItems="center"
          mb={2}
        >
          <LocationOnIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="subtitle1">
            {task.location?.name || 'Unknown Location'}
          </Typography>
          <Box flexGrow={1} />
          <Chip
            label={task.type}
            size="small"
            variant="outlined"
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Task Image (if available) */}
        {task.imageUrl && (
          <Box 
            mb={2} 
            display="flex" 
            justifyContent="center"
            borderRadius={2}
            overflow="hidden"
            boxShadow={1}
          >
            <img 
              src={task.imageUrl} 
              alt={task.name} 
              style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'cover' }} 
            />
          </Box>
        )}
        
        {/* Task Description */}
        <Typography variant="body1" paragraph>
          {task.shortDescription || 'Complete this task to help the crew.'}
        </Typography>
        
        {/* Impostor Warning */}
        {isImpostor && (
          <Alert 
            severity="warning" 
            variant="outlined"
            sx={{ mt: 2, borderRadius: 2 }}
          >
            As an impostor, you can fake this task without actually completing it. Use this time to plan your next move.
          </Alert>
        )}
      </Paper>
      
      {/* Task Steps */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          background: 'rgba(43, 47, 60, 0.7)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <Typography variant="h6" gutterBottom>
          Task Steps
        </Typography>
        
        <Stepper 
          activeStep={activeStep} 
          orientation="vertical"
          sx={{ 
            my: 2,
            '& .MuiStepLabel-root': {
              cursor: !task.completed && !fakeTaskComplete ? 'pointer' : 'default'
            }
          }}
        >
          {taskSteps.map((step, index) => (
            <Step key={index}>
              <StepLabel onClick={() => !task.completed && !fakeTaskComplete && handleNextStep()}>
                <Typography variant="body2">{step}</Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {/* Action Button */}
        {!task.completed && !fakeTaskComplete && (
          isImpostor ? (
            <Box sx={{ mt: 3 }}>
              {fakingTask ? (
                <Box sx={{ textAlign: 'center' }}>
                  <CircularProgress 
                    variant="determinate" 
                    value={fakingProgress} 
                    size={60} 
                    thickness={5}
                    color="secondary"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Faking task... {Math.round(fakingProgress)}%
                  </Typography>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  fullWidth
                  onClick={handleFakeTask}
                  sx={{ borderRadius: 2, py: 1.5 }}
                >
                  Fake Task Completion
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                fullWidth
                onClick={handleOpenScanner}
                disabled={completionStatus.loading}
                sx={{ borderRadius: 2, py: 1.5 }}
                startIcon={<QrCodeScannerIcon />}
              >
                {completionStatus.loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Scan QR Code to Complete'
                )}
              </Button>
              
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>
                Look for a QR code at the task location
              </Typography>
            </Box>
          )
        )}
        
        {/* Completion Status */}
        {(task.completed || fakeTaskComplete) && (
          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(46, 125, 50, 0.1)',
              border: '1px solid rgba(46, 125, 50, 0.3)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
            <Typography variant="body2" color="success.main" fontWeight="medium">
              {isImpostor && fakeTaskComplete 
                ? "Task faked successfully! No one will suspect you."
                : "Task completed successfully!"}
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* Task Tips */}
      <Paper
        elevation={2}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          backgroundColor: 'rgba(0, 0, 0, 0.3)'
        }}
      >
        <Box display="flex" alignItems="center" mb={1}>
          <InfoIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
          <Typography variant="subtitle2">
            Task Tips
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          {isImpostor
            ? "As an impostor, spend a realistic amount of time at the task location to avoid suspicion. Watch out for crewmates who might be observing you."
            : "Make sure you're at the correct location before scanning. If you're having trouble, ask a crewmate for help but be careful who you trust!"}
        </Typography>
      </Paper>
      
      {/* QR Scanner Dialog */}
      <Dialog
        open={scannerOpen}
        onClose={handleCloseScanner}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: '#000',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.7)' }
            }}
            onClick={handleCloseScanner}
          >
            <CloseIcon />
          </IconButton>
          
          <DialogContent sx={{ p: 0 }}>
            {!scanSuccess ? (
              <Box sx={{ position: 'relative' }}>
                <QrReader
                  ref={qrReaderRef}
                  delay={300}
                  onError={handleScanError}
                  onScan={handleScan}
                  style={{ width: '100%' }}
                  facingMode="environment"
                />
                
                {/* Scanner overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    border: '2px solid rgba(255, 255, 255, 0.5)',
                    borderRadius: 2,
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '60%',
                      height: '60%',
                      transform: 'translate(-50%, -50%)',
                      border: '2px solid rgba(103, 58, 183, 0.8)',
                      borderRadius: 1
                    }
                  }}
                />
                
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Typography variant="body2" color="white" align="center">
                    Scan the QR code at the task location
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                p={4}
                bgcolor="background.paper"
              >
                <Zoom in={true}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
                </Zoom>
                <Typography variant="h5" align="center" gutterBottom>
                  QR Code Scanned!
                </Typography>
                <Typography variant="body1" align="center" color="text.secondary">
                  Task is being completed...
                </Typography>
                {completionStatus.loading && (
                  <CircularProgress size={30} sx={{ mt: 2 }} />
                )}
              </Box>
            )}
          </DialogContent>
          
          <DialogActions sx={{ 
            justifyContent: 'center', 
            p: 2, 
            backgroundColor: 'rgba(0, 0, 0, 0.7)'
          }}>
            <Button 
              onClick={handleCloseScanner} 
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      
      {/* Error Snackbar */}
      <Snackbar
        open={!!scanError}
        autoHideDuration={6000}
        onClose={handleCloseScanError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseScanError} 
          severity="error" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {scanError}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskDetail;
