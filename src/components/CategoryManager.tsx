import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Divider,
  Slider,
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
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

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'category' | 'item' | 'subItem'>('category');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [categoryRatings, setCategoryRatings] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const handleOpenDialog = (type: 'category' | 'item' | 'subItem', edit = false, data?: any) => {
    setDialogType(type);
    setEditMode(edit);
    if (edit && data) {
      setFormData({ name: data.name });
    } else {
      setFormData({ name: '' });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: '' });
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/api/categories`;
      let method = 'POST';
      let body = { name: formData.name };

      if (editMode) {
        method = 'PUT';
        if (dialogType === 'category') {
          url += `/${selectedCategory?.id}`;
        } else if (dialogType === 'item') {
          url += `/${selectedCategory?.id}/items/${selectedItem?.id}`;
        } else {
          url += `/${selectedCategory?.id}/items/${selectedItem?.id}/subitems/${selectedItem?.subItems[0].id}`;
        }
      } else {
        if (dialogType === 'item') {
          url += `/${selectedCategory?.id}/items`;
        } else if (dialogType === 'subItem') {
          url += `/${selectedCategory?.id}/items/${selectedItem?.id}/subitems`;
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save');
      handleCloseDialog();
      fetchCategories();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleDelete = async (type: 'category' | 'item' | 'subItem', id: string, categoryId?: string, itemId?: string) => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/api/categories`;
      
      if (type === 'category') {
        url += `/${id}`;
      } else if (type === 'item') {
        url += `/${categoryId}/items/${id}`;
      } else {
        url += `/${categoryId}/items/${itemId}/subitems/${id}`;
      }

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete');
      fetchCategories();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleRatingChange = (categoryId: string, value: number) => {
    setCategoryRatings(prev => ({
      ...prev,
      [categoryId]: value
    }));
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Category Manager</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('category')}
        >
          Add Category
        </Button>
      </Box>

      <List>
        {categories.map((category) => (
          <Paper key={category.id} sx={{ mb: 2 }}>
            <ListItem>
              <ListItemText
                primary={category.name}
                secondary={category.items.length === 0 ? 'No items - use scale below' : `${category.items.length} items`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setSelectedCategory(category);
                    handleOpenDialog('item');
                  }}
                >
                  <AddIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setSelectedCategory(category);
                    handleOpenDialog('category', true, category);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDelete('category', category.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>

            {category.items.length === 0 ? (
              <Box sx={{ p: 2, pl: 4 }}>
                <Typography gutterBottom variant="body2" color="text.secondary">
                  Rating Scale
                </Typography>
                <Slider
                  value={categoryRatings[category.id] || 3}
                  onChange={(_, value) => handleRatingChange(category.id, value as number)}
                  min={0}
                  max={5}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Current rating: {categoryRatings[category.id] || 3}/5
                </Typography>
              </Box>
            ) : (
              category.items.map((item) => (
                <Box key={item.id} sx={{ pl: 4 }}>
                  <ListItem>
                    <ListItemText
                      primary={item.name}
                      secondary={`${item.subItems.length} sub-items`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSelectedCategory(category);
                          setSelectedItem(item);
                          handleOpenDialog('subItem');
                        }}
                      >
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => {
                          setSelectedCategory(category);
                          setSelectedItem(item);
                          handleOpenDialog('item', true, item);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        edge="end"
                        onClick={() => handleDelete('item', item.id, category.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>

                  {item.subItems.map((subItem) => (
                    <Box key={subItem.id} sx={{ pl: 4 }}>
                      <ListItem>
                        <ListItemText primary={subItem.name} />
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            onClick={() => {
                              setSelectedCategory(category);
                              setSelectedItem(item);
                              handleOpenDialog('subItem', true, subItem);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="end"
                            onClick={() => handleDelete('subItem', subItem.id, category?.id, item.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Box>
                  ))}
                </Box>
              ))
            )}
          </Paper>
        ))}
      </List>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editMode ? 'Edit' : 'Add'} {dialogType}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editMode ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CategoryManager; 