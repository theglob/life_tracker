import React, { useEffect, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Button,
  IconButton,
  ListItemSecondaryAction,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Entry, EntryItem } from '../types';
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
  onDelete?: (entryId: string) => void;
}

const EntryList: React.FC<EntryListProps> = ({ entries, onRefresh, onDelete }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Automatically refresh entries when component mounts
    onRefresh();
  }, [onRefresh]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/entries/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete entry');
      }

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete(entryId);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
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
    
    // First, try to find it as a subItem in any item
    for (const item of category.items) {
      const subItem = item.subItems.find(subItem => subItem.id === itemId);
      if (subItem) {
        return subItem.name;
      }
    }
    
    // If not found as subItem, try to find it as an item
    const item = category.items.find(item => item.id === itemId);
    if (item) {
      return item.name;
    }
    
    // If not found, return the ID
    return itemId;
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

      {isLoading ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Loading entries...
          </Typography>
        </Paper>
      ) : entries.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No entries yet. Add your first entry!
          </Typography>
        </Paper>
      ) : (
        <List>
          {entries.map((entry) => (
            <Paper key={entry.id} sx={{ mb: 2, p: 2 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="h6" color="text.primary">
                  {getCategoryName(entry.categoryId)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(entry.timestamp).toLocaleString()}
                  {entry.notes && (
                    <span> - {entry.notes}</span>
                  )}
                </Typography>
              </Box>
              
              <List dense>
                {entry.items ? (
                  // New structure with items array
                  entry.items.map((item, index) => (
                    <ListItem
                      key={`${entry.id}-${index}`}
                      sx={{
                        bgcolor: 'background.paper',
                        borderRadius: 1,
                        mb: 0.5,
                      }}
                    >
                      <ListItemText
                        primary={getItemName(entry.categoryId, item.itemId)}
                        secondary={
                          <>
                            {item.rating !== undefined && (
                              <Typography component="span" variant="body2" color="text.secondary">
                                Rating: {item.rating}
                              </Typography>
                            )}
                            {item.weight !== undefined && (
                              <Typography component="span" variant="body2" color="text.secondary">
                                Weight: {item.weight}g
                              </Typography>
                            )}
                            {item.count !== undefined && (
                              <Typography component="span" variant="body2" color="text.secondary">
                                Count: {item.count}
                              </Typography>
                            )}
                            {item.volume !== undefined && (
                              <Typography component="span" variant="body2" color="text.secondary">
                                Volume: {item.volume}ml
                              </Typography>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  // Old structure with single itemId, rating, weight
                  <ListItem
                    sx={{
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                  >
                    <ListItemText
                      primary={getItemName(entry.categoryId, (entry as any).itemId)}
                      secondary={
                        <>
                          {(entry as any).rating !== undefined && (
                            <Typography component="span" variant="body2" color="text.secondary">
                              Rating: {(entry as any).rating}
                            </Typography>
                          )}
                          {(entry as any).weight !== undefined && (
                            <Typography component="span" variant="body2" color="text.secondary">
                              Weight: {(entry as any).weight}g
                            </Typography>
                          )}
                          {(entry as any).count !== undefined && (
                            <Typography component="span" variant="body2" color="text.secondary">
                              Count: {(entry as any).count}
                            </Typography>
                          )}
                          {(entry as any).volume !== undefined && (
                            <Typography component="span" variant="body2" color="text.secondary">
                              Volume: {(entry as any).volume}ml
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                )}
              </List>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <IconButton 
                  edge="end" 
                  aria-label="delete" 
                  onClick={() => handleDelete(entry.id)}
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );
};

export default EntryList; 