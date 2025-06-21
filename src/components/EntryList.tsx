import React, { useEffect, useState } from 'react';
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
import { API_URL } from '../config';

interface Category {
  id: string;
  name: string;
  items: Item[];
}

interface Item {
  id: string;
  name: string;
  subItems: SubItem[];
}

interface SubItem {
  id: string;
  name: string;
}

interface EntryListProps {
  entries: Entry[];
  onRefresh: () => void;
}

const EntryList: React.FC<EntryListProps> = ({ entries, onRefresh }) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    onRefresh();
    fetchCategories();
  }, [onRefresh]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  const getItemName = (categoryId: string, itemId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return itemId;
    
    // If the itemId matches the categoryId, it means this is a category with no children
    if (itemId === categoryId) {
      return category.name;
    }
    
    const item = category.items.find(item => item.id === itemId);
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
                primary={`${getCategoryName(entry.categoryId)} - ${getItemName(entry.categoryId, entry.itemId)}`}
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