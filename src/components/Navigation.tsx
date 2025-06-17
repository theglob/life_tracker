import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { User } from '../types';

interface NavigationProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  user: User | null;
}

const Navigation: React.FC<NavigationProps> = ({ isAuthenticated, onLogout, user }) => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Life Tracker
        </Typography>
        {isAuthenticated && user && (
          <>
            <Typography variant="body1" sx={{ mr: 2 }}>
              Welcome, {user.username}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button color="inherit" component={RouterLink} to="/">
                View Entries
              </Button>
              <Button color="inherit" component={RouterLink} to="/add">
                Add Entry
              </Button>
              <Button color="inherit" onClick={onLogout}>
                Logout
              </Button>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation; 