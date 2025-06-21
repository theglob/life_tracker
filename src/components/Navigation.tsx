import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Menu, 
  MenuItem,
  Tooltip,
  Paper
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Add as AddIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { User } from '../types';
import '../mobile-styles.css';

interface NavigationProps {
  isAuthenticated: boolean;
  onLogout: () => void;
  user: User | null;
}

const Navigation: React.FC<NavigationProps> = ({ isAuthenticated, onLogout, user }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const location = useLocation();

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleUserMenuClose();
    onLogout();
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      {/* Top header - only shows title */}
      <AppBar position="static" className="mobile-header">
        <Toolbar sx={{ justifyContent: 'center', minHeight: '48px !important' }}>
          <Typography variant="h6" component="div" className="mobile-header">
            Life Tracker
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Bottom navigation */}
      <Paper 
        elevation={3} 
        className="mobile-bottom-nav"
        sx={{ 
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'primary.main',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)'
        }}
      >
        <Toolbar className="mobile-nav-toolbar" sx={{ justifyContent: 'space-around' }}>
          <Tooltip title="User Menu" placement="top">
            <IconButton 
              color="inherit"
              onClick={handleUserMenuOpen}
              size="large"
              className="mobile-nav-icons"
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: 'white' }
              }}
            >
              <PersonIcon />
            </IconButton>
          </Tooltip>
          
          {user.role === 'admin' && (
            <Tooltip title="Manage Categories" placement="top">
              <IconButton 
                color="inherit" 
                component={RouterLink} 
                to="/categories"
                size="large"
                className="mobile-nav-icons"
                sx={{ 
                  color: location.pathname === '/categories' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                  '&:hover': { color: 'white' }
                }}
              >
                <SettingsIcon />
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="View Entries" placement="top">
            <IconButton 
              color="inherit" 
              component={RouterLink} 
              to="/"
              size="large"
              className="mobile-nav-icons"
              sx={{ 
                color: location.pathname === '/' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: 'white' }
              }}
            >
              <ViewIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Add Entry" placement="top">
            <IconButton 
              color="inherit" 
              component={RouterLink} 
              to="/add"
              size="large"
              className="mobile-nav-icons"
              sx={{ 
                color: location.pathname === '/add' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                '&:hover': { color: 'white' }
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
          >
            <MenuItem onClick={handleLogout} className="mobile-text-medium">
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </Paper>
    </>
  );
};

export default Navigation; 