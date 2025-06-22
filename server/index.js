import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import { auth, generateToken } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const allowedOrigins = [
  'https://theglob.github.io',
  'http://localhost:5173', // Default Vite dev server port
  'http://localhost:3000', // For local client/server on same port
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Data file paths
const dataPath = path.join(__dirname, 'data', 'entries.json');
const usersPath = path.join(__dirname, 'data', 'users.json');
const categoriesPath = path.join(__dirname, 'data', 'categories.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir);
  }
}

// Initialize data files if they don't exist
async function initializeDataFiles() {
  try {
    await fs.access(dataPath);
  } catch {
    await fs.writeFile(dataPath, JSON.stringify([]));
  }

  try {
    await fs.access(usersPath);
  } catch {
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.error('FATAL: ADMIN_PASSWORD environment variable is not set.');
      console.error('Please set the secret using `flyctl secrets set ADMIN_PASSWORD=\"your_secure_password\"` and restart the application.');
      process.exit(1);
    }

    console.log('Creating initial admin user...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const initialUsers = [{
      id: '1',
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    }];
    await fs.writeFile(usersPath, JSON.stringify(initialUsers, null, 2));
    console.log('Created admin user successfully.');
  }

  try {
    await fs.access(categoriesPath);
  } catch {
    const initialCategories = {
      categories: []
    };
    await fs.writeFile(categoriesPath, JSON.stringify(initialCategories, null, 2));
  }
}

// Login route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(await fs.readFile(usersPath, 'utf8'));
    const user = users.find(u => u.username === username);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Categories routes
app.get('/api/categories', auth, async (req, res) => {
  try {
    const data = await fs.readFile(categoriesPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read categories' });
  }
});

app.post('/api/categories', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const data = await fs.readFile(categoriesPath, 'utf8');
    const { categories } = JSON.parse(data);
    const newCategory = {
      ...req.body,
      id: Date.now().toString(),
      items: []
    };
    categories.push(newCategory);
    await fs.writeFile(categoriesPath, JSON.stringify({ categories }, null, 2));
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add category' });
  }
});

app.put('/api/categories/:categoryId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const data = await fs.readFile(categoriesPath, 'utf8');
    const { categories } = JSON.parse(data);
    const index = categories.findIndex(c => c.id === req.params.categoryId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    categories[index] = { ...categories[index], ...req.body };
    await fs.writeFile(categoriesPath, JSON.stringify({ categories }, null, 2));
    res.json(categories[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.delete('/api/categories/:categoryId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const data = await fs.readFile(categoriesPath, 'utf8');
    const { categories } = JSON.parse(data);
    const filteredCategories = categories.filter(c => c.id !== req.params.categoryId);
    
    if (filteredCategories.length === categories.length) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await fs.writeFile(categoriesPath, JSON.stringify({ categories: filteredCategories }, null, 2));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// Items routes
app.post('/api/categories/:categoryId/items', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const data = await fs.readFile(categoriesPath, 'utf8');
    const { categories } = JSON.parse(data);
    const category = categories.find(c => c.id === req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const newItem = {
      ...req.body,
      id: Date.now().toString(),
      subItems: [],
      // Automatically set scaleType to 'weight' for food categories
      scaleType: category.categoryType === 'food' ? 'weight' : (req.body.scaleType || 'rating')
    };
    category.items.push(newItem);
    await fs.writeFile(categoriesPath, JSON.stringify({ categories }, null, 2));
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add item' });
  }
});

app.put('/api/categories/:categoryId/items/:itemId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const data = await fs.readFile(categoriesPath, 'utf8');
    const { categories } = JSON.parse(data);
    const category = categories.find(c => c.id === req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const itemIndex = category.items.findIndex(i => i.id === req.params.itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    category.items[itemIndex] = { ...category.items[itemIndex], ...req.body };
    await fs.writeFile(categoriesPath, JSON.stringify({ categories }, null, 2));
    res.json(category.items[itemIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

app.delete('/api/categories/:categoryId/items/:itemId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const data = await fs.readFile(categoriesPath, 'utf8');
    const { categories } = JSON.parse(data);
    const category = categories.find(c => c.id === req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const itemIndex = category.items.findIndex(i => i.id === req.params.itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    category.items.splice(itemIndex, 1);
    await fs.writeFile(categoriesPath, JSON.stringify({ categories }, null, 2));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// SubItems routes
app.post('/api/categories/:categoryId/items/:itemId/subitems', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const data = await fs.readFile(categoriesPath, 'utf8');
    const { categories } = JSON.parse(data);
    const category = categories.find(c => c.id === req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const item = category.items.find(i => i.id === req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newSubItem = {
      ...req.body,
      id: Date.now().toString()
    };
    item.subItems.push(newSubItem);
    await fs.writeFile(categoriesPath, JSON.stringify({ categories }, null, 2));
    res.status(201).json(newSubItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add subitem' });
  }
});

app.put('/api/categories/:categoryId/items/:itemId/subitems/:subItemId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const data = await fs.readFile(categoriesPath, 'utf8');
    const { categories } = JSON.parse(data);
    const category = categories.find(c => c.id === req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const item = category.items.find(i => i.id === req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const subItemIndex = item.subItems.findIndex(s => s.id === req.params.subItemId);
    if (subItemIndex === -1) {
      return res.status(404).json({ error: 'SubItem not found' });
    }

    item.subItems[subItemIndex] = { ...item.subItems[subItemIndex], ...req.body };
    await fs.writeFile(categoriesPath, JSON.stringify({ categories }, null, 2));
    res.json(item.subItems[subItemIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subitem' });
  }
});

app.delete('/api/categories/:categoryId/items/:itemId/subitems/:subItemId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const data = await fs.readFile(categoriesPath, 'utf8');
    const { categories } = JSON.parse(data);
    const category = categories.find(c => c.id === req.params.categoryId);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const item = category.items.find(i => i.id === req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const subItemIndex = item.subItems.findIndex(s => s.id === req.params.subItemId);
    if (subItemIndex === -1) {
      return res.status(404).json({ error: 'SubItem not found' });
    }

    item.subItems.splice(subItemIndex, 1);
    await fs.writeFile(categoriesPath, JSON.stringify({ categories }, null, 2));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subitem' });
  }
});

// Protected routes
app.get('/api/entries', auth, async (req, res) => {
  try {
    const data = await fs.readFile(dataPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read entries' });
  }
});

app.post('/api/entries', auth, async (req, res) => {
  try {
    const data = await fs.readFile(dataPath, 'utf8');
    const entries = JSON.parse(data);
    const newEntry = {
      ...req.body,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: req.user.id
    };
    entries.push(newEntry);
    await fs.writeFile(dataPath, JSON.stringify(entries, null, 2));
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save entry' });
  }
});

app.delete('/api/entries/:entryId', auth, async (req, res) => {
  try {
    const data = await fs.readFile(dataPath, 'utf8');
    const entries = JSON.parse(data);
    const entryIndex = entries.findIndex(e => e.id === req.params.entryId);
    
    if (entryIndex === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // Check if user owns the entry or is admin
    if (entries[entryIndex].userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this entry' });
    }

    entries.splice(entryIndex, 1);
    await fs.writeFile(dataPath, JSON.stringify(entries, null, 2));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete entry' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Initialize and start server
async function startServer() {
  await ensureDataDirectory();
  await initializeDataFiles();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer(); 