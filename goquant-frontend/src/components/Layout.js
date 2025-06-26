import React from 'react';
import { AppBar, Toolbar, Typography, Container, IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

const Layout = ({ children, toggleTheme, isDarkMode }) => {
  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            GoQuant Backtesting Platform
          </Typography>
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
