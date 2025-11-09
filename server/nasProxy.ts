import { Request, Response } from 'express';
import axios from 'axios';

/**
 * NAS Image Proxy Endpoint
 * 
 * Proxies images from NAS to browser, handling authentication server-side
 * to bypass browser security restrictions on credentials in img src URLs.
 * 
 * Usage: /api/nas-proxy?path=/Daten/Allianz/...
 */
export async function nasProxyHandler(req: Request, res: Response) {
  try {
    const { path } = req.query;
    
    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid path parameter' });
    }
    
    // Get NAS configuration
    const webdavUrl = process.env.WEBDAV_URL || process.env.NAS_WEBDAV_URL || '';
    const nasPublicUsername = process.env.NAS_PUBLIC_USERNAME || '';
    const nasPublicPassword = process.env.NAS_PUBLIC_PASSWORD || '';
    
    if (!webdavUrl) {
      return res.status(500).json({ error: 'NAS WebDAV URL not configured' });
    }
    
    // Build full URL (remove port for public access)
    const baseUrl = webdavUrl.replace(/:\d+$/, '');
    const fullUrl = `${baseUrl}${path}`;
    
    console.log('[NAS Proxy] Fetching:', fullUrl);
    
    // Fetch image from NAS with authentication
    const response = await axios.get(fullUrl, {
      responseType: 'arraybuffer',
      auth: nasPublicUsername && nasPublicPassword ? {
        username: nasPublicUsername,
        password: nasPublicPassword,
      } : undefined,
      timeout: 10000, // 10 second timeout
    });
    
    // Forward content type
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    
    // Cache for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Send image data
    res.send(Buffer.from(response.data));
    
  } catch (error: any) {
    console.error('[NAS Proxy] Error:', error.message);
    
    if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
    
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to fetch image from NAS',
      details: error.message 
    });
  }
}
