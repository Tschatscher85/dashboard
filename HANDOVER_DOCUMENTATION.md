# Immobilien-Verwaltungsplattform - Handover Documentation

## Projekt-Übersicht

**GitHub Repository:** https://github.com/Tschatscher85/immojaeger

**Projekt-Typ:** Manus Webdev-Projekt (React + TypeScript + Express + tRPC + MySQL)

**Zweck:** Vollständige Immobilienverwaltungs-Plattform ähnlich ImmoScout24/Propstack mit:
- Objektverwaltung (Properties)
- Kundenverwaltung (Contacts)
- Brevo CRM-Integration
- NAS-Dokumentenmanagement (UGREEN NAS via WebDAV/FTP)
- Property Landing Pages (Exposés)
- Property Links System (virtuelle Touren, Visitenkarten, etc.)

---

## WICHTIG: Checkpoint-Problem

**AKTUELLES PROBLEM:**
Das Manus Checkpoint-System hat einen Git-Konflikt:
```
Error: Failed to push git remote (non-fast-forward)
[internal] failed to get checkpoint: record not found
```

**LÖSUNG FÜR NEUEN AGENT:**
1. Klone das GitHub-Repository: `https://github.com/Tschatscher85/immojaeger`
2. Initialisiere als neues Webdev-Projekt
3. Erstelle einen sauberen Checkpoint
4. Arbeite ab dann mit dem neuen Projekt weiter

---

## Kritische Features: NAS-Integration (WebDAV/FTP)

### Problem: Browser können nicht direkt auf WebDAV zugreifen

**Warum Proxy nötig ist:**
- Browser blockieren Credentials in Image-URLs (`https://user:pass@nas.com/image.jpg`)
- WebDAV erfordert Authentication für jeden Request
- Öffentliche Landing Pages können nicht direkt auf NAS zugreifen

### Lösung: Server-seitiger Proxy

**Backend-Proxy-Endpoint:** `/api/nas/*`

**Datei:** `server/_core/index.ts` (ca. Zeile 150-200)

```typescript
// NAS Proxy Endpoint - Serves images/documents from NAS with authentication
app.get('/api/nas/*', async (req, res) => {
  try {
    const nasPath = req.path.replace('/api/nas', '');
    
    // Load NAS credentials from database (appConfig table)
    const db = await getDb();
    if (!db) {
      return res.status(500).send('Database not available');
    }
    
    const configs = await db.select().from(appConfig);
    const configMap = configs.reduce((acc, c) => {
      acc[c.key] = c.value;
      return acc;
    }, {} as Record<string, string>);

    const nasUrl = configMap['nas_webdav_url'];
    const nasUsername = configMap['nas_username'] || 'ImmoJaeger'; // Read-only user
    const nasPassword = configMap['nas_password'] || 'Survive1985#';

    if (!nasUrl) {
      return res.status(500).send('NAS not configured');
    }

    // Create WebDAV client with credentials
    const client = createClient(nasUrl, {
      username: nasUsername,
      password: nasPassword,
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    });

    // Fetch file from NAS
    const fileBuffer = await client.getFileContents(nasPath);
    
    // Detect content type
    const ext = nasPath.toLowerCase().split('.').pop();
    const contentTypeMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf'
    };
    
    const contentType = contentTypeMap[ext || ''] || 'application/octet-stream';
    
    // Send file with caching headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('[NAS Proxy] Error:', error);
    res.status(404).send('File not found on NAS');
  }
});
```

### Frontend: URL-Konvertierung

**Funktion:** `convertToProxyUrl()`

**Wo verwendet:**
1. `client/src/pages/PropertyLanding.tsx` - Öffentliche Landing Pages
2. `client/src/components/PropertyMedia.tsx` - Medien-Verwaltung
3. `client/src/components/EnhancedMediaTab.tsx` - Medien-Tab in PropertyDetail

**Beispiel-Code:**

