import express from 'express';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import Database from 'better-sqlite3';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_PATH || join(__dirname, 'forge.db');

// Init DB
const db = new Database(DB_PATH);
db.exec(`CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);

app.use(express.json({ limit: '10mb' }));
app.use(express.static(join(__dirname, 'dist')));

// Key-value store API
app.get('/api/store/:key', (req, res) => {
  const row = db.prepare('SELECT value FROM store WHERE key = ?').get(req.params.key);
  if (!row) return res.status(404).json(null);
  res.json(JSON.parse(row.value));
});

app.put('/api/store/:key', (req, res) => {
  db.prepare('INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)').run(
    req.params.key,
    JSON.stringify(req.body)
  );
  res.json({ ok: true });
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`FORGE running on port ${PORT}`));
