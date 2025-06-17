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

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Data file paths
const dataPath = path.join(__dirname, 'data', 'entries.json');
const usersPath = path.join(__dirname, 'data', 'users.json');

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
    // Create a fresh hash for the admin password
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const initialUsers = [{
      id: '1',
      username: 'admin',
      password: hashedPassword,
      role: 'admin'
    }];
    await fs.writeFile(usersPath, JSON.stringify(initialUsers, null, 2));
    console.log('Created admin user with password:', adminPassword);
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
      id: Date.now().toString(),
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