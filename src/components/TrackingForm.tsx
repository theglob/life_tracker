import React, { useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Typography,
  Button,
  TextField,
} from '@mui/material';
import { Category, TrackingItem } from '../types/TrackingTypes';

interface TrackingFormProps {
  categories: Category[];
  onSave: (entry: {
    categoryId: string;
    itemId: string;
    rating?: number;
    notes?: string;
  }) => void;
}

const TrackingForm: React.FC<TrackingFormProps> = ({ categories, onSave }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [selectedSubItem, setSelectedSubItem] = useState<string>('');
  const [rating, setRating] = useState<number>(3);
  const [notes, setNotes] = useState<string>('');

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
    setSelectedItem('');
    setSelectedSubItem('');
  };

  const handleItemChange = (event: any) => {
    setSelectedItem(event.target.value);
    setSelectedSubItem('');
  };

  const handleSubItemChange = (event: any) => {
    setSelectedSubItem(event.target.value);
  };

  const handleSubmit = () => {
    onSave({
      categoryId: selectedCategory,
      itemId: selectedSubItem || selectedItem,
      rating,
      notes,
    });
    // Reset form
    setSelectedCategory('');
    setSelectedItem('');
    setSelectedSubItem('');
    setRating(3);
    setNotes('');
  };

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);
  const selectedItemData = selectedCategoryData?.items.find(item => item.id === selectedItem);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Category</InputLabel>
        <Select
          value={selectedCategory}
          label="Category"
          onChange={handleCategoryChange}
        >
          {categories.map((category) => (
            <MenuItem key={category.id} value={category.id}>
              {category.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedCategory && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Item</InputLabel>
          <Select
            value={selectedItem}
            label="Item"
            onChange={handleItemChange}
          >
            {selectedCategoryData?.items.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedItem && selectedItemData?.subItems && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Sub-Item</InputLabel>
          <Select
            value={selectedSubItem}
            label="Sub-Item"
            onChange={handleSubItemChange}
          >
            {selectedItemData.subItems.map((subItem) => (
              <MenuItem key={subItem.id} value={subItem.id}>
                {subItem.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {(selectedItem || selectedSubItem) && (
        <>
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
        </>
      )}
    </Box>
  );
};

export default TrackingForm; 