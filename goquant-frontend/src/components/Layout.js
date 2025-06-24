import React from 'react';
import { AppBar, Toolbar, Typography, Container, IconButton, Box, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Brightness4, Brightness7 } from '@mui/icons-material';

const Layout = ({ children, toggleTheme, isDarkMode }) => {
  const navigate = useNavigate();

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            GoQuant Backtesting Platform
          </Typography>
          <Button color="inherit" onClick={() => navigate('/')}>Backtest</Button>
          <Button color="inherit" onClick={() => navigate('/live-trading')}>Live Trading</Button>
          <IconButton onClick={toggleTheme} color="inherit">
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        {children}
      </Container>
    </>
  );
};

export default Layout;
