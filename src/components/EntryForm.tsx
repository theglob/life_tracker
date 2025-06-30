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
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Entry } from '../types';
import { API_URL } from '../config';
import '../mobile-styles.css';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

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
  const [date, setDate] = useState<Date>(() => new Date());
  const [hour, setHour] = useState<number>(() => {
    const h = new Date().getHours();
    return h % 12 === 0 ? 12 : h % 12;
  });
  const [minute, setMinute] = useState<number>(() => Math.round(new Date().getMinutes() / 10) * 10);
  const [ampm, setAmPm] = useState<'AM' | 'PM'>(() => new Date().getHours() < 12 ? 'AM' : 'PM');
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);

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

  const handleTimeSelect = (h: number, m: number) => {
    setHour(h);
    setMinute(m);
  };

  const handleAmPm = (_: any, value: 'AM' | 'PM') => {
    if (value) setAmPm(value);
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
    const d = new Date(date);
    let h = hour % 12;
    if (ampm === 'PM') h += 12;
    d.setHours(h, minute, 0, 0);
    const timestamp = d.toISOString();
    const entryToSubmit = {
      categoryId: selectedCategory.id,
      items,
      notes: notes || undefined,
      timestamp,
    };
    console.log('Submitting entry:', entryToSubmit);
    onSubmit(entryToSubmit);
    handleBackToCategories();
  };

  const getDisplayDateTime = () => {
    const d = new Date(date);
    let h = hour % 12;
    if (ampm === 'PM') h += 12;
    d.setHours(h, minute, 0, 0);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }} className="mobile-container">
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          {/* Categories-Button entfernt */}
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
          <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
            Aktuell gewählt: {getDisplayDateTime()}
          </Typography>
          <Accordion expanded={showDateTimePicker} onChange={(_, expanded) => setShowDateTimePicker(expanded)} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Datum und Uhrzeit manuell auswählen</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Box sx={{ mb: 2 }}>
                  <label style={{ fontSize: '0.9rem', color: '#555' }}>Datum:</label>
                  <DatePicker
                    value={date}
                    onChange={v => v && setDate(v)}
                    slotProps={{ textField: { size: 'small', fullWidth: true, sx: { mt: 1 } } }}
                  />
                </Box>
              </LocalizationProvider>
              <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label style={{ fontSize: '0.9rem', color: '#555', marginBottom: '2px' }}>Uhrzeit:</label>
                <Box sx={{ position: 'relative', width: 200, height: 200, mb: 1 }}>
                  {/* Hintergrund äußerer Kreis */}
                  <Box sx={{ position: 'absolute', left: 0, top: 0, width: 200, height: 200, borderRadius: '50%', bgcolor: 'rgba(10, 30, 80, 0.3)', zIndex: 0 }} />
                  {/* Minuten-Kreis */}
                  {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const rMin = 95;
                    const xMin = 100 + rMin * Math.sin(angle);
                    const yMin = 100 - rMin * Math.cos(angle);
                    const minVal = i * 5;
                    return (
                      <Box
                        key={minVal}
                        sx={{ position: 'absolute', left: xMin, top: yMin, transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: 2 }}
                        onClick={() => setMinute(minVal)}
                      >
                        <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: minute === minVal ? 'black' : 'transparent', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16, border: minute === minVal ? '2px solid #1976d2' : 'none' }}>
                          {minVal.toString().padStart(2, '0')}
                        </Box>
                      </Box>
                    );
                  })}
                  {/* Hintergrund innerer Kreis + Stunden-Kreis + ToggleButtonGroup */}
                  <Box sx={{ position: 'absolute', left: 30, top: 30, width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(10, 30, 80, 0.8)', zIndex: 1 }}>
                    {/* Stunden-Kreis */}
                    {[...Array(12)].map((_, i) => {
                      const angle = (i * 30) * (Math.PI / 180);
                      const rHour = 62;
                      const center = 70;
                      const xHour = center + rHour * Math.sin(angle);
                      const yHour = center - rHour * Math.cos(angle);
                      const hourValAMPM = ampm === 'AM' ? (i + 1) : (i + 13);
                      return (
                        <Box
                          key={hourValAMPM}
                          sx={{ position: 'absolute', left: xHour, top: yHour, transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: 3 }}
                          onClick={() => setHour(hourValAMPM)}
                        >
                          <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: hour === hourValAMPM ? 'black' : 'transparent', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 13, border: hour === hourValAMPM ? '2px solid #1976d2' : 'none' }}>
                            {hourValAMPM}
                          </Box>
                        </Box>
                      );
                    })}
                    {/* ToggleButtonGroup zentriert im inneren Kreis */}
                    <ToggleButtonGroup value={ampm} exclusive onChange={handleAmPm} sx={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, height: 22 }}>
                      <ToggleButton value="AM" sx={{ fontSize: '0.65rem', px: 1, py: 0.2, minWidth: 24, minHeight: 18 }}>AM</ToggleButton>
                      <ToggleButton value="PM" sx={{ fontSize: '0.65rem', px: 1, py: 0.2, minWidth: 24, minHeight: 18 }}>PM</ToggleButton>
                    </ToggleButtonGroup>
                  </Box>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
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
        {(() => {
          let currentScaleType: ScaleType | undefined;
          let currentUnit = '';
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