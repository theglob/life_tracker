import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntryList from '../EntryList';
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

describe('EntryList', () => {
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
            subItems: [],
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

  const mockEntries = [
    {
      id: 'entry1',
      categoryId: '1',
      itemId: 'item1',
      timestamp: '2024-01-01T10:00:00.000Z',
      rating: 4,
      notes: 'Test notes',
      userId: 'user1',
    },
    {
      id: 'entry2',
      categoryId: '2',
      itemId: '2', // This is a category with no children
      timestamp: '2024-01-02T10:00:00.000Z',
      rating: 5,
      notes: '',
      userId: 'user1',
    },
  ];

  const mockOnRefresh = jest.fn();
  const mockOnDelete = jest.fn();

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
      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

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

    it('should display entries correctly', async () => {
      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Category - Test Item')).toBeInTheDocument();
        expect(screen.getByText('Empty Category - Empty Category')).toBeInTheDocument();
        expect(screen.getByText('Test notes')).toBeInTheDocument();
        expect(screen.getAllByText((content, node) => {
          return !!(node?.textContent?.includes('Rating:') && node.textContent.includes('4'));
        }).length).toBeGreaterThan(0);
        expect(screen.getAllByText((content, node) => {
          return !!(node?.textContent?.includes('Rating:') && node.textContent.includes('5'));
        }).length).toBeGreaterThan(0);
      });
    });

    it('should show empty state when no entries', async () => {
      render(<EntryList entries={[]} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);

      expect(screen.getByText('No entries yet. Add your first entry!')).toBeInTheDocument();
    });
  });

  describe('Delete Entry Functionality', () => {
    it('should display delete button for each entry', async () => {
      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('delete');
        expect(deleteButtons).toHaveLength(2);
      });
    });

    it('should call delete API when delete button is clicked', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('delete');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_URL}/api/entries/entry1`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${mockToken}`,
            },
          }
        );
      });
    });

    it('should call onDelete callback when delete is successful', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('delete');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith('entry1');
      });
    });

    it('should handle delete API errors gracefully', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('delete');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error deleting entry:', expect.any(Error));
        expect(mockOnDelete).not.toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should handle network errors during delete', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('delete');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error deleting entry:', expect.any(Error));
        expect(mockOnDelete).not.toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    it('should work when onDelete callback is not provided', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockCategories,
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 204,
        });

      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} />);
      });

      await waitFor(() => {
        const deleteButtons = screen.getAllByLabelText('delete');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `${API_URL}/api/entries/entry1`,
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

  describe('Entry Display Logic', () => {
    it('should display category name for entries with no children', async () => {
      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Empty Category - Empty Category')).toBeInTheDocument();
      });
    });

    it('should display item name for entries with items', async () => {
      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Category - Test Item')).toBeInTheDocument();
      });
    });

    it('should display timestamp correctly', async () => {
      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      await waitFor(() => {
        expect(screen.getAllByText((content, node) => !!node?.textContent?.includes('1.1.2024, 11:00:00')).length).toBeGreaterThan(0);
        expect(screen.getAllByText((content, node) => !!node?.textContent?.includes('2.1.2024, 11:00:00')).length).toBeGreaterThan(0);
      });
    });

    it('should display rating when present', async () => {
      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      await waitFor(() => {
        expect(screen.getAllByText((content, node) => {
          return !!(node?.textContent?.includes('Rating:') && node.textContent.includes('4'));
        }).length).toBeGreaterThan(0);
        expect(screen.getAllByText((content, node) => {
          return !!(node?.textContent?.includes('Rating:') && node.textContent.includes('5'));
        }).length).toBeGreaterThan(0);
      });
    });

    it('should display notes when present', async () => {
      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      await waitFor(() => {
        expect(screen.getByText('Test notes')).toBeInTheDocument();
      });
    });

    it('should not display rating when not present', async () => {
      const entriesWithoutRating = [
        {
          id: 'entry3',
          categoryId: '1',
          itemId: 'item1',
          timestamp: '2024-01-03T10:00:00.000Z',
          notes: 'No rating entry',
          userId: 'user1',
        },
      ];

      await act(async () => {
        render(<EntryList entries={entriesWithoutRating} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      await waitFor(() => {
        expect(screen.queryByText(/Rating:/)).not.toBeInTheDocument();
        expect(screen.getByText('No rating entry')).toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should call onRefresh when refresh button is clicked', async () => {
      await act(async () => {
        render(<EntryList entries={mockEntries} onRefresh={mockOnRefresh} onDelete={mockOnDelete} />);
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(mockOnRefresh).toHaveBeenCalled();
    });
  });
}); 