```typescript
// Convert NAS URL to proxy URL
const convertToProxyUrl = (url: string): string => {
  if (!url) return '';
  
  // If already a proxy URL, return as-is
  if (url.startsWith('/api/nas/')) return url;
  
  // If NAS URL, convert to proxy
  if (url.includes('ugreen.tschatscher.eu') || url.includes('ftp.tschatscher.eu')) {
    // Extract path after domain
    const match = url.match(/https?:\/\/[^\/]+(.+)/);
    if (match) {
      return `/api/nas${match[1]}`;
    }
  }
  
  // If S3/Cloud URL, return as-is
  return url;
};

// Usage in image rendering:
<img 
  src={convertToProxyUrl(image.imageUrl)} 
  alt={image.title || 'Property image'} 
/>
```

### NAS-Upload-Flow

**Datei:** `server/routers.ts` - `properties.uploadToNAS` endpoint

```typescript
uploadToNAS: protectedProcedure
  .input(z.object({
    propertyId: z.number(),
    fileName: z.string(),
    fileData: z.string(), // base64
    category: z.enum(['bilder', 'objektunterlagen', 'sensible', 'vertragsunterlagen']),
    imageType: z.enum(['hausansicht', 'kueche', 'bad', ...]).optional()
  }))
  .mutation(async ({ input }) => {
    // 1. Get property address for folder naming
    const property = await getPropertyById(input.propertyId);
    const folderName = `${property.street} ${property.houseNumber}, ${property.zipCode} ${property.city}`;
    
    // 2. Try NAS upload first (WebDAV or FTP)
    const nasConfig = await getNASConfig();
    const nasPath = `/Daten/.../Verkauf/${folderName}/${categoryFolder}/${fileName}`;
    
    try {
      // Upload to NAS via WebDAV/FTP
      await uploadFileToNAS(nasPath, fileData);
      
      // 3. Create database entry with NAS URL
      const imageUrl = `https://ugreen.tschatscher.eu${nasPath}`;
      
      if (input.category === 'bilder') {
        await createPropertyImage({
          propertyId: input.propertyId,
          imageUrl: imageUrl,
          nasPath: nasPath,
          title: input.fileName,
          imageType: input.imageType || 'sonstiges'
        });
      } else {
        await createDocument({
          propertyId: input.propertyId,
          documentUrl: imageUrl,
          nasPath: nasPath,
          title: input.fileName,
          category: input.category
        });
      }
      
      return { success: true, storage: 'NAS' };
      
    } catch (error) {
      // 4. Fallback to S3 if NAS fails
      const s3Result = await storagePut(fileName, fileData, mimeType);
      
      await createPropertyImage({
        propertyId: input.propertyId,
        imageUrl: s3Result.url,
        title: input.fileName
      });
      
      return { success: true, storage: 'Cloud' };
    }
  })
