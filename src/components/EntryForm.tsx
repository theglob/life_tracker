import React, { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Rating,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Paper,
  Slider,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Entry } from '../types';
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

interface EntryFormProps {
  onSubmit: (entry: Omit<Entry, 'id' | 'timestamp' | 'userId'>) => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ onSubmit }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedSubItem, setSelectedSubItem] = useState<string>('');
  const [rating, setRating] = useState<number>(3);
  const [notes, setNotes] = useState('');

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

  const handleCategoryClick = (category: Category) => {
    setSelectedCategory(category);
    setSelectedItem('');
    setSelectedSubItem('');
  };

  const handleItemClick = (itemId: string) => {
    setSelectedItem(itemId);
    setSelectedSubItem('');
  };

  const handleSubItemClick = (subItemId: string) => {
    setSelectedSubItem(subItemId);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedItem('');
    setSelectedSubItem('');
  };

  const handleBackToItems = () => {
    setSelectedItem('');
    setSelectedSubItem('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    
    onSubmit({
      categoryId: selectedCategory.id,
      itemId: selectedSubItem || selectedItem,
      rating: rating || undefined,
      notes: notes || undefined,
    });
    // Reset form
    setSelectedCategory(null);
    setSelectedItem('');
    setSelectedSubItem('');
    setRating(3);
    setNotes('');
  };

  const selectedItemData = selectedCategory?.items.find(item => item.id === selectedItem);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h1">
          {selectedCategory ? `New Entry - ${selectedCategory.name}` : 'New Entry'}
        </Typography>
        {selectedCategory && (
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToCategories}
          >
            Back to Categories
          </Button>
        )}
      </Box>

      {!selectedCategory ? (
        // Show categories list
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Select a Category
          </Typography>
          <List>
            {categories.map((category) => (
              <ListItem key={category.id} disablePadding>
                <ListItemButton onClick={() => handleCategoryClick(category)}>
                  <ListItemText
                    primary={category.name}
                    secondary={category.items.length === 0 ? 'No items - use rating scale' : `${category.items.length} items`}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : (
        // Show items for selected category
        <Box>
          {selectedCategory.items.length === 0 ? (
            // Show rating and notes for category with no items
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Rate: {selectedCategory.name}
              </Typography>
              
              <Typography gutterBottom>Rating</Typography>
              <Slider
                value={rating}
                onChange={(_, value) => setRating(value as number)}
                min={0}
                max={5}
                step={1}
                marks
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                fullWidth
              >
                Save Entry
              </Button>
            </Paper>
          ) : (
            // Show items list
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Select an Item
              </Typography>
              <List>
                {selectedCategory.items.map((item) => (
                  <ListItem key={item.id} disablePadding>
                    <ListItemButton onClick={() => handleItemClick(item.id)}>
                      <ListItemText
                        primary={item.name}
                        secondary={(item.subItems && item.subItems.length > 0) ? `${item.subItems.length} sub-items` : 'No sub-items'}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {selectedItem && (
            <Paper sx={{ p: 3, mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  {selectedCategory.name} - {selectedCategory.items.find(item => item.id === selectedItem)?.name}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleBackToItems}
                >
                  Back to Items
                </Button>
              </Box>

              {selectedItemData?.subItems && selectedItemData.subItems.length > 0 ? (
                // Show sub-items list
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Select a Sub-Item
                  </Typography>
                  <List>
                    {selectedItemData.subItems.map((subItem) => (
                      <ListItem key={subItem.id} disablePadding>
                        <ListItemButton onClick={() => handleSubItemClick(subItem.id)}>
                          <ListItemText primary={subItem.name} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                // Show rating and notes directly for items with no sub-items
                <Box>
                  <Typography gutterBottom>Rating</Typography>
                  <Slider
                    value={rating}
                    onChange={(_, value) => setRating(value as number)}
                    min={0}
                    max={5}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    fullWidth
                  >
                    Save Entry
                  </Button>
                </Box>
              )}

              {selectedSubItem && (
                <Paper sx={{ p: 3, mt: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {selectedCategory.name} - {selectedCategory.items.find(item => item.id === selectedItem)?.name} - {selectedItemData?.subItems?.find(subItem => subItem.id === selectedSubItem)?.name}
                  </Typography>

                  <Typography gutterBottom>Rating</Typography>
                  <Slider
                    value={rating}
                    onChange={(_, value) => setRating(value as number)}
                    min={0}
                    max={5}
                    step={1}
                    marks
                    valueLabelDisplay="auto"
                    sx={{ mb: 2 }}
                  />

                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    fullWidth
                  >
                    Save Entry
                  </Button>
                </Paper>
              )}
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
};

export default EntryForm; 