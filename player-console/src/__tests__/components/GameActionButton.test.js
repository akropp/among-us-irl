import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GameActionButton from '../../components/GameActionButton';
import { ThemeProvider, createTheme } from '@mui/material';

// Create a custom theme for testing
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    error: { main: '#f44336' },
    warning: { main: '#ff9800' },
  }
});

// Wrap component with ThemeProvider
const renderWithTheme = (ui) => {
  return render(
    <ThemeProvider theme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('GameActionButton Component', () => {
  it('renders with correct label', () => {
    renderWithTheme(
      <GameActionButton 
        label="Test Button"
        onClick={() => {}}
        color="primary"
      />
    );
    
    expect(screen.getByText('Test Button')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    
    renderWithTheme(
      <GameActionButton 
        label="Click Me"
        onClick={handleClick}
        color="primary"
      />
    );
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('displays the provided icon', () => {
    const TestIcon = () => <div data-testid="test-icon">Icon</div>;
    
    renderWithTheme(
      <GameActionButton 
        label="With Icon"
        onClick={() => {}}
        color="primary"
        icon={<TestIcon />}
      />
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
  
  it('applies color prop correctly', () => {
    renderWithTheme(
      <GameActionButton 
        label="Error Button"
        onClick={() => {}}
        color="error"
        data-testid="error-button"
      />
    );
    
    const button = screen.getByTestId('error-button');
    // Check for error color class or styling
    expect(button).toHaveClass('MuiButton-containedError');
  });
  
  it('shows cooldown time when provided', () => {
    renderWithTheme(
      <GameActionButton 
        label="Cooldown Button"
        onClick={() => {}}
        color="primary"
        cooldownTime="3"
      />
    );
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });
  
  it('is disabled when disabled prop is true', () => {
    renderWithTheme(
      <GameActionButton 
        label="Disabled Button"
        onClick={() => {}}
        color="primary"
        disabled={true}
        data-testid="disabled-button"
      />
    );
    
    const button = screen.getByTestId('disabled-button');
    expect(button).toBeDisabled();
  });
  
  it('applies size prop correctly', () => {
    renderWithTheme(
      <GameActionButton 
        label="Small Button"
        onClick={() => {}}
        color="primary"
        size="small"
        data-testid="small-button"
      />
    );
    
    const button = screen.getByTestId('small-button');
    expect(button).toHaveClass('MuiButton-sizeSmall');
  });
  
  it('applies custom styles via sx prop', () => {
    renderWithTheme(
      <GameActionButton 
        label="Styled Button"
        onClick={() => {}}
        color="primary"
        sx={{ margin: '10px', borderRadius: '20px' }}
        data-testid="styled-button"
      />
    );
    
    const button = screen.getByTestId('styled-button');
    expect(button).toHaveStyle('margin: 10px');
    expect(button).toHaveStyle('border-radius: 20px');
  });
});
