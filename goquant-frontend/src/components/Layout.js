import React from 'react';
import { AppBar, Toolbar, Typography, Container, Box } from '@mui/material';

const Layout = ({ children }) => {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ borderRadius: 1 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            GoQuant Backtesting Platform
          </Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        {children}
      </Container>
    </Box>
  );
};

export default Layout;
