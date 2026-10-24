import express from 'express';
import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { handleApiRequest } from './worker/router';
import { Env } from './worker/env';

dotenv.config();

const app = express();
// Enforce 100kb request body size limit to protect server memory and prevent payload abuse
app.use(express.json({ limit: '100kb' }));

// Construct Worker Env from server runtime configuration
const workerEnv: Env = {
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_SITE_URL: process.env.VITE_SITE_URL || 'http://localhost:3000',
  VITE_DEMO_MODE: process.env.VITE_DEMO_MODE || 'true',
  VITE_GOOGLE_AUTH_ENABLED: process.env.VITE_GOOGLE_AUTH_ENABLED || 'false',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
};

// Dispatch all /api/* requests through the Cloudflare Worker API router
app.all('/api/*', async (req: ExpressRequest, res: ExpressResponse) => {
  try {
    const fullUrl = `${req.protocol}://${req.get('host') || 'localhost:3000'}${req.originalUrl}`;

    const headers = new Headers();
    for (const [key, val] of Object.entries(req.headers)) {
      if (val !== undefined) {
        if (Array.isArray(val)) {
          for (const item of val) headers.append(key, item);
        } else {
          headers.set(key, val);
        }
      }
    }

    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const bodyStr = hasBody ? JSON.stringify(req.body) : undefined;

    const workerReq = new Request(fullUrl, {
      method: req.method,
      headers,
      body: bodyStr,
    });

    const workerRes = await handleApiRequest(workerReq, workerEnv);

    res.status(workerRes.status);
    workerRes.headers.forEach((val, key) => {
      res.setHeader(key, val);
    });

    const responseBody = await workerRes.text();
    res.send(responseBody);
  } catch (err: any) {
    console.error('Server Worker Bridge Error:', err?.message || err);
    res.status(500).json({ error: 'Internal Worker Router Error' });
  }
});

const isProd = process.env.NODE_ENV === 'production';
const PORT = 3000;

async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const staticDir = fs.existsSync(path.resolve('dist/client'))
      ? path.resolve('dist/client')
      : path.resolve('dist');

    app.use(express.static(staticDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(staticDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ARTS APPAREL Dev/Preview Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only start the server when this file is run directly (not during unit testing)
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { workerEnv };
