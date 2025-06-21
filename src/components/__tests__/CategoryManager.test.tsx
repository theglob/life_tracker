import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryManager from '../CategoryManager';
import { API_URL } from '../../config';

// Mock the config
jest.mock('../../config', () => ({
  API_URL: 'http://localhost:3000',
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('CategoryManager', () => {
  const mockToken = 'mock-token';
  const mockCategories = {
    categories: [
      {
        id: '1',
        name: 'Test Category',
        items: [
          {
            id: 'item1',
            name: 'Test Item',
            subItems: [
              {
                id: 'sub1',
                name: 'Test Sub Item',
              },
            ],
          },
        ],
      },
      {
        id: '2',
        name: 'Empty Category',
        items: [],
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(mockToken);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockCategories,
    });
  });

  describe('Initial Load', () => {
    it('should fetch categories on mount', async () => {
      render(<CategoryManager />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_URL}/api/categories`,
          {
            headers: {
              Authorization: `Bearer ${mockToken}`,
            },
          }
        );
      });
    });

    it('should display categories correctly', async () => {
      render(<CategoryManager />);

      await waitFor(() => {
        expect(screen.getByText('Test Category')).toBeInTheDocument();
        expect(screen.getByText('Empty Category')).toBeInTheDocument();
        expect(screen.getByText('Test Item')).toBeInTheDocument();
        expect(screen.getByText('Test Sub Item')).toBeInTheDocument();
      });
    });

    it('should show rating scale for categories with no items', async () => {
      render(<CategoryManager />);

      await waitFor(() => {
        expect(screen.getByText('Rating Scale')).toBeInTheDocument();
        expect(screen.getByText('Current rating: 3/5')).toBeInTheDocument();
      });
    });
  });

  describe('Adding Categories', () => {
    it('should open dialog when Add Category button is clicked', async () => {
      render(<CategoryManager />);

      await waitFor(() => {
        const addButton = screen.getByText('Add Category');
        fireEvent.click(addButton);
      });

      expect(screen.getByText('Add category')).toBeInTheDocument();
      expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });

    it('should create a new category successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: '3', name: 'New Category', items: [] }),
        });

      render(<CategoryManager />);

      await waitFor(() => {
        const addButton = screen.getByText('Add Category');
        fireEvent.click(addButton);
      });

      const nameInput = screen.getByLabelText('Name');
      await userEvent.type(nameInput, 'New Category');

      const saveButton = screen.getByText('Add');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_URL}/api/categories`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${mockToken}`,
            },
            body: JSON.stringify({ name: 'New Category' }),
          }
        );
      });
    });
  });

  describe('Adding Items', () => {
    it('should open dialog when Add Item button is clicked', async () => {
      render(<CategoryManager />);

      await waitFor(() => {
        const addItemButtons = screen.getAllByTestId('AddIcon');
        fireEvent.click(addItemButtons[1]); // First item add button
      });

      expect(screen.getByText('Add item')).toBeInTheDocument();
    });

    it('should create a new item successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'item2', name: 'New Item', subItems: [] }),
        });

      render(<CategoryManager />);

      await waitFor(() => {
        const addItemButtons = screen.getAllByTestId('AddIcon');
        fireEvent.click(addItemButtons[1]); // First item add button
      });

      const nameInput = screen.getByLabelText('Name');
      await userEvent.type(nameInput, 'New Item');

      const saveButton = screen.getByText('Add');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_URL}/api/categories/1/items`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${mockToken}`,
            },
            body: JSON.stringify({ name: 'New Item' }),
          }
        );
      });
    });
  });

  describe('Adding Sub-Items', () => {
    it('should open dialog when Add Sub-Item button is clicked', async () => {
      render(<CategoryManager />);

      await waitFor(() => {
        const addSubItemButtons = screen.getAllByTestId('AddIcon');
        fireEvent.click(addSubItemButtons[2]); // Sub-item add button
      });

      expect(screen.getByText('Add subItem')).toBeInTheDocument();
    });

    it('should create a new sub-item successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'sub2', name: 'New Sub Item' }),
        });

      render(<CategoryManager />);

      await waitFor(() => {
        const addSubItemButtons = screen.getAllByTestId('AddIcon');
        fireEvent.click(addSubItemButtons[2]); // Sub-item add button
      });

      const nameInput = screen.getByLabelText('Name');
      await userEvent.type(nameInput, 'New Sub Item');

      const saveButton = screen.getByText('Add');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_URL}/api/categories/1/items/item1/subitems`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${mockToken}`,
            },
            body: JSON.stringify({ name: 'New Sub Item' }),
          }
        );
      });
    });
  });

  describe('Renaming Categories and Items', () => {
    it('should open edit dialog for category', async () => {
      render(<CategoryManager />);

      await waitFor(() => {
        const editButtons = screen.getAllByTestId('EditIcon');
        fireEvent.click(editButtons[0]); // Category edit button
      });

      expect(screen.getByText('Edit category')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Category')).toBeInTheDocument();
    });

    it('should update category name successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: '1', name: 'Updated Category', items: [] }),
        });

      render(<CategoryManager />);

      await waitFor(() => {
        const editButtons = screen.getAllByTestId('EditIcon');
        fireEvent.click(editButtons[0]); // Category edit button
      });

      const nameInput = screen.getByDisplayValue('Test Category');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Category');

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_URL}/api/categories/1`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${mockToken}`,
            },
            body: JSON.stringify({ name: 'Updated Category' }),
          }
        );
      });
    });

    it('should open edit dialog for item', async () => {
      render(<CategoryManager />);

      await waitFor(() => {
        const editButtons = screen.getAllByTestId('EditIcon');
        fireEvent.click(editButtons[1]); // Item edit button
      });

      expect(screen.getByText('Edit item')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Item')).toBeInTheDocument();
    });

    it('should update item name successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'item1', name: 'Updated Item', subItems: [] }),
        });

      render(<CategoryManager />);

      await waitFor(() => {
        const editButtons = screen.getAllByTestId('EditIcon');
        fireEvent.click(editButtons[1]); // Item edit button
      });

      const nameInput = screen.getByDisplayValue('Test Item');
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Updated Item');

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_URL}/api/categories/1/items/item1`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${mockToken}`,
            },
            body: JSON.stringify({ name: 'Updated Item' }),
          }
        );
      });
    });
  });

  describe('Deleting Categories and Items', () => {
    it('should delete category successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

      render(<CategoryManager />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('DeleteIcon');
        fireEvent.click(deleteButtons[0]); // Category delete button
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_URL}/api/categories/1`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${mockToken}`,
            },
          }
        );
      });
    });

    it('should delete item successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

      render(<CategoryManager />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('DeleteIcon');
        fireEvent.click(deleteButtons[1]); // Item delete button
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_URL}/api/categories/1/items/item1`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${mockToken}`,
            },
          }
        );
      });
    });

    it('should delete sub-item successfully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

      render(<CategoryManager />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByTestId('DeleteIcon');
        fireEvent.click(deleteButtons[2]); // Sub-item delete button
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_URL}/api/categories/1/items/item1/subitems/sub1`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${mockToken}`,
            },
          }
        );
      });
    });
  });

  describe('Rating Scale for Categories with No Children', () => {
    it('should display rating scale for empty categories', async () => {
      render(<CategoryManager />);

      await waitFor(() => {
        expect(screen.getByText('Rating Scale')).toBeInTheDocument();
        expect(screen.getByText('Current rating: 3/5')).toBeInTheDocument();
      });
    });

    it('should update rating when slider is moved', async () => {
      render(<CategoryManager />);

      await waitFor(() => {
        const slider = screen.getByRole('slider');
        fireEvent.change(slider, { target: { value: '4' } });
      });

      expect(screen.getByText('Current rating: 4/5')).toBeInTheDocument();
    });
  });
}); 