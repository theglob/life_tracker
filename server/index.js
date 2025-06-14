import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Data file path
const dataPath = path.join(__dirname, 'data', 'entries.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir);
  }
}

// Initialize data file if it doesn't exist
async function initializeDataFile() {
  try {
    await fs.access(dataPath);
  } catch {
    await fs.writeFile(dataPath, JSON.stringify([]));
  }
}

// Read entries
app.get('/api/entries', async (req, res) => {
  try {
    const data = await fs.readFile(dataPath, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to read entries' });
  }
});

// Add new entry
app.post('/api/entries', async (req, res) => {
  try {
    const data = await fs.readFile(dataPath, 'utf8');
    const entries = JSON.parse(data);
    const newEntry = {
      ...req.body,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };
    entries.push(newEntry);
    await fs.writeFile(dataPath, JSON.stringify(entries, null, 2));
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save entry' });
  }
});

// Initialize and start server
async function startServer() {
  await ensureDataDirectory();
  await initializeDataFile();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer(); 