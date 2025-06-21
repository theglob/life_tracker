const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');

// Mock the auth middleware
jest.mock('../middleware/auth', () => {
  return (req, res, next) => {
    req.user = { id: 'test-user-id' };
    next();
  };
});

// Mock fs.promises
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

// Import the app after mocking
let app;
beforeAll(async () => {
  // Clear module cache to ensure fresh import
  jest.resetModules();
  app = require('../index');
});

describe('Entries API - Delete Endpoint', () => {
  const mockEntries = [
    {
      id: 'entry1',
      categoryId: 'cat1',
      itemId: 'item1',
      timestamp: '2024-01-01T10:00:00.000Z',
      rating: 4,
      notes: 'Test entry 1',
      userId: 'test-user-id',
    },
    {
      id: 'entry2',
      categoryId: 'cat2',
      itemId: 'item2',
      timestamp: '2024-01-02T10:00:00.000Z',
      rating: 5,
      notes: 'Test entry 2',
      userId: 'test-user-id',
    },
    {
      id: 'entry3',
      categoryId: 'cat1',
      itemId: 'item3',
      timestamp: '2024-01-03T10:00:00.000Z',
      rating: 3,
      notes: 'Test entry 3',
      userId: 'other-user-id',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock readFile to return our test data
    fs.readFile.mockResolvedValue(JSON.stringify(mockEntries));
    // Mock writeFile to do nothing
    fs.writeFile.mockResolvedValue();
  });

  describe('DELETE /api/entries/:id', () => {
    it('should delete an entry when it exists and belongs to the user', async () => {
      const entryId = 'entry1';

      const response = await request(app)
        .delete(`/api/entries/${entryId}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(204);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(__dirname, '../data/entries.json'),
        JSON.stringify([
          {
            id: 'entry2',
            categoryId: 'cat2',
            itemId: 'item2',
            timestamp: '2024-01-02T10:00:00.000Z',
            rating: 5,
            notes: 'Test entry 2',
            userId: 'test-user-id',
          },
          {
            id: 'entry3',
            categoryId: 'cat1',
            itemId: 'item3',
            timestamp: '2024-01-03T10:00:00.000Z',
            rating: 3,
            notes: 'Test entry 3',
            userId: 'other-user-id',
          },
        ], null, 2)
      );
    });

    it('should return 404 when entry does not exist', async () => {
      const entryId = 'nonexistent-entry';

      const response = await request(app)
        .delete(`/api/entries/${entryId}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Entry not found' });
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should return 403 when entry belongs to another user', async () => {
      const entryId = 'entry3'; // This entry belongs to 'other-user-id'

      const response = await request(app)
        .delete(`/api/entries/${entryId}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Forbidden: Cannot delete entry belonging to another user' });
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should handle file read errors gracefully', async () => {
      fs.readFile.mockRejectedValue(new Error('File read error'));

      const response = await request(app)
        .delete('/api/entries/entry1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });

    it('should handle file write errors gracefully', async () => {
      fs.writeFile.mockRejectedValue(new Error('File write error'));

      const response = await request(app)
        .delete('/api/entries/entry1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });

    it('should handle malformed JSON in entries file', async () => {
      fs.readFile.mockResolvedValue('invalid json');

      const response = await request(app)
        .delete('/api/entries/entry1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Internal server error' });
    });

    it('should handle empty entries file', async () => {
      fs.readFile.mockResolvedValue('[]');

      const response = await request(app)
        .delete('/api/entries/entry1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Entry not found' });
    });

    it('should preserve all other entries when deleting one', async () => {
      const entryId = 'entry2';

      await request(app)
        .delete(`/api/entries/${entryId}`)
        .set('Authorization', 'Bearer test-token');

      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(__dirname, '../data/entries.json'),
        JSON.stringify([
          {
            id: 'entry1',
            categoryId: 'cat1',
            itemId: 'item1',
            timestamp: '2024-01-01T10:00:00.000Z',
            rating: 4,
            notes: 'Test entry 1',
            userId: 'test-user-id',
          },
          {
            id: 'entry3',
            categoryId: 'cat1',
            itemId: 'item3',
            timestamp: '2024-01-03T10:00:00.000Z',
            rating: 3,
            notes: 'Test entry 3',
            userId: 'other-user-id',
          },
        ], null, 2)
      );
    });

    it('should handle case where user has no entries', async () => {
      const userEntries = [
        {
          id: 'entry3',
          categoryId: 'cat1',
          itemId: 'item3',
          timestamp: '2024-01-03T10:00:00.000Z',
          rating: 3,
          notes: 'Test entry 3',
          userId: 'other-user-id',
        },
      ];

      fs.readFile.mockResolvedValue(JSON.stringify(userEntries));

      const response = await request(app)
        .delete('/api/entries/entry1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Entry not found' });
    });
  });

  describe('DELETE /api/entries/:id - Edge Cases', () => {
    it('should handle entry with missing fields gracefully', async () => {
      const incompleteEntries = [
        {
          id: 'entry1',
          categoryId: 'cat1',
          // Missing other fields
          userId: 'test-user-id',
        },
      ];

      fs.readFile.mockResolvedValue(JSON.stringify(incompleteEntries));

      const response = await request(app)
        .delete('/api/entries/entry1')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(204);
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(__dirname, '../data/entries.json'),
        JSON.stringify([], null, 2)
      );
    });

    it('should handle very large entry IDs', async () => {
      const largeEntryId = 'a'.repeat(1000);

      const response = await request(app)
        .delete(`/api/entries/${largeEntryId}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Entry not found' });
    });

    it('should handle special characters in entry ID', async () => {
      const specialEntryId = 'entry-1@#$%^&*()';

      const response = await request(app)
        .delete(`/api/entries/${specialEntryId}`)
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Entry not found' });
    });
  });
}); 