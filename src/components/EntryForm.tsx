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
  IconButton,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Entry } from '../types';
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

interface EntryFormProps {
  onSubmit: (entry: Omit<Entry, 'id' | 'timestamp' | 'userId'>) => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ onSubmit }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedSubItem, setSelectedSubItem] = useState<string>('');
  const [rating, setRating] = useState<number>(3);
  const [weight, setWeight] = useState<number>(250);
  const [count, setCount] = useState<number>(1);
  const [volume, setVolume] = useState<number>(250);
  const [notes, setNotes] = useState('');
  
  // Food category specific state
  const [filterText, setFilterText] = useState('');
  const [selectedFoodItems, setSelectedFoodItems] = useState<{itemId: string, scaleType: 'weight' | 'count' | 'volume', value: number}[]>([]);

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
    console.log('handleItemClick called with itemId:', itemId);
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
    setSelectedFoodItems([]);
    setFilterText('');
  };

  const handleBackToItems = () => {
    setSelectedItem('');
    setSelectedSubItem('');
  };

  // Food category specific handlers
  const handleFoodItemToggle = (itemId: string) => {
    setSelectedFoodItems(prev => {
      const existing = prev.find(item => item.itemId === itemId);
      if (existing) {
        return prev.filter(item => item.itemId !== itemId);
      } else {
        // Get the item to determine its scale type and default value
        const item = selectedCategory?.items.find(i => i.id === itemId);
        const scaleType = item?.scaleType || 'weight';
        // For food categories, we only support weight, count, and volume (not rating)
        const foodScaleType = scaleType === 'rating' ? 'weight' : scaleType as 'weight' | 'count' | 'volume';
        const defaultValue = foodScaleType === 'weight' ? 100 : 
                           foodScaleType === 'count' ? 1 : 250; // volume default
        return [...prev, { itemId, scaleType: foodScaleType, value: defaultValue }];
      }
    });
  };

  const handleFoodItemValueChange = (itemId: string, newValue: number) => {
    setSelectedFoodItems(prev => 
      prev.map(item => 
        item.itemId === itemId ? { ...item, value: newValue } : item
      )
    );
  };

  const handleFoodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || selectedFoodItems.length === 0) return;
    
    // Create a single entry with multiple items
    const entryItems = selectedFoodItems.map(foodItem => {
      const baseItem = { itemId: foodItem.itemId };
      switch (foodItem.scaleType) {
        case 'weight':
          return { ...baseItem, weight: foodItem.value };
        case 'count':
          return { ...baseItem, count: foodItem.value };
        case 'volume':
          return { ...baseItem, volume: foodItem.value };
        default:
          return { ...baseItem, weight: foodItem.value };
      }
    });
    
    onSubmit({
      categoryId: selectedCategory.id,
      items: entryItems,
      notes: notes || undefined,
    });
    
    // Reset form
    setSelectedCategory(null);
    setSelectedItem('');
    setSelectedSubItem('');
    setRating(3);
    setWeight(250);
    setNotes('');
    setSelectedFoodItems([]);
    setFilterText('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    
    const selectedItemData = selectedCategory.items.find(item => item.id === selectedItem);
    const scaleType = selectedItemData?.scaleType || 'rating';
    
    const entryItem = {
      itemId: selectedSubItem || selectedItem,
      ...(scaleType === 'rating' ? { rating } : 
          scaleType === 'weight' ? { weight } :
          scaleType === 'count' ? { count } :
          { volume })
    };
    
    onSubmit({
      categoryId: selectedCategory.id,
      items: [entryItem],
      notes: notes || undefined,
    });
    // Reset form
    setSelectedCategory(null);
    setSelectedItem('');
    setSelectedSubItem('');
    setRating(3);
    setWeight(250);
    setCount(1);
    setVolume(250);
    setNotes('');
  };

  const selectedItemData = selectedCategory?.items.find(item => item.id === selectedItem);
  
  const renderScale = (scaleType?: 'rating' | 'weight' | 'count' | 'volume') => {
    if (scaleType === 'weight') {
      return (
        <Slider
          value={weight}
          onChange={(_, value) => setWeight(value as number)}
          min={0}
          max={500}
          step={10}
          marks={[
            { value: 0, label: '0g' },
            { value: 100, label: '100g' },
            { value: 200, label: '200g' },
            { value: 300, label: '300g' },
            { value: 400, label: '400g' },
            { value: 500, label: '500g' },
          ]}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}g`}
          sx={{ mb: 2 }}
        />
      );
    }
    
    if (scaleType === 'count') {
      return (
        <Slider
          value={count}
          onChange={(_, value) => setCount(value as number)}
          min={0}
          max={10}
          step={0.5}
          marks={[
            { value: 0, label: '0' },
            { value: 2, label: '2' },
            { value: 4, label: '4' },
            { value: 6, label: '6' },
            { value: 8, label: '8' },
            { value: 10, label: '10' },
          ]}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}`}
          sx={{ mb: 2 }}
        />
      );
    }
    
    if (scaleType === 'volume') {
      return (
        <Slider
          value={volume}
          onChange={(_, value) => setVolume(value as number)}
          min={0}
          max={1000}
          step={50}
          marks={[
            { value: 0, label: '0ml' },
            { value: 200, label: '200ml' },
            { value: 400, label: '400ml' },
            { value: 600, label: '600ml' },
            { value: 800, label: '800ml' },
            { value: 1000, label: '1000ml' },
          ]}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value}ml`}
          sx={{ mb: 2 }}
        />
      );
    }
    
    // Default to rating scale
    return (
      <Slider
        value={rating}
        onChange={(_, value) => setRating(value as number)}
        min={1}
        max={5}
        step={1}
        marks={[
          { value: 1, label: 'sehr schlecht' },
          { value: 3, label: 'ok' },
          { value: 5, label: 'sehr gut' },
        ]}
        valueLabelDisplay="auto"
        sx={{ 
          mb: 2,
          '& .MuiSlider-markLabel': {
            fontSize: '0.6rem',
            transform: 'scale(0.8)',
            transformOrigin: 'center'
          },
          '& .MuiSlider-markLabel[data-index="0"]': {
            textAlign: 'left',
            left: '0% !important',
            transform: 'translateX(0) scale(0.8)'
          },
          '& .MuiSlider-markLabel[data-index="1"]': {
            textAlign: 'center',
            left: '50% !important',
            transform: 'translateX(-50%) scale(0.8)'
          },
          '& .MuiSlider-markLabel[data-index="2"]': {
            textAlign: 'right',
            left: '100% !important',
            transform: 'translateX(-100%) scale(0.8)'
          }
        }}
      />
    );
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }} className="mobile-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }} className="mobile-spacing-medium">
        <Typography variant="h5" component="h1" className="mobile-page-title">
          {selectedCategory ? `New Entry - ${selectedCategory.name}` : 'New Entry'}
        </Typography>
        {selectedCategory && (
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToCategories}
            className="mobile-back-button"
          >
            Back to Categories
          </Button>
        )}
      </Box>

      {!selectedCategory ? (
        // Show categories list
        <Paper sx={{ p: 2 }} className="mobile-card">
          <List>
            {categories.map((category) => (
              <ListItem key={category.id} disablePadding className="mobile-list-item">
                <ListItemButton onClick={() => handleCategoryClick(category)}>
                  <ListItemText
                    primary={category.name}
                    secondary={category.items.length === 0 ? 'No items - use rating scale' : `${category.items.length} items`}
                    className="mobile-list-text"
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
            <Paper sx={{ p: 3 }} className="mobile-card">
              <Typography variant="h6" sx={{ mb: 2 }} className="mobile-section-title">
                Rate: {selectedCategory.name}
              </Typography>
              
              {renderScale('rating')}

              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ mb: 2 }}
                className="mobile-form-field"
              />

              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                fullWidth
                className="mobile-button"
              >
                Save Entry
              </Button>
            </Paper>
          ) : (
            // Show items list
            <Paper sx={{ p: 2 }} className="mobile-card">
              {selectedCategory.categoryType === 'food' ? (
                // Food category - show checkboxes and filtering
                <Box>
                  <TextField
                    fullWidth
                    label="Filter items"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    sx={{ mb: 2 }}
                    placeholder="Type to filter items..."
                    className="mobile-form-field"
                  />
                  
                  <List>
                    {selectedCategory.items
                      .filter(item => 
                        item.name.toLowerCase().includes(filterText.toLowerCase())
                      )
                      .map((item) => {
                        const isSelected = selectedFoodItems.some(fi => fi.itemId === item.id);
                        return (
                          <ListItem key={item.id} disablePadding className="mobile-list-item">
                            <ListItemButton onClick={() => handleFoodItemToggle(item.id)}>
                              <ListItemText
                                primary={item.name}
                                secondary="Click to select"
                                className="mobile-list-text"
                              />
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  style={{ marginRight: '8px' }}
                                />
                              </Box>
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                  </List>

                  {selectedFoodItems.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2 }} className="mobile-section-title">
                        Selected Items
                      </Typography>
                      <List>
                        {selectedFoodItems.map((foodItem) => {
                          const item = selectedCategory.items.find(i => i.id === foodItem.itemId);
                          return (
                            <ListItem key={foodItem.itemId} className="mobile-list-item">
                              <ListItemText
                                primary={item?.name}
                                secondary={
                                  <Box component="span" sx={{ display: 'block', mt: 1 }}>
                                    <Typography component="span" variant="body2" sx={{ display: 'block', mb: 1 }} className="mobile-text-small">
                                      {foodItem.scaleType === 'weight' ? `Weight: ${foodItem.value}g` : 
                                       foodItem.scaleType === 'count' ? `Count: ${foodItem.value}` :
                                       `Volume: ${foodItem.value}ml`}
                                    </Typography>
                                    {foodItem.scaleType === 'weight' ? (
                                      <Slider
                                        value={foodItem.value}
                                        onChange={(_, value) => handleFoodItemValueChange(foodItem.itemId, value as number)}
                                        min={0}
                                        max={500}
                                        step={10}
                                        marks={[
                                          { value: 0, label: '0g' },
                                          { value: 100, label: '100g' },
                                          { value: 200, label: '200g' },
                                          { value: 300, label: '300g' },
                                          { value: 400, label: '400g' },
                                          { value: 500, label: '500g' },
                                        ]}
                                        valueLabelDisplay="auto"
                                        valueLabelFormat={(value) => `${value}g`}
                                      />
                                    ) : foodItem.scaleType === 'count' ? (
                                      <Slider
                                        value={foodItem.value}
                                        onChange={(_, value) => handleFoodItemValueChange(foodItem.itemId, value as number)}
                                        min={0}
                                        max={10}
                                        step={0.5}
                                        marks={[
                                          { value: 0, label: '0' },
                                          { value: 2, label: '2' },
                                          { value: 4, label: '4' },
                                          { value: 6, label: '6' },
                                          { value: 8, label: '8' },
                                          { value: 10, label: '10' },
                                        ]}
                                        valueLabelDisplay="auto"
                                        valueLabelFormat={(value) => `${value}`}
                                      />
                                    ) : (
                                      <Slider
                                        value={foodItem.value}
                                        onChange={(_, value) => handleFoodItemValueChange(foodItem.itemId, value as number)}
                                        min={0}
                                        max={1000}
                                        step={50}
                                        marks={[
                                          { value: 0, label: '0ml' },
                                          { value: 200, label: '200ml' },
                                          { value: 400, label: '400ml' },
                                          { value: 600, label: '600ml' },
                                          { value: 800, label: '800ml' },
                                          { value: 1000, label: '1000ml' },
                                        ]}
                                        valueLabelDisplay="auto"
                                        valueLabelFormat={(value) => `${value}ml`}
                                      />
                                    )}
                                  </Box>
                                }
                                className="mobile-list-text"
                              />
                              <IconButton
                                edge="end"
                                onClick={() => handleFoodItemToggle(foodItem.itemId)}
                                className="mobile-icon-small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </ListItem>
                          );
                        })}
                      </List>

                      <TextField
                        fullWidth
                        label="Notes"
                        multiline
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        sx={{ mb: 2 }}
                        className="mobile-form-field"
                      />

                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleFoodSubmit}
                        fullWidth
                        className="mobile-button"
                      >
                        Save Entry
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                // Self category - show items with sub-items
                <List>
                  {selectedCategory.items.map((item) => (
                    <ListItem key={item.id} disablePadding className="mobile-list-item">
                      <ListItemButton onClick={() => handleItemClick(item.id)}>
                        <ListItemText
                          primary={item.name}
                          secondary={item.subItems.length > 0 ? `${item.subItems.length} sub-items` : 'No sub-items'}
                          className="mobile-list-text"
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          )}

          {selectedItem && selectedCategory.items.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" className="mobile-section-title">
                  {selectedCategory.items.find(item => item.id === selectedItem)?.name}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleBackToItems}
                  className="mobile-back-button"
                >
                  Back to Items
                </Button>
              </Box>

              {selectedCategory.items.find(item => item.id === selectedItem)?.subItems.length === 0 ? (
                // Show scale and notes for item with no sub-items
                <Paper sx={{ p: 3 }} className="mobile-card">
                  {renderScale(selectedCategory.items.find(item => item.id === selectedItem)?.scaleType)}

                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    sx={{ mb: 2 }}
                    className="mobile-form-field"
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSubmit}
                    fullWidth
                    className="mobile-button"
                  >
                    Save Entry
                  </Button>
                </Paper>
              ) : (
                // Show sub-items list
                <Paper sx={{ p: 2 }} className="mobile-card">
                  <List>
                    {selectedCategory.items
                      .find(item => item.id === selectedItem)
                      ?.subItems.map((subItem) => (
                        <ListItem key={subItem.id} disablePadding className="mobile-list-item">
                          <ListItemButton onClick={() => handleSubItemClick(subItem.id)}>
                            <ListItemText
                              primary={subItem.name}
                              className="mobile-list-text"
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                  </List>
                </Paper>
              )}
            </Box>
          )}

          {selectedSubItem && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }} className="mobile-section-title">
                {selectedCategory.items
                  .find(item => item.id === selectedItem)
                  ?.subItems.find(subItem => subItem.id === selectedSubItem)?.name}
              </Typography>

              <Paper sx={{ p: 3 }} className="mobile-card">
                {renderScale(selectedCategory.items.find(item => item.id === selectedItem)?.scaleType)}

                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  sx={{ mb: 2 }}
                  className="mobile-form-field"
                />

                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  fullWidth
                  className="mobile-button"
                >
                  Save Entry
                </Button>
              </Paper>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default EntryForm; 