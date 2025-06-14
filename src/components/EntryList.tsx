import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Divider,
} from '@mui/material';
import { TrackingEntry } from '../types/TrackingTypes';
import { sampleCategories } from '../data/sampleData';

interface EntryListProps {
  entries: TrackingEntry[];
}

const EntryList: React.FC<EntryListProps> = ({ entries }) => {
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
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Past Entries
      </Typography>
      <Paper elevation={2}>
        <List>
          {entries.map((entry, index) => (
            <React.Fragment key={entry.id}>
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1">
                      {getCategoryName(entry.categoryId)} - {getItemName(entry.categoryId, entry.itemId)}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {new Date(entry.timestamp).toLocaleString()}
                      </Typography>
                      {entry.rating !== undefined && (
                        <Typography component="span" variant="body2" color="text.secondary">
                          {' - Rating: '}{entry.rating}/5
                        </Typography>
                      )}
                      {entry.notes && (
                        <Typography component="p" variant="body2" color="text.secondary">
                          Notes: {entry.notes}
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
              {index < entries.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default EntryList; 