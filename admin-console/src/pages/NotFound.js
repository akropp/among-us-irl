import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFound = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      bgcolor="#121212"
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 5, 
          maxWidth: 500, 
          textAlign: 'center',
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          color: 'white',
          borderRadius: 2
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 80, color: '#e91e63', mb: 2 }} />
        <Typography variant="h4" gutterBottom>
          Error 404: Page Not Found
        </Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          The page you're looking for was ejected into space... or it never existed.
        </Typography>
        <Button 
          component={Link} 
          to="/dashboard" 
          variant="contained" 
          color="primary"
          size="large"
        >
          Back to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;
