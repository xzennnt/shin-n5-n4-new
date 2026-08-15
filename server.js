import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import usersHandler from './api/users.js';
import progressHandler from './api/progress.js';

async function createServer() {
  const app = express();
  
  // Use express.json() so request.body is populated for the API handlers
  app.use(express.json());

  // Mount API routes
  app.all('/api/users', async (req, res) => {
    await usersHandler(req, res);
  });
  app.all('/api/progress', async (req, res) => {
    await progressHandler(req, res);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server listening on http://0.0.0.0:3000');
  });
}

createServer();
