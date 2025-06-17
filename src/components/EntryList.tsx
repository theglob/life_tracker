import React, { useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import { Entry } from '../types';
import { TrackingEntry } from '../types/TrackingTypes';
import { sampleCategories } from '../data/sampleData';

interface EntryListProps {
  entries: Entry[];
  onRefresh: () => void;
}

const EntryList: React.FC<EntryListProps> = ({ entries, onRefresh }) => {
  useEffect(() => {
    onRefresh();
  }, [onRefresh]);

  const getCategoryName = (categoryId: string) => {
    return sampleCategories.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  const getItemName = (categoryId: string, itemId: string) => {
    const category = sampleCategories.find(cat => cat.id === categoryId);
    const item = category?.items.find(item => item.id === itemId);
    const subItem = item?.subItems?.find(subItem => subItem.id === itemId);
    return subItem?.name || item?.name || itemId;
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          Your Entries
        </Typography>
        <Button variant="contained" onClick={onRefresh}>
          Refresh
        </Button>
      </Box>

      {entries.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No entries yet. Add your first entry!
          </Typography>
        </Paper>
      ) : (
        <List>
          {entries.map((entry) => (
            <ListItem
              key={entry.id}
              divider
              sx={{
                mb: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
              }}
            >
              <ListItemText
                primary={`${entry.categoryId} - ${entry.itemId}`}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="text.primary">
                      {new Date(entry.timestamp).toLocaleString()}
                    </Typography>
                    {entry.rating && (
                      <Typography component="span" variant="body2" color="text.secondary">
                        {' - Rating: '}{entry.rating}
                      </Typography>
                    )}
                    {entry.notes && (
                      <Typography component="p" variant="body2" color="text.secondary">
                        {entry.notes}
                      </Typography>
                    )}
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default EntryList; 