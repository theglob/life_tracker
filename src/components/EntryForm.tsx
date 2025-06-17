import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, Rating } from '@mui/material';
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
  const [categoryId, setCategoryId] = useState('');
  const [itemId, setItemId] = useState('');
  const [subItemId, setSubItemId] = useState('');
  const [rating, setRating] = useState<number | null>(null);
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

  const handleCategoryChange = (e: any) => {
    setCategoryId(e.target.value);
    setItemId('');
    setSubItemId('');
  };

  const handleItemChange = (e: any) => {
    setItemId(e.target.value);
    setSubItemId('');
  };

  const handleSubItemChange = (e: any) => {
    setSubItemId(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      categoryId,
      itemId: subItemId || itemId,
      rating: rating || undefined,
      notes: notes || undefined,
    });
    // Reset form
    setCategoryId('');
    setItemId('');
    setSubItemId('');
    setRating(null);
    setNotes('');
  };

  const selectedCategory = categories.find(c => c.id === categoryId);
  const selectedItem = selectedCategory?.items.find(i => i.id === itemId);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto' }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Category</InputLabel>
        <Select
          value={categoryId}
          label="Category"
          onChange={handleCategoryChange}
          required
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
            value={itemId}
            label="Item"
            onChange={handleItemChange}
            required
          >
            {selectedCategory.items.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {selectedItem && selectedItem.subItems.length > 0 && (
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Sub-Item</InputLabel>
          <Select
            value={subItemId}
            label="Sub-Item"
            onChange={handleSubItemChange}
            required
          >
            {selectedItem.subItems.map((subItem) => (
              <MenuItem key={subItem.id} value={subItem.id}>
                {subItem.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <Box sx={{ mb: 2 }}>
        <Rating
          value={rating}
          onChange={(_, newValue) => setRating(newValue)}
          precision={0.5}
        />
      </Box>

      <TextField
        fullWidth
        multiline
        rows={4}
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Button type="submit" variant="contained" fullWidth>
        Save Entry
      </Button>
    </Box>
  );
};

export default EntryForm; 