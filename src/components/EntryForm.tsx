import React, { useState } from 'react';
import { Box, TextField, Button, FormControl, InputLabel, Select, MenuItem, Rating } from '@mui/material';
import { Entry } from '../types';

interface EntryFormProps {
  onSubmit: (entry: Omit<Entry, 'id' | 'timestamp' | 'userId'>) => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ onSubmit }) => {
  const [categoryId, setCategoryId] = useState('');
  const [itemId, setItemId] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      categoryId,
      itemId,
      rating: rating || undefined,
      notes: notes || undefined,
    });
    // Reset form
    setCategoryId('');
    setItemId('');
    setRating(null);
    setNotes('');
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto' }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Category</InputLabel>
        <Select
          value={categoryId}
          label="Category"
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          <MenuItem value="health">Health</MenuItem>
          <MenuItem value="fitness">Fitness</MenuItem>
          <MenuItem value="mood">Mood</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Item</InputLabel>
        <Select
          value={itemId}
          label="Item"
          onChange={(e) => setItemId(e.target.value)}
          required
        >
          <MenuItem value="sleep">Sleep</MenuItem>
          <MenuItem value="exercise">Exercise</MenuItem>
          <MenuItem value="meditation">Meditation</MenuItem>
        </Select>
      </FormControl>

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