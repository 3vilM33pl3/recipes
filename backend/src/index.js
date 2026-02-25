import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';
import config from './config.js';
import recipesRouter from './routes/recipes.js';
import { getDb } from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Ensure directories exist
[config.uploadDir, config.thumbnailDir, config.qrcodeDir].forEach(dir => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Initialize database
getDb();

// Middleware
app.use(cors({
  origin: config.nodeEnv === 'production' ? config.baseUrl : '*',
}));
app.use(express.json());

// Static files
app.use('/uploads', express.static(config.uploadDir));
app.use('/thumbnails', express.static(config.thumbnailDir));
app.use('/qrcodes', express.static(config.qrcodeDir));

// API routes
app.use('/api/recipes', recipesRouter);

// Serve frontend (in production, built React app is in ../public)
const publicDir = join(__dirname, '../public');
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(publicDir, 'index.html'));
    }
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, error: 'File too large. Maximum size is 10MB.' });
  }

  if (err.message && err.message.includes('File type')) {
    return res.status(400).json({ success: false, error: err.message });
  }

  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
app.listen(config.port, () => {
  console.log(`Recipes Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Base URL: ${config.baseUrl}`);
});
