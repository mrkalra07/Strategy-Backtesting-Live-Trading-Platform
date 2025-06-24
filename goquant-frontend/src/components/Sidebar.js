// src/components/Sidebar.js
import React from 'react';
import { Drawer, List, ListItem, ListItemText, ListItemIcon } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InsightsIcon from '@mui/icons-material/Insights';
import StrategyIcon from '@mui/icons-material/Schema';
import TradingIcon from '@mui/icons-material/ShowChart';
import { Link, useLocation } from 'react-router-dom';

const menuItems = [
  { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { text: 'Strategy Builder', path: '/builder', icon: <StrategyIcon /> },
  { text: 'Analytics', path: '/analytics', icon: <InsightsIcon /> },
  { text: 'Live Trading', path: '/live-trading', icon: <TradingIcon /> },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 220,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 220, boxSizing: 'border-box' }
      }}
    >
      <List>
        {menuItems.map(({ text, path, icon }) => (
          <ListItem
            button
            component={Link}
            to={path}
            key={text}
            selected={location.pathname === path}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
