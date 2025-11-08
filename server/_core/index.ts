import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Webhook endpoints
  app.post('/api/webhooks/superchat', async (req, res) => {
    const { handleSuperchatWebhook } = await import('../webhooks/superchat');
    return handleSuperchatWebhook(req, res);
  });

  // NAS file proxy endpoint
  app.get('/api/nas/*', async (req, res) => {
    try {
      // Extract path after /api/nas/
      const nasPath = req.path.replace('/api/nas/', '');
      console.log('[NAS Proxy] Fetching file:', nasPath);

      // Try WebDAV first
      try {
        const { getWebDAVClient } = await import('../lib/webdav-client');
        const client = getWebDAVClient();
        // Decode URL-encoded path (e.g., %20 -> space)
        const decodedPath = decodeURIComponent(nasPath);
        const fullPath = `/${decodedPath}`;
        
        console.log('[NAS Proxy] WebDAV path:', fullPath);
        const fileBuffer = await client.getFileContents(fullPath) as Buffer;
        
        // Determine content type from file extension
        const ext = nasPath.split('.').pop()?.toLowerCase();
        const contentTypes: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'pdf': 'application/pdf',
        };
        const contentType = contentTypes[ext || ''] || 'application/octet-stream';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(fileBuffer);
        console.log('[NAS Proxy] ✅ File served successfully');
      } catch (webdavError: any) {
        console.error('[NAS Proxy] WebDAV error:', webdavError.message);
        res.status(404).json({ error: 'File not found on NAS', details: webdavError.message });
      }
    } catch (error: any) {
      console.error('[NAS Proxy] Error:', error);
      res.status(500).json({ error: 'Failed to fetch file from NAS' });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
