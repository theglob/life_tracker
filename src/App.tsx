import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  AppBar,
  Toolbar,
  Button,
  Tab,
  Tabs,
} from '@mui/material';
import TrackingForm from './components/TrackingForm';
import EntryList from './components/EntryList';
import { sampleCategories } from './data/sampleData';
import { TrackingEntry } from './types/TrackingTypes';

// Use the appropriate API URL based on the environment
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.com/api'  // Replace with your actual backend URL when deployed
  : 'http://localhost:3000/api';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196f3',
    },
    secondary: {
      main: '#f50057',
    },
  },
});

function App() {
  const [entries, setEntries] = useState<TrackingEntry[]>([]);
  const [currentTab, setCurrentTab] = useState(0);

  // Load entries from API on component mount
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch(`${API_URL}/entries`);
        const data = await response.json();
        setEntries(data);
      } catch (error) {
        console.error('Failed to fetch entries:', error);
      }
    };
    fetchEntries();
  }, []);

  const handleSaveEntry = async (entry: {
    categoryId: string;
    itemId: string;
    rating?: number;
    notes?: string;
  }) => {
    try {
      const response = await fetch(`${API_URL}/entries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
      const newEntry = await response.json();
      setEntries([...entries, newEntry]);
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Life Tracker
            </Typography>
          </Toolbar>
        </AppBar>
        <Container>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 2 }}>
            <Tabs value={currentTab} onChange={handleTabChange} centered>
              <Tab label="Add Entry" />
              <Tab label="View Entries" />
            </Tabs>
          </Box>
          <Box sx={{ mt: 3 }}>
            {currentTab === 0 ? (
              <TrackingForm categories={sampleCategories} onSave={handleSaveEntry} />
            ) : (
              <EntryList entries={entries} />
            )}
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App; 