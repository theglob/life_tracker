import { Category } from '../types/TrackingTypes';

export const sampleCategories: Category[] = [
  {
    id: 'feelings',
    name: 'How do you feel?',
    items: [
      {
        id: 'physical',
        name: 'Physical',
        subItems: [
          { id: 'headache', name: 'Headache' },
          { id: 'neck-tension', name: 'Neck Tension' },
          { id: 'back-pain', name: 'Back Pain' },
        ],
      },
      {
        id: 'emotional',
        name: 'Emotional',
        subItems: [
          { id: 'happy', name: 'Happy' },
          { id: 'sad', name: 'Sad' },
          { id: 'anxious', name: 'Anxious' },
          { id: 'stressed', name: 'Stressed' },
        ],
      },
    ],
  },
  {
    id: 'food',
    name: 'What did you eat?',
    items: [
      {
        id: 'breakfast',
        name: 'Breakfast',
        subItems: [
          { id: 'cereal', name: 'Cereal' },
          { id: 'toast', name: 'Toast' },
          { id: 'eggs', name: 'Eggs' },
        ],
      },
      {
        id: 'lunch',
        name: 'Lunch',
        subItems: [
          { id: 'sandwich', name: 'Sandwich' },
          { id: 'salad', name: 'Salad' },
          { id: 'soup', name: 'Soup' },
        ],
      },
      {
        id: 'dinner',
        name: 'Dinner',
        subItems: [
          { id: 'pasta', name: 'Pasta' },
          { id: 'meat', name: 'Meat' },
          { id: 'vegetables', name: 'Vegetables' },
        ],
      },
    ],
  },
  {
    id: 'sleep',
    name: 'How did you sleep?',
    items: [
      {
        id: 'quality',
        name: 'Sleep Quality',
        subItems: [
          { id: 'deep', name: 'Deep Sleep' },
          { id: 'light', name: 'Light Sleep' },
          { id: 'interrupted', name: 'Interrupted' },
        ],
      },
      {
        id: 'duration',
        name: 'Sleep Duration',
        subItems: [
          { id: 'short', name: 'Short (< 6h)' },
          { id: 'normal', name: 'Normal (6-8h)' },
          { id: 'long', name: 'Long (> 8h)' },
        ],
      },
    ],
  },
]; 