```

---

## Property Links System (Propstack-Style)

**Zweck:** Verwaltung von Links zu virtuellen Touren, Visitenkarten, YouTube-Videos, etc.

### Datenbank-Schema

**Datei:** `drizzle/schema.ts`

```typescript
export const propertyLinks = mysqlTable("propertyLinks", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  linkType: varchar("linkType", { length: 50 }).notNull(), // 'virtual_tour', 'business_card', 'youtube', 'custom'
  linkUrl: text("linkUrl").notNull(),
  linkTitle: varchar("linkTitle", { length: 255 }).notNull(),
  displayOrder: int("displayOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

### Backend-Endpoints

**Datei:** `server/db.ts`

```typescript
export async function getPropertyLinks(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select()
    .from(propertyLinks)
    .where(eq(propertyLinks.propertyId, propertyId))
    .orderBy(propertyLinks.displayOrder);
}

export async function createPropertyLink(data: InsertPropertyLink) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.insert(propertyLinks).values(data);
}

export async function updatePropertyLink(id: number, data: Partial<InsertPropertyLink>) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.update(propertyLinks).set(data).where(eq(propertyLinks.id, id));
}

export async function deletePropertyLink(id: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.delete(propertyLinks).where(eq(propertyLinks.id, id));
}
```

**Datei:** `server/routers.ts`

```typescript
propertyLinks: router({
  list: protectedProcedure
    .input(z.object({ propertyId: z.number() }))
    .query(({ input }) => getPropertyLinks(input.propertyId)),
    
  create: protectedProcedure
    .input(z.object({
      propertyId: z.number(),
      linkType: z.string(),
      linkUrl: z.string(),
      linkTitle: z.string(),
      displayOrder: z.number().optional()
    }))
    .mutation(({ input }) => createPropertyLink(input)),
    
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      linkUrl: z.string().optional(),
      linkTitle: z.string().optional(),
      displayOrder: z.number().optional()
    }))
    .mutation(({ input }) => updatePropertyLink(input.id, input)),
    
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePropertyLink(input.id))
})
```

### Frontend-UI

**Datei:** `client/src/components/PropertyMedia.tsx`

Links-Tab mit:
- Liste aller Links
- "Neuer Link" Button
- Bearbeiten/Löschen Buttons
- Link-Typ-Icons (Globe, Video, ExternalLink)

**Datei:** `client/src/components/EnhancedMediaTab.tsx`

Zeigt Links im Medien-Tab der PropertyDetail-Seite.

**Datei:** `client/src/pages/PropertyLanding.tsx`

Zeigt Links auf der öffentlichen Landing Page (wenn vorhanden).

---

## NAS-Konfiguration

### Settings-Seite

**Datei:** `client/src/pages/dashboard/Settings.tsx`

**NAS-Einstellungen Tab:**
- Protokoll-Auswahl: WebDAV / FTP / FTPS
- WebDAV URL: `https://ugreen.tschatscher.eu`
- FTP Host: `ftp.tschatscher.eu`
- Port: Auto-Vorschläge (21 für FTP, 990 für FTPS, 2001 für WebDAV)
- Benutzername: `ImmoJaeger`
- Passwort: `Survive1985#`
- Base Path: `/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf/`

**Wichtig:** Settings werden in `appConfig` Tabelle gespeichert, NICHT in Environment-Variablen!

### WebDAV-Client

**Datei:** `server/lib/webdav-client.ts`

```typescript
import { createClient, WebDAVClient } from 'webdav';
import https from 'https';

let webdavClient: WebDAVClient | null = null;

export async function getWebDAVClient() {
  // Load config from database
  const config = await getNASConfig();
  
  if (!config.nas_webdav_url) {
    throw new Error('NAS WebDAV URL not configured');
  }
  
  // Normalize URL (remove trailing slash)
  const normalizedUrl = config.nas_webdav_url.replace(/\/$/, '');
  
  webdavClient = createClient(normalizedUrl, {
    username: config.nas_username || 'ImmoJaeger',
    password: config.nas_password || 'Survive1985#',
    httpsAgent: new https.Agent({
      rejectUnauthorized: false // For self-signed certificates
    })
  });
  
  return webdavClient;
}

export async function uploadFileToWebDAV(remotePath: string, fileData: Buffer) {
  const client = await getWebDAVClient();
  
  // Create parent directories if needed
  const pathParts = remotePath.split('/').filter(p => p);
  for (let i = 1; i < pathParts.length; i++) {
    const dirPath = '/' + pathParts.slice(0, i).join('/');
    try {
      await client.createDirectory(dirPath);
    } catch (e) {
      // Directory might already exist
    }
  }
  
  // Upload file
  await client.putFileContents(remotePath, fileData);
}
```

### FTP-Client

**Datei:** `server/lib/ftp-client.ts`

```typescript
import { Client as FTPClient } from 'basic-ftp';

export async function uploadFileToFTP(
  host: string,
  port: number,
  user: string,
  password: string,
  remotePath: string,
  fileData: Buffer
) {
  const client = new FTPClient();
  
  try {
    await client.access({
      host: host,
      port: port,
      user: user,
      password: password,
      secure: port === 990 // FTPS if port 990
    });
    
    // Create directories
    const pathParts = remotePath.split('/').filter(p => p);
    for (let i = 1; i < pathParts.length; i++) {
      const dirPath = '/' + pathParts.slice(0, i).join('/');
      try {
        await client.ensureDir(dirPath);
      } catch (e) {
        // Ignore
      }
    }
    
    // Upload file
    await client.uploadFrom(fileData, remotePath);
    
  } finally {
    client.close();
  }
}
```

---

## Wichtige Dateien & Komponenten

### Backend

1. **`server/routers.ts`** - Alle tRPC-Endpoints
   - `properties.*` - CRUD für Immobilien
   - `propertyLinks.*` - Links-Verwaltung
   - `properties.uploadToNAS` - Datei-Upload
   - `properties.syncFromNAS` - NAS-Import

2. **`server/db.ts`** - Datenbank-Funktionen
   - `getPropertyById()` - Lädt Property MIT Images & Documents
   - `createPropertyImage()` - Erstellt Bild-Eintrag
   - `createDocument()` - Erstellt Dokument-Eintrag
   - `getPropertyLinks()` - Lädt Links

3. **`server/_core/index.ts`** - Express-Server
   - `/api/nas/*` - Proxy-Endpoint (KRITISCH!)
   - `/api/trpc/*` - tRPC-Endpoints

4. **`drizzle/schema.ts`** - Datenbank-Schema
   - `properties` - Immobilien
   - `propertyImages` - Bilder
   - `documents` - Dokumente
   - `propertyLinks` - Links
   - `appConfig` - Einstellungen

### Frontend

1. **`client/src/pages/dashboard/PropertyDetail.tsx`**
   - Immobilien-Detailseite
   - Tabs: Details, Aktivitäten, Kontakte, Medien, Historie

2. **`client/src/components/PropertyMedia.tsx`**
   - Medien-Verwaltungsseite
   - Upload, Kategorisierung, Löschen
   - Tabs: Alle Bilder, Hausansicht, Küche, Bad, etc.

3. **`client/src/components/EnhancedMediaTab.tsx`**
   - Medien-Tab in PropertyDetail
   - Zeigt Bilder, Dokumente, Links
   - **WICHTIG:** Muss `convertToProxyUrl()` verwenden!

4. **`client/src/pages/PropertyLanding.tsx`**
   - Öffentliche Landing Page (Exposé)
   - Navigation: Objektdaten, Bilder, Lage, Kontakt
   - **WICHTIG:** Muss `convertToProxyUrl()` verwenden!

5. **`client/src/pages/dashboard/Settings.tsx`**
   - Einstellungen-Seite
   - NAS-Konfiguration
   - Brevo API-Keys
   - Benutzer-Verwaltung

---

## Bekannte Probleme & Lösungen

### Problem 1: Bilder laden nicht (graue Platzhalter)

**Symptom:** Graue Boxen mit "Bild" Text statt echten Bildern

**Ursache:** `convertToProxyUrl()` fehlt oder wird nicht aufgerufen

**Lösung:**
```typescript
// In EnhancedMediaTab.tsx oder PropertyLanding.tsx
const convertToProxyUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('/api/nas/')) return url;
  if (url.includes('ugreen.tschatscher.eu')) {
    const match = url.match(/https?:\/\/[^\/]+(.+)/);
    if (match) return `/api/nas${match[1]}`;
  }
  return url;
};

// Dann in <img> Tags:
<img src={convertToProxyUrl(image.imageUrl)} />
```

### Problem 2: Dokumente zeigen Login-Dialog

**Symptom:** Browser fragt nach NAS-Login beim Öffnen von PDFs

**Ursache:** Direkte NAS-URLs statt Proxy-URLs

**Lösung:** Auch für Dokumente `convertToProxyUrl()` verwenden!

### Problem 3: Upload hängt bei "Bilder werden hochgeladen..."

**Ursache:** NAS nicht erreichbar, kein Timeout

**Lösung:** Bereits implementiert - 15 Sekunden Timeout + S3-Fallback

### Problem 4: TypeScript-Fehler bei Google Calendar

**Symptom:** 
```
error TS2551: Property 'event_id' does not exist
error TS2339: Property 'html_link' does not exist
```

**Ursache:** Google Calendar API gibt `eventId` und `eventLink` zurück (camelCase), Code verwendet `event_id` und `html_link` (snake_case)

**Lösung:**
```typescript
// In server/routers.ts - Google Calendar Integration
eventId: result.eventId,  // nicht result.event_id
eventLink: result.eventLink  // nicht result.html_link
```

---

## Deployment-Checkliste

### Vor dem ersten Start:

1. ✅ Repository klonen: `https://github.com/Tschatscher85/immojaeger`
2. ✅ Als Manus Webdev-Projekt initialisieren
3. ✅ Datenbank-Migration: `pnpm db:push`
4. ✅ Server starten: `pnpm dev`

### Nach dem Start:

1. ✅ Gehe zu **Einstellungen** → **NAS-Konfiguration**
2. ✅ Trage ein:
   - Protokoll: **FTP** (funktioniert am besten)
   - Host: `ftp.tschatscher.eu`
   - Port: `21`
   - Benutzername: `ImmoJaeger`
   - Passwort: `Survive1985#`
   - Base Path: `/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf/`
3. ✅ Klicke **"FTP testen"** → sollte grün werden
4. ✅ Erstelle **ersten Checkpoint**

### Test-Workflow:

1. ✅ Gehe zu **Objekte** → Wähle Immobilie
2. ✅ Klicke **"Medien verwalten"**
3. ✅ Lade ein Testbild hoch
4. ✅ Prüfe: Bild erscheint in der Galerie (nicht grau!)
5. ✅ Gehe zu **Medien-Tab** → Bild sollte dort auch erscheinen
6. ✅ Klicke **"Landing Page öffnen"** → Bild sollte öffentlich sichtbar sein

---

## Nächste Schritte (nach Checkpoint-Fix)

### Priorität 1: Bilder-Anzeige verifizieren
- [ ] `EnhancedMediaTab.tsx` überprüfen: `convertToProxyUrl()` vorhanden?
- [ ] `PropertyLanding.tsx` überprüfen: Alle `<img>` Tags nutzen Proxy?
- [ ] Test: Bild hochladen → in allen 3 Stellen sichtbar?

### Priorität 2: Property Links testen
- [ ] Link hinzufügen (z.B. YouTube-Video)
- [ ] Link erscheint in PropertyMedia?
- [ ] Link erscheint in EnhancedMediaTab?
- [ ] Link erscheint auf Landing Page?

### Priorität 3: NAS-Sync testen
- [ ] Manuell Bilder auf NAS hochladen (via FTP-Client)
- [ ] "Vom NAS synchronisieren" Button klicken
- [ ] Bilder erscheinen in Datenbank?

### Priorität 4: Neue Features
- [ ] Bulk-Upload für Bilder (mehrere Dateien gleichzeitig)
- [ ] Automatische Kategorisierung basierend auf Dateinamen
- [ ] Drag & Drop Sortierung für Bilder
- [ ] Link-Icons basierend auf URL-Typ (YouTube, Matterport, etc.)

---

## Support-Kontakt

**Bei Problemen:**
- GitHub Issues: https://github.com/Tschatscher85/immojaeger/issues
- Manus Support: https://help.manus.im
- Project ID: `nkYygABVVZPo6zrqu4mzvA`

---

## Zusammenfassung für neuen Agent

**WICHTIGSTE PUNKTE:**

1. 🔴 **Checkpoint-System ist kaputt** → Neues Projekt starten
2. 🟢 **Code ist auf GitHub** → Von dort klonen
3. 🔵 **NAS-Proxy ist KRITISCH** → `/api/nas/*` Endpoint muss funktionieren
4. 🟡 **`convertToProxyUrl()` überall verwenden** → Sonst laden Bilder nicht
5. 🟣 **Property Links System ist neu** → Vollständig implementiert, muss getestet werden

**ERSTE SCHRITTE:**

```bash
# 1. Repository klonen
gh repo clone Tschatscher85/immojaeger

# 2. Dependencies installieren
cd immojaeger
pnpm install

# 3. Datenbank migrieren
pnpm db:push

# 4. Server starten
pnpm dev

# 5. NAS in Settings konfigurieren
# 6. Ersten Checkpoint erstellen
# 7. Bilder-Anzeige testen
```

**ERFOLG = Wenn:**
- ✅ Checkpoint erstellt werden kann
- ✅ Bilder in PropertyMedia laden (keine grauen Platzhalter)
- ✅ Bilder in EnhancedMediaTab laden
- ✅ Bilder auf Landing Page laden (öffentlich, ohne Login)
- ✅ Links funktionieren in allen 3 Stellen

---

**Viel Erfolg! 🚀**
