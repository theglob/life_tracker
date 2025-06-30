import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Checkbox,
  Button,
  Typography,
  Box,
  Chip,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';
import { API_URL } from '../config';

interface FoodSearchDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (selectedFoods: string[]) => void;
  contextName?: string;
}

interface FoodItem {
  primaryName: string;
  alternativeNames: string[];
  fullName: string;
}

const FoodSearchDialog: React.FC<FoodSearchDialogProps> = ({ open, onClose, onSave, contextName }) => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodAlternatives, setNewFoodAlternatives] = useState('');

  useEffect(() => {
    if (open) {
      fetchFoodItems();
    }
  }, [open]);

  const fetchFoodItems = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/food-items`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch food items');
      const data = await response.json();
      
      console.log('Raw food data:', data);
      
      // Parse the food items from the format "Primary Name,Alternative Names"
      const parsedFoodItems: FoodItem[] = data.nahrungsmittel.map((item: string) => {
        const parts = item.split(',');
        const primaryName = parts[0].trim();
        const alternativeNames = parts.slice(1).map(name => name.trim());
        return {
          primaryName,
          alternativeNames,
          fullName: item,
        };
      });
      
      console.log('Parsed food items:', parsedFoodItems.slice(0, 5)); // Show first 5 items
      setFoodItems(parsedFoodItems);
    } catch (error) {
      console.error('Error fetching food items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomFood = async () => {
    if (!newFoodName.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const alternatives = newFoodAlternatives.trim() ? `,${newFoodAlternatives.trim()}` : '';
      const fullFoodName = `${newFoodName.trim()}${alternatives}`;
      
      const response = await fetch(`${API_URL}/api/food-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ foodName: fullFoodName }),
      });
      
      if (!response.ok) throw new Error('Failed to add custom food item');
      
      // Refresh the food items list
      await fetchFoodItems();
      
      // Close the add dialog and reset form
      setShowAddDialog(false);
      setNewFoodName('');
      setNewFoodAlternatives('');
      
    } catch (error) {
      console.error('Error adding custom food item:', error);
    }
  };

  const filteredFoodItems = foodItems.filter(item =>
    item.primaryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.alternativeNames.some(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  console.log('Search term:', searchTerm);
  console.log('Total items:', foodItems.length);
  console.log('Filtered items:', filteredFoodItems.length);
  console.log('Sample filtered items:', filteredFoodItems.slice(0, 3));

  const handleFoodToggle = (foodName: string) => {
    setSelectedFoods(prev =>
      prev.includes(foodName)
        ? prev.filter(name => name !== foodName)
        : [...prev, foodName]
    );
  };

  const handleSave = () => {
    onSave(selectedFoods);
    setSelectedFoods([]);
    setSearchTerm('');
    onClose();
  };

  const handleClose = () => {
    setSelectedFoods([]);
    setSearchTerm('');
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontSize: '1rem' }}>
          Nahrungsmittel hinzufügen
          {contextName && (
            <Typography component="span" sx={{ fontSize: '0.8em', color: 'text.secondary', ml: 1 }}>
              ({contextName})
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ minHeight: 300, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
          {selectedFoods.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Ausgewählte Nahrungsmittel:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedFoods.map((food) => (
                  <Chip
                    key={food}
                    label={food}
                    onDelete={() => handleFoodToggle(food)}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Suchen..."
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {searchTerm && (
                    <IconButton onClick={() => setSearchTerm('')} size="small" title="Suche löschen">
                      <CloseIcon />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={() => setShowAddDialog(true)}
                    edge="end"
                    title="Eigenes Nahrungsmittel hinzufügen"
                  >
                    <AddIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          {isLoading ? (
            <Typography>Lade Nahrungsmittel...</Typography>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary', fontSize: '0.7rem' }}>
                {foodItems.length} Nahrungsmittel geladen • {filteredFoodItems.length} gefunden
              </Typography>
              <List sx={{ flex: 1, minHeight: 0, maxHeight: '100%', overflow: 'auto' }}>
                {filteredFoodItems.map((item) => (
                  <ListItem key={item.fullName} disablePadding>
                    <ListItemButton
                      onClick={() => handleFoodToggle(item.primaryName)}
                      dense
                    >
                      <Checkbox
                        edge="start"
                        checked={selectedFoods.includes(item.primaryName)}
                        tabIndex={-1}
                        disableRipple
                      />
                      <ListItemText
                        primary={item.primaryName}
                        secondary={item.alternativeNames.length > 0 ? (
                          <span style={{ fontSize: '0.7rem' }}>{item.alternativeNames.join(', ')}</span>
                        ) : undefined}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Abbrechen</Button>
          <Button onClick={handleSave} variant="contained" disabled={selectedFoods.length === 0}>
            Hinzufügen ({selectedFoods.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Custom Food Dialog */}
      <Dialog open={showAddDialog} onClose={() => setShowAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Eigenes Nahrungsmittel hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name des Nahrungsmittels"
            fullWidth
            value={newFoodName}
            onChange={(e) => setNewFoodName(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="z.B. Apfel"
          />
          <TextField
            margin="dense"
            label="Alternative Namen (optional)"
            fullWidth
            value={newFoodAlternatives}
            onChange={(e) => setNewFoodAlternatives(e.target.value)}
            placeholder="z.B. Öpfel, Apple"
            helperText="Mehrere Namen durch Komma getrennt"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddDialog(false)}>Abbrechen</Button>
          <Button 
            onClick={handleAddCustomFood} 
            variant="contained" 
            disabled={!newFoodName.trim()}
          >
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FoodSearchDialog; 