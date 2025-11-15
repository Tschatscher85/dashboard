# NAS Image Proxy - Öffentlicher Zugriff auf geschützte Bilder

## Problem

**Symptom:** Bilder vom NAS werden im Dashboard angezeigt, aber **nicht auf öffentlichen Landing Pages**.

**Root Cause:** Browser blockieren Credentials in Cross-Origin Image URLs aus Sicherheitsgründen.

### Warum funktionieren direkte NAS-URLs nicht?

```html
<!-- ❌ FUNKTIONIERT NICHT im Browser -->
<img src="https://user:password@nas.example.com/path/image.jpg" />
```

**Browser-Verhalten:**
- Moderne Browser (Chrome, Firefox, Safari) blockieren Credentials in `<img src="...">` URLs
- Sicherheitsfeature: Verhindert Credential-Leaking über Referer-Header
- Error: `Not allowed to load local resource` oder `ERR_UNSAFE_URL`

### Warum funktioniert es im Dashboard?

Im Dashboard sind Benutzer **eingeloggt** und der Browser sendet Session-Cookies mit. Das Backend kann dann mit Admin-Credentials auf das NAS zugreifen.

Auf **öffentlichen Landing Pages** gibt es keine Session → keine Berechtigung → keine Bilder!

---

## Lösung: Server-Side Proxy

**Konzept:** Der Server holt die Bilder vom NAS und gibt sie an den Browser weiter - **ohne Credentials in der URL**.

```
Browser → /api/nas/Daten/.../bild.jpg → Server → NAS (mit Auth) → Server → Browser
```

### Architektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Public)                        │
│  <img src="/api/nas/Daten/.../bild.jpg" />                     │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP GET (no credentials)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express Server (Proxy)                       │
│  GET /api/nas/*                                                 │
│  1. Load READ-ONLY credentials from database                   │
│  2. Connect to NAS via WebDAV                                  │
│  3. Fetch file with authentication                             │
│  4. Return file to browser (with caching)                      │
└────────────────────────────┬────────────────────────────────────┘
                             │ WebDAV (with credentials)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NAS (UGREEN / Synology)                      │
│  WebDAV Server (Port 2002)                                     │
│  Requires: Username + Password                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation

### 1. Proxy Endpoint (server/_core/index.ts)

```typescript
// NAS file proxy endpoint (uses READ-ONLY credentials for security)
app.get('/api/nas/*', async (req, res) => {
  try {
    // Extract path after /api/nas/
    const nasPath = req.path.replace('/api/nas/', '');
    console.log('[NAS Proxy] Fetching file:', nasPath);

    // Load credentials from database (appConfig table)
    const { getDb } = await import('../db');
    const database = await getDb();
    const configMap = new Map<string, string>();
    
    if (database) {
      const { appConfig } = await import('../../drizzle/schema');
      const configs = await database.select().from(appConfig);
      configs.forEach(c => configMap.set(c.configKey, c.configValue || ''));
    }

    // Get read-only credentials
    const readOnlyUsername = configMap.get('NAS_PUBLIC_USERNAME') || '';
    const readOnlyPassword = configMap.get('NAS_PUBLIC_PASSWORD') || '';
    const webdavUrl = configMap.get('WEBDAV_URL') || '';
    const webdavPort = configMap.get('WEBDAV_PORT') || '2002';

    if (!webdavUrl || !readOnlyUsername || !readOnlyPassword) {
      return res.status(500).json({ error: 'NAS read-only access not configured' });
    }

    // Create WebDAV client with read-only credentials
    const { createClient } = await import('webdav');
    const https = await import('https');
    
    let normalizedUrl = webdavUrl.replace(/\/+$/, '');
    if (!normalizedUrl.includes(':' + webdavPort)) {
      normalizedUrl = `${normalizedUrl}:${webdavPort}`;
    }
    
    const client = createClient(normalizedUrl, {
      username: readOnlyUsername,
      password: readOnlyPassword,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false, // Accept self-signed certificates
      }),
    });
    
    // Fetch file from NAS
    const decodedPath = decodeURIComponent(nasPath);
    const fullPath = `/${decodedPath}`;
    const fileBuffer = await client.getFileContents(fullPath) as Buffer;
    
    // Determine content type
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
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour cache
    res.send(fileBuffer);
    
  } catch (error: any) {
    console.error('[NAS Proxy] Error:', error);
    res.status(500).json({ error: 'Failed to fetch file from NAS' });
  }
});
```

### 2. Upload Code (server/routers.ts)

**VORHER (❌ Funktioniert nicht öffentlich):**
```typescript
// Build direct NAS URL
const baseUrl = webdavUrl.replace(/:2002$/, '');
const relativePath = nasPath.replace(/^\/volume1/, '');
const encodedPath = relativePath.split('/').map(p => encodeURIComponent(p)).join('/');
url = `${baseUrl}${encodedPath}`; // https://ugreen.example.com/Daten/.../bild.jpg
```

**NACHHER (✅ Funktioniert öffentlich):**
```typescript
// Build proxy URL (browser accesses via /api/nas/* which handles authentication)
const relativePath = nasPath.replace(/^\/volume1/, '');
const encodedPath = relativePath.split('/').map(p => encodeURIComponent(p)).join('/');
url = `/api/nas${encodedPath}`; // /api/nas/Daten/.../bild.jpg
```

### 3. Database Configuration

**Read-Only Credentials in `appConfig` Tabelle:**

```sql
INSERT INTO appConfig (configKey, configValue) 
VALUES 
  ('NAS_PUBLIC_USERNAME', 'ImmoJaeger'),
  ('NAS_PUBLIC_PASSWORD', 'Survive1985#')
ON DUPLICATE KEY UPDATE configValue = VALUES(configValue);
```

**Wichtig:** Diese Credentials sollten **READ-ONLY** Rechte haben!

---

## Security Best Practices

### 1. Separate Read-Only User

**Erstelle einen separaten NAS-User nur für öffentliche Bilder:**

```
Username: ImmoJaeger (oder ähnlich)
Password: Starkes Passwort
Rechte: NUR LESEN in /Daten/... Ordner
```

**Warum?**
- Wenn Credentials kompromittiert werden, kann niemand Dateien löschen/ändern
- Admin-Credentials bleiben geschützt
- Audit-Trail: Unterscheidung zwischen Admin- und Public-Zugriff

### 2. Database Storage (nicht Environment Variables)

**Warum in der Datenbank?**
- ✅ Änderbar über Settings-UI
- ✅ Keine Code-Änderungen nötig
- ✅ Keine `.env` Datei in Git
- ✅ Einfacher Credential-Rotation

### 3. Caching

```typescript
res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
```

**Vorteile:**
- Reduziert NAS-Last
- Schnellere Ladezeiten
- Weniger Netzwerk-Traffic

### 4. Self-Signed Certificates

```typescript
httpsAgent: new https.Agent({
  rejectUnauthorized: false, // Accept self-signed certificates
})
```

**Nur verwenden wenn:**
- NAS verwendet selbst-signierte SSL-Zertifikate (UGREEN, Synology)
- NAS ist im lokalen Netzwerk
- Für Produktion: Verwende Let's Encrypt Zertifikate!

---

## Testing

### 1. Test Proxy Endpoint

```bash
curl -I http://localhost:3000/api/nas/Daten/Allianz/Agentur%20Jaeger/Beratung/Immobilienmakler/Verkauf/Bahnhofstra%C3%9Fe%202%2C%2073329%20Kuchen/Bilder/Grundriss.jpg
```

**Erwartete Antwort:**
```
HTTP/1.1 200 OK
Content-Type: image/jpeg
Cache-Control: public, max-age=3600
```

### 2. Test in Browser (Inkognito-Modus)

1. Öffne Landing Page im Inkognito-Modus: `https://dashboard.example.com/property/1`
2. Öffne Developer Tools → Network Tab
3. Suche nach `/api/nas/...` Requests
4. Status sollte `200 OK` sein
5. Bilder sollten sichtbar sein

### 3. Test Database Credentials

```bash
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection('mysql://user:pass@localhost:3306/dashboard');
  const [rows] = await conn.execute('SELECT * FROM appConfig WHERE configKey LIKE \"NAS_PUBLIC_%\"');
  console.log(rows);
  await conn.end();
})();
"
```

**Erwartete Ausgabe:**
```javascript
[
  { configKey: 'NAS_PUBLIC_USERNAME', configValue: 'ImmoJaeger' },
  { configKey: 'NAS_PUBLIC_PASSWORD', configValue: 'Survive1985#' }
]
```

---

## Troubleshooting

### Problem: "NAS read-only access not configured"

**Ursache:** Credentials nicht in Datenbank

**Lösung:**
```sql
INSERT INTO appConfig (configKey, configValue) 
VALUES ('NAS_PUBLIC_USERNAME', 'YourUsername'), ('NAS_PUBLIC_PASSWORD', 'YourPassword')
ON DUPLICATE KEY UPDATE configValue = VALUES(configValue);
```

### Problem: "File not found on NAS"

**Ursache:** Pfad stimmt nicht

**Debug:**
```typescript
console.log('[NAS Proxy] Full path:', fullPath);
// Sollte sein: /Daten/Allianz/.../bild.jpg
// NICHT: /volume1/Daten/... (volume1 wird entfernt!)
```

### Problem: Images laden nicht (404)

**Ursache:** URL-Encoding Problem

**Lösung:**
```typescript
// Korrekt: Jedes Pfad-Segment einzeln encoden
const encodedPath = relativePath.split('/').map(p => encodeURIComponent(p)).join('/');
// NICHT: encodeURIComponent(relativePath) → encodet auch die Slashes!
```

### Problem: "Self-signed certificate" Error

**Ursache:** Node.js vertraut selbst-signierten Zertifikaten nicht

**Lösung:**
```typescript
httpsAgent: new https.Agent({
  rejectUnauthorized: false
})
```

---

## Performance Optimization

### 1. CDN (Optional)

Für große Produktions-Deployments:

```typescript
// Upload images to CDN during upload
const cdnUrl = await uploadToCDN(fileBuffer, fileName);
url = cdnUrl; // https://cdn.example.com/...
```

### 2. Image Resizing

```typescript
const sharp = require('sharp');
const thumbnail = await sharp(fileBuffer)
  .resize(800, 600, { fit: 'inside' })
  .jpeg({ quality: 80 })
  .toBuffer();
```

### 3. Redis Caching

```typescript
const redis = require('redis');
const client = redis.createClient();

// Check cache first
const cached = await client.get(`nas:${nasPath}`);
if (cached) {
  return res.send(Buffer.from(cached, 'base64'));
}

// Fetch from NAS and cache
const fileBuffer = await client.getFileContents(fullPath);
await client.setEx(`nas:${nasPath}`, 3600, fileBuffer.toString('base64'));
```

---

## Zusammenfassung

**Problem:** Browser blockieren Credentials in Image-URLs

**Lösung:** Server-Side Proxy mit Read-Only Credentials

**Vorteile:**
- ✅ Öffentliche Landing Pages funktionieren
- ✅ Keine Credentials im Browser
- ✅ Caching für Performance
- ✅ Zentrale Credential-Verwaltung

**Wichtig:**
- Separate Read-Only User verwenden
- Credentials in Datenbank speichern
- Caching aktivieren
- Self-signed Certificates nur für lokale NAS

---

## Weitere Ressourcen

- [WebDAV npm package](https://www.npmjs.com/package/webdav)
- [Express.js Middleware](https://expressjs.com/en/guide/using-middleware.html)
- [Browser Security: Credentials in URLs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication)
- [HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
