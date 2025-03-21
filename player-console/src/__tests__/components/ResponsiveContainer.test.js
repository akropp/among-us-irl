import React from 'react';
import { render, screen } from '@testing-library/react';
import ResponsiveContainer from '../../components/ResponsiveContainer';
import { useMediaQuery } from '@mui/material';

// Mock Material UI's useMediaQuery hook
jest.mock('@mui/material', () => {
  const original = jest.requireActual('@mui/material');
  return {
    ...original,
    useMediaQuery: jest.fn()
  };
});

describe('ResponsiveContainer Component', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should apply mobile styles when on mobile device', () => {
    // Mock the useMediaQuery to return true for mobile
    useMediaQuery.mockReturnValue(true);
    
    const mobileStyles = { padding: '8px', backgroundColor: 'red' };
    const desktopStyles = { padding: '24px', backgroundColor: 'blue' };
    
    render(
      <ResponsiveContainer 
        mobileStyles={mobileStyles} 
        desktopStyles={desktopStyles}
        data-testid="container"
      >
        <div>Test Content</div>
      </ResponsiveContainer>
    );
    
    const container = screen.getByTestId('container');
    
    // Check that mobile styles were applied
    expect(container).toHaveStyle('padding: 8px');
    expect(container).toHaveStyle('background-color: red');
  });
  
  it('should apply desktop styles when on desktop device', () => {
    // Mock the useMediaQuery to return false for mobile (meaning desktop)
    useMediaQuery.mockReturnValue(false);
    
    const mobileStyles = { padding: '8px', backgroundColor: 'red' };
    const desktopStyles = { padding: '24px', backgroundColor: 'blue' };
    
    render(
      <ResponsiveContainer 
        mobileStyles={mobileStyles} 
        desktopStyles={desktopStyles}
        data-testid="container"
      >
        <div>Test Content</div>
      </ResponsiveContainer>
    );
    
    const container = screen.getByTestId('container');
    
    // Check that desktop styles were applied
    expect(container).toHaveStyle('padding: 24px');
    expect(container).toHaveStyle('background-color: blue');
  });
  
  it('should render children correctly', () => {
    useMediaQuery.mockReturnValue(false);
    
    render(
      <ResponsiveContainer mobileStyles={{}} desktopStyles={{}}>
        <div data-testid="child-element">Child Content</div>
      </ResponsiveContainer>
    );
    
    const childElement = screen.getByTestId('child-element');
    expect(childElement).toBeInTheDocument();
    expect(childElement).toHaveTextContent('Child Content');
  });
  
  it('should apply common styles regardless of device type', () => {
    useMediaQuery.mockReturnValue(true); // Mobile
    
    const commonStyles = { display: 'flex', flexDirection: 'column' };
    
    render(
      <ResponsiveContainer 
        mobileStyles={{ padding: '8px' }} 
        desktopStyles={{ padding: '24px' }}
        sx={commonStyles}
        data-testid="container"
      >
        <div>Test Content</div>
      </ResponsiveContainer>
    );
    
    const container = screen.getByTestId('container');
    
    // Check that common styles were applied alongside device-specific styles
    expect(container).toHaveStyle('display: flex');
    expect(container).toHaveStyle('flex-direction: column');
    expect(container).toHaveStyle('padding: 8px'); // Mobile style
  });
});
