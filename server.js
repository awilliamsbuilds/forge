import express from 'express';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

// Data file — use DATA_DIR env var (Railway volume) or fall back to project root
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = join(DATA_DIR, 'forge-data.json');
mkdirSync(DATA_DIR, { recursive: true });

const loadData = () => {
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
};

const saveData = (data) => {
  writeFileSync(DATA_FILE, JSON.stringify(data), 'utf8');
};

app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, 'dist')));

app.get('/api/store/:key', (req, res) => {
  const data = loadData();
  const key = req.params.key;
  if (!(key in data)) return res.status(404).json(null);
  res.json(data[key]);
});

app.put('/api/store/:key', (req, res) => {
  const data = loadData();
  data[req.params.key] = req.body;
  saveData(data);
  res.json({ ok: true });
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`FORGE running on port ${PORT}`));
