import express from 'express';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, 'dist')));

// SPA fallback — all routes serve index.html
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FORGE running on port ${PORT}`);
});
