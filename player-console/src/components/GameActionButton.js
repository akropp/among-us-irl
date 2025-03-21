import React from 'react';
import { 
  Button, 
  useMediaQuery, 
  useTheme, 
  Typography, 
  Box 
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled button for game actions with responsive sizing and animations
const ActionButton = styled(Button)(({ theme, color = 'primary', size = 'large', disabled }) => ({
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 'bold',
  padding: '12px 24px',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  backgroundColor: disabled ? 
    theme.palette.action.disabledBackground : 
    theme.palette[color].main,
  color: theme.palette[color].contrastText,
  fontSize: size === 'large' ? '1.2rem' : '1rem',
  
  // Mobile styling adjustments
  [theme.breakpoints.down('sm')]: {
    padding: '10px 20px',
    fontSize: size === 'large' ? '1rem' : '0.875rem',
    width: size === 'large' ? '100%' : 'auto',
  },
  
  '&:hover': {
    backgroundColor: disabled ? 
      theme.palette.action.disabledBackground : 
      theme.palette[color].dark,
    transform: disabled ? 'none' : 'translateY(-3px)',
    boxShadow: disabled ? 
      '0 4px 8px rgba(0, 0, 0, 0.2)' : 
      '0 6px 12px rgba(0, 0, 0, 0.3)',
  },
  
  '&:active': {
    transform: 'translateY(1px)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
  
  // Ripple effect for click feedback
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    pointerEvents: 'none',
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 10%, transparent 10.01%)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '50%',
    transform: 'scale(10, 10)',
    opacity: 0,
    transition: 'transform 0.4s, opacity 0.8s',
  },
  
  '&:active::after': {
    transform: 'scale(0, 0)',
    opacity: 0.3,
    transition: '0s',
  },
}));

/**
 * GameActionButton - A styled button component designed specifically for game actions
 * with responsive behavior and visual feedback.
 * 
 * @param {Object} props
 * @param {string} props.label - Text to display on the button
 * @param {string} props.color - MUI color theme to use (primary, secondary, error, etc.)
 * @param {string} props.size - Button size (large, medium, small)
 * @param {function} props.onClick - Click handler function
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {string} props.icon - Optional icon component to display
 * @param {string} props.cooldownTime - Optional cooldown time to display
 * @param {Object} props.sx - Additional styles to apply
 * @returns {React.Component}
 */
const GameActionButton = ({ 
  label, 
  color = 'primary', 
  size = 'large', 
  onClick, 
  disabled = false, 
  icon, 
  cooldownTime,
  sx = {}
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <ActionButton 
      color={color} 
      size={size} 
      onClick={onClick} 
      disabled={disabled}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        ...sx
      }}
    >
      {icon && (
        <Box 
          component="span" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center',
            fontSize: isMobile ? '1.2rem' : '1.5rem'
          }}
        >
          {icon}
        </Box>
      )}
      
      <Typography 
        variant={isMobile ? "button" : "h6"} 
        component="span"
        sx={{ fontWeight: 'bold' }}
      >
        {label}
      </Typography>
      
      {cooldownTime && (
        <Typography 
          variant="caption" 
          component="span"
          sx={{ 
            ml: 1, 
            bgcolor: 'rgba(0,0,0,0.2)', 
            px: 1, 
            py: 0.5, 
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          {cooldownTime}
        </Typography>
      )}
    </ActionButton>
  );
};

export default GameActionButton;
