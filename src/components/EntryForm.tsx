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
  items: Item[];
}

interface Item {
  id: string;
  name: string;
  subItems: SubItem[];
  scaleType?: 'rating' | 'weight' | 'count' | 'volume' | 'intensity';
}

interface SubItem {
  id: string;
  name: string;
}

type ScaleType = 'rating' | 'weight' | 'count' | 'volume' | 'intensity';

interface EntryFormProps {
  onSubmit: (entry: Omit<Entry, 'id' | 'timestamp' | 'userId'>) => void;
}

const EntryForm: React.FC<EntryFormProps> = ({ onSubmit }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedSubItems, setSelectedSubItems] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [valueMap, setValueMap] = useState<{ [id: string]: number }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const scaleLabels: Record<ScaleType, string[]> = {
    rating: ['sehr schlecht', 'schlecht', 'ok', 'gut', 'sehr gut'],
    intensity: ['sehr schwach', 'schwach', 'mittel', 'stark', 'sehr stark'],
    weight: [],
    count: [],
    volume: []
  };

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

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setSelectedItem(null);
    setSelectedSubItems([]);
    setSelectedItems([]);
    setValueMap({});
  };

  const handleBackToItems = () => {
    setSelectedItem(null);
    setSelectedSubItems([]);
    setSelectedItems([]);
    setValueMap({});
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubItemToggle = (subItemId: string) => {
    setSelectedSubItems((prev) =>
      prev.includes(subItemId) ? prev.filter((id) => id !== subItemId) : [...prev, subItemId]
    );
  };

  const handleValueChange = (id: string, value: number) => {
    setValueMap((prev) => ({ ...prev, [id]: value }));
  };

  const defaultValueFor = (scaleType?: ScaleType) => {
    switch (scaleType) {
      case 'weight': return 100;
      case 'count': return 1;
      case 'volume': return 250;
      case 'rating': default: return 3;
      case 'intensity': return 3;
    }
  };

  const renderScaleInput = (
    scaleType: ScaleType | undefined,
    value: number,
    onChange: (v: number) => void
  ) => {
    let min = 1, max = 5, step = 1, unit = '', label = '';
    switch (scaleType) {
      case 'weight':
        min = 0; max = 500; step = 10; unit = 'g'; break;
      case 'count':
        min = 0; max = 10; step = 1; unit = 'stk'; break;
      case 'volume':
        min = 0; max = 1000; step = 50; unit = 'ml'; break;
      case 'rating':
      case 'intensity':
        min = 1; max = 5; step = 1; unit = ''; break;
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 220, justifyContent: 'flex-start', p: 0, m: 0 }}>
        <Typography variant="caption" sx={{ minWidth: 32, ml: 2 }}>{min}</Typography>
        <Slider
          value={value}
          onChange={(_, v) => onChange(v as number)}
          min={min}
          max={max}
          step={step}
          sx={{ width: 100, mx: 1, p: 0, m: 0 }}
        />
        <Typography variant="caption" sx={{ minWidth: 32, ml: 2 }}>{max}</Typography>
        <Typography variant="body2" sx={{ ml: 2, minWidth: 48, textAlign: 'left' }}>{value}{unit}</Typography>
      </Box>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return;
    let items: any[] = [];
    if (selectedCategory && selectedCategory.items.length > 0) {
      const itemsWithoutSub = selectedCategory.items.filter(item => item.subItems.length === 0);
      items = [
        ...items,
        ...itemsWithoutSub.filter(item => selectedItems.includes(item.id)).map(item => {
          const scaleType = item?.scaleType;
          const value = valueMap[item.id] ?? defaultValueFor(scaleType);
          let valueObj: any = { itemId: item.id };
          switch (scaleType) {
            case 'weight': valueObj.weight = value; break;
            case 'count': valueObj.count = value; break;
            case 'volume': valueObj.volume = value; break;
            case 'rating':
            case 'intensity': valueObj.rating = value; break;
          }
          return valueObj;
        })
      ];
      const itemsWithSub = selectedCategory.items.filter(item => item.subItems.length > 0);
      items = [
        ...items,
        ...itemsWithSub.flatMap(item =>
          item.subItems.filter(sub => selectedSubItems.includes(sub.id)).map(subItem => {
            const scaleType = item.scaleType;
            const value = valueMap[subItem.id] ?? defaultValueFor(scaleType);
            let valueObj: any = { itemId: subItem.id };
            switch (scaleType) {
              case 'weight': valueObj.weight = value; break;
              case 'count': valueObj.count = value; break;
              case 'volume': valueObj.volume = value; break;
              case 'rating':
              case 'intensity': valueObj.rating = value; break;
            }
            return valueObj;
          })
        )
      ];
    }
    if (items.length === 0) {
      setFormError('Bitte wähle mindestens ein Item aus.');
      return;
    }
    setFormError(null);
    const entryToSubmit = {
      categoryId: selectedCategory.id,
      items,
      notes: notes || undefined,
    };
    console.log('Submitting entry:', entryToSubmit);
    onSubmit(entryToSubmit);
    handleBackToCategories();
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }} className="mobile-container">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1" className="mobile-page-title">
          New Entry
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Button size="small" onClick={handleBackToCategories} disabled={!selectedCategory}>Categories</Button>
          {selectedCategory && <span>&gt;</span>}
          {selectedCategory && (
            <Button size="small" onClick={handleBackToItems} disabled={!selectedItem}>{selectedCategory.name}</Button>
          )}
          {selectedItem && <span>&gt;</span>}
          {selectedItem && <Typography variant="body2">{selectedItem.name}</Typography>}
        </Box>
      </Box>

      {!selectedCategory && (
        <Paper sx={{ p: 2 }} className="mobile-card">
          <List>
            {categories.map((category) => (
              <ListItem key={category.id} disablePadding className="mobile-list-item">
                <ListItemButton onClick={() => setSelectedCategory(category)}>
                  <ListItemText primary={category.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {selectedCategory && !selectedItem && (
        <Paper sx={{ p: 2 }} className="mobile-card">
          <List>
            {selectedCategory.items.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem
                  disablePadding
                  className="mobile-list-item"
                  onClick={e => {
                    if ((e.target as HTMLElement).closest('.scale-input')) return;
                    if (item.subItems.length > 0) {
                      setExpandedItemId(expandedItemId === item.id ? null : item.id);
                    } else {
                      handleItemToggle(item.id);
                    }
                  }}
                  style={{ cursor: item.subItems.length > 0 ? 'pointer' : 'pointer' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                      {item.subItems.length === 0 && (
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleItemToggle(item.id)}
                          style={{ marginLeft: 0, marginRight: 8 }}
                          onClick={e => e.stopPropagation()}
                        />
                      )}
                      <ListItemText primary={item.name} />
                    </Box>
                    {item.subItems.length === 0 && selectedItems.includes(item.id) && (
                      <span className="scale-input" style={{ marginLeft: 8 }}>
                        {renderScaleInput(
                          item.scaleType,
                          valueMap[item.id] ?? defaultValueFor(item.scaleType),
                          v => handleValueChange(item.id, v)
                        )}
                      </span>
                    )}
                    {item.subItems.length > 0 && (
                      <span style={{ marginLeft: 8, fontSize: 18 }}>
                        {expandedItemId === item.id ? '▼' : '▶'}
                      </span>
                    )}
                  </Box>
                </ListItem>
                {item.subItems.length > 0 && expandedItemId === item.id && (
                  <List>
                    {item.subItems.map((subItem) => (
                      <ListItem
                        key={subItem.id}
                        disablePadding
                        className="mobile-list-item"
                        onClick={e => {
                          if ((e.target as HTMLElement).closest('.scale-input')) return;
                          handleSubItemToggle(subItem.id);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
                            <input
                              type="checkbox"
                              checked={selectedSubItems.includes(subItem.id)}
                              onChange={() => handleSubItemToggle(subItem.id)}
                              style={{ marginLeft: 0, marginRight: 8 }}
                              onClick={e => e.stopPropagation()}
                            />
                            <ListItemText primary={subItem.name} />
                          </Box>
                          {selectedSubItems.includes(subItem.id) && (
                            <span className="scale-input" style={{ marginLeft: 8 }}>
                              {renderScaleInput(
                                item.scaleType,
                                valueMap[subItem.id] ?? defaultValueFor(item.scaleType),
                                v => handleValueChange(subItem.id, v)
                              )}
                            </span>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {(selectedCategory && (!selectedItem || (selectedItem && selectedItem.subItems.length > 0))) && (
        <Box sx={{ mt: 2 }}>
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
            onClick={handleSubmit}
            fullWidth
            className="mobile-button"
          >
            Save Entry
          </Button>
        </Box>
      )}
      <Box sx={{ mt: 4 }}>
        {/* Dynamische Skalenanzeige */}
        {(() => {
          // Ermittle das zuletzt selektierte Item/SubItem
          let currentScaleType: ScaleType | undefined;
          let currentUnit = '';
          // Prüfe SubItems zuerst
          if (selectedSubItems.length > 0 && selectedCategory) {
            const allItemsWithSub = selectedCategory.items.filter(i => i.subItems.length > 0);
            for (let i = selectedSubItems.length - 1; i >= 0; i--) {
              const subId = selectedSubItems[i];
              const parent = allItemsWithSub.find(item => item.subItems.some(s => s.id === subId));
              if (parent) {
                currentScaleType = parent.scaleType;
                break;
              }
            }
          } else if (selectedItems.length > 0 && selectedCategory) {
            for (let i = selectedItems.length - 1; i >= 0; i--) {
              const item = selectedCategory.items.find(it => it.id === selectedItems[i]);
              if (item) {
                currentScaleType = item.scaleType;
                break;
              }
            }
          }
          // Einheit bestimmen
          switch (currentScaleType) {
            case 'weight': currentUnit = 'Gramm'; break;
            case 'volume': currentUnit = 'Milliliter'; break;
            case 'count': currentUnit = 'Stück'; break;
          }
          if (currentScaleType === 'rating' || currentScaleType === 'intensity') {
            return (
              <>
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                  <b>Bewertungs-Legende:</b> {scaleLabels[currentScaleType].map((l, i) => `${i+1}: ${l}`).join(', ')}
                </Typography>
              </>
            );
          } else if (currentScaleType && currentUnit) {
            return (
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
                Selektierte Skala: {currentUnit}
              </Typography>
            );
          } else {
            return null;
          }
        })()}
        {formError && (
          <Typography color="error" sx={{ mt: 2, textAlign: 'center' }}>
            {formError}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default EntryForm; 