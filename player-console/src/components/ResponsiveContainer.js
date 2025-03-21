import React from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';

/**
 * ResponsiveContainer - A container component that adjusts its sizing and behavior
 * based on screen size, optimizing the layout for both desktop and mobile views.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to be rendered within the container
 * @param {Object} props.mobileStyles - Additional styles to apply on mobile devices
 * @param {Object} props.desktopStyles - Additional styles to apply on desktop devices 
 * @param {Object} props.sx - Additional styles that apply to both mobile and desktop
 * @returns {React.Component}
 */
const ResponsiveContainer = ({ 
  children, 
  mobileStyles = {}, 
  desktopStyles = {}, 
  sx = {} 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Base styles for all screen sizes
  const baseStyles = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    p: { xs: 2, sm: 3, md: 4 },
    boxSizing: 'border-box',
    overflow: 'auto',
    ...sx
  };

  // Merge with device-specific styles
  const finalStyles = {
    ...baseStyles,
    ...(isMobile ? mobileStyles : desktopStyles)
  };

  return (
    <Box sx={finalStyles}>
      {children}
    </Box>
  );
};

export default ResponsiveContainer;
