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
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { API_URL } from '../config';
import '../mobile-styles.css';

interface Category {
  id: string;
  name: string;
  categoryType: 'food' | 'self';
  items: Item[];
}

interface Item {
  id: string;
  name: string;
  subItems: SubItem[];
  scaleType?: 'rating' | 'weight' | 'count' | 'volume';
}

interface SubItem {
  id: string;
  name: string;
}

const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSubItem, setSelectedSubItem] = useState<SubItem | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState<'category' | 'item' | 'subItem'>('category');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    categoryType: 'self' as 'food' | 'self',
    scaleType: 'rating' as 'rating' | 'weight' | 'count' | 'volume' 
  });

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
      setFormData({ 
        name: data.name, 
        categoryType: data.categoryType || 'self',
        scaleType: data.scaleType || 'rating' 
      });
    } else {
      const defaultScaleType = (type === 'item' && selectedCategory?.categoryType === 'food') ? 'weight' : 'rating';
      setFormData({ name: '', categoryType: 'self', scaleType: defaultScaleType });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({ name: '', categoryType: 'self', scaleType: 'rating' });
    setSelectedSubItem(null);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/api/categories`;
      let method = 'POST';
      let body: { name: string; categoryType?: 'food' | 'self'; scaleType?: 'rating' | 'weight' | 'count' | 'volume' } = { name: formData.name };

      if (editMode) {
        method = 'PUT';
        if (dialogType === 'category') {
          url += `/${selectedCategory?.id}`;
          body = { name: formData.name, categoryType: formData.categoryType };
        } else if (dialogType === 'item') {
          url += `/${selectedCategory?.id}/items/${selectedItem?.id}`;
          body = { name: formData.name, scaleType: formData.scaleType };
        } else {
          url += `/${selectedCategory?.id}/items/${selectedItem?.id}/subitems/${selectedSubItem?.id}`;
        }
      } else {
        if (dialogType === 'category') {
          body = { name: formData.name, categoryType: formData.categoryType };
        } else if (dialogType === 'item') {
          url += `/${selectedCategory?.id}/items`;
          body = { name: formData.name, scaleType: formData.scaleType };
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

  const getScaleTypeLabel = (scaleType?: string) => {
    switch (scaleType) {
      case 'weight':
        return 'Weight (0-500g)';
      case 'count':
        return 'Count (0-10)';
      case 'volume':
        return 'Volume (0-1000ml)';
      case 'rating':
      default:
        return 'Rating (1-5)';
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }} className="mobile-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="mobile-spacing-medium">
        <Typography variant="h5" className="mobile-page-title">Category Manager</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog('category')}
          className="mobile-button"
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
                secondary={
                  <>
                    {category.categoryType === 'food' ? 'Food Category' : 'Self Category'}
                  </>
                }
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setSelectedCategory(category);
                    handleOpenDialog('item');
                  }}
                  data-testid="AddIcon"
                >
                  <AddIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => {
                    setSelectedCategory(category);
                    handleOpenDialog('category', true, category);
                  }}
                  data-testid="EditIcon"
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => handleDelete('category', category.id)}
                  data-testid="DeleteIcon"
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>

            {category.items.length > 0 && category.items.map((item) => (
              <Box key={item.id} sx={{ pl: 4 }}>
                <ListItem>
                  <ListItemText
                    primary={item.name}
                    secondary={
                      <>
                        {item.scaleType && (
                          <span style={{ marginLeft: '8px', color: '#666' }}>
                            {getScaleTypeLabel(item.scaleType)}
                          </span>
                        )}
                      </>
                    }
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
                            setSelectedSubItem(subItem);
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
            ))}
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
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          {dialogType === 'category' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Category Type</InputLabel>
              <Select
                value={formData.categoryType}
                label="Category Type"
                onChange={(e) => setFormData({ ...formData, categoryType: e.target.value as 'food' | 'self' })}
              >
                <MenuItem value="self">Self (Rating/Weight per item)</MenuItem>
                <MenuItem value="food">Food (Weight scale for all items)</MenuItem>
              </Select>
            </FormControl>
          )}
          {dialogType === 'item' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Scale Type</InputLabel>
              <Select
                value={formData.scaleType}
                label="Scale Type"
                onChange={(e) => setFormData({ ...formData, scaleType: e.target.value as 'rating' | 'weight' | 'count' | 'volume' })}
              >
                <MenuItem value="rating">{getScaleTypeLabel('rating')}</MenuItem>
                <MenuItem value="weight">{getScaleTypeLabel('weight')}</MenuItem>
                <MenuItem value="count">{getScaleTypeLabel('count')}</MenuItem>
                <MenuItem value="volume">{getScaleTypeLabel('volume')}</MenuItem>
              </Select>
            </FormControl>
          )}
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