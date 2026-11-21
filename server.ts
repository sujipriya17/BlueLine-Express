import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initializeDatabase } from './server/db.ts';
import { adminRouter } from './server/routes/adminRoutes.ts';
import { authRouter } from './server/routes/authRoutes.ts';
import { bookingRouter, cancellationRouter } from './server/routes/bookingRoutes.ts';
import { busRouter } from './server/routes/busRoutes.ts';
import { publicRouter } from './server/routes/publicRoutes.ts';
import { seedInitialData } from './server/seed.ts';

dotenv.config();

async function startServer() {
  initializeDatabase();
  seedInitialData();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // Explicit CORS handling for local frontend/backend development without wildcard on authenticated routes
  const allowedOrigins = new Set(
    [
      'http://localhost:3000',
      'http://localhost:5173',
      process.env.APP_URL,
    ].filter((v): v is string => Boolean(v))
  );

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'UP', service: 'BlueLine Express API' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/buses', busRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/cancellations', cancellationRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api', publicRouter);

  const distPath = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(distPath);

  if (isProd) {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BlueLine Express server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start BlueLine Express server:', err);
  process.exit(1);
});
