import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Login from './components/Login';
import EntryList from './components/EntryList';
import EntryForm from './components/EntryForm';
import CategoryManager from './components/CategoryManager';
import Navigation from './components/Navigation';
import { Entry, User } from './types';
import { API_URL } from './config';
import './mobile-styles.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const App: React.FC = () => {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setIsAuthenticated(true);
          setUser(parsedUser);
        } catch (e) {
          console.error('Error parsing saved user:', e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    } catch (e) {
      console.error('Error in initialization:', e);
      setError('Error initializing application');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogin = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setIsAuthenticated(true);
      setUser(data.user);
      setError(null);
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please check your credentials and try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  const fetchEntries = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`${API_URL}/api/entries`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          setError('Session expired. Please log in again.');
        } else {
          throw new Error('Failed to fetch entries');
        }
        return;
      }

      const data = await response.json();
      setEntries(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setError('Failed to load entries. Please try again later.');
    }
  }, []);

  const handleAddEntry = async (entry: Omit<Entry, 'id' | 'timestamp' | 'userId'>) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch(`${API_URL}/api/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleLogout();
          setError('Session expired. Please log in again.');
        } else {
          throw new Error('Failed to add entry');
        }
        return;
      }

      const newEntry = await response.json();
      setEntries(prevEntries => {
        const exists = prevEntries.some(e => e.id === newEntry.id);
        if (exists) {
          return prevEntries;
        }
        return [...prevEntries, newEntry];
      });
      setError(null);
    } catch (err) {
      console.error('Error adding entry:', err);
      setError('Failed to add entry. Please try again later.');
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== entryId));
  };

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename="/life_tracker/">
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navigation isAuthenticated={isAuthenticated} onLogout={handleLogout} user={user} />
          <Container component="main" className="mobile-container" sx={{ 
            mt: 2, 
            mb: 8, // Space for bottom navigation
            flex: 1,
            padding: '12px !important'
          }}>
            {error && (
              <Typography color="error" sx={{ mb: 2 }} className="mobile-text-medium">
                {error}
              </Typography>
            )}
            <Routes>
              <Route path="/login" element={
                !isAuthenticated ? (
                  <Login onLogin={handleLogin} />
                ) : (
                  <Navigate to="/" replace />
                )
              } />
              <Route path="/" element={
                isAuthenticated ? (
                  <EntryList entries={entries} onRefresh={fetchEntries} onDelete={handleDeleteEntry} />
                ) : (
                  <Navigate to="/login" replace />
                )
              } />
              <Route path="/add" element={
                isAuthenticated ? (
                  <EntryForm onSubmit={handleAddEntry} />
                ) : (
                  <Navigate to="/login" replace />
                )
              } />
              <Route path="/categories" element={
                isAuthenticated && user?.role === 'admin' ? (
                  <CategoryManager />
                ) : (
                  <Navigate to="/" replace />
                )
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App; 