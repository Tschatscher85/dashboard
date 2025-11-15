# NAS Proxy Fix - Zusammenfassung

**Datum:** 14. November 2025  
**Problem:** Bilder vom NAS wurden auf öffentlichen Landing Pages nicht angezeigt  
**Lösung:** Server-Side Proxy mit Read-Only Credentials

---

## 🎯 Problem

### Symptome
- ✅ Bilder werden im Dashboard angezeigt (wenn eingeloggt)
- ❌ Bilder werden auf Landing Pages NICHT angezeigt (öffentlicher Zugriff)
- ❌ Browser zeigt NAS-Login-Dialog an

### Root Cause
Browser blockieren Credentials in Image-URLs aus Sicherheitsgründen:

```html
<!-- ❌ FUNKTIONIERT NICHT -->
<img src="https://user:password@nas.example.com/path/image.jpg" />
```

**Browser-Verhalten:**
- Moderne Browser blockieren Credentials in `<img src="...">` URLs
- Sicherheitsfeature: Verhindert Credential-Leaking
- Error: `Not allowed to load local resource`

---

## ✅ Lösung

### Architektur

```
Browser (Public) 
  → /api/nas/Daten/.../bild.jpg (keine Credentials)
    → Express Server (Proxy)
      → Lädt Read-Only Credentials aus DB
      → Verbindet zu NAS via WebDAV
      → Gibt Bild an Browser zurück
```

### Implementierung

#### 1. Proxy Endpoint (server/_core/index.ts)

Der Proxy-Endpoint ist bereits implementiert (Zeile 49-142):

```typescript
app.get('/api/nas/*', async (req, res) => {
  // Extract path after /api/nas/
  const nasPath = req.path.replace('/api/nas/', '');
  
  // Load read-only credentials from database
  const readOnlyUsername = configMap.get('NAS_PUBLIC_USERNAME') || '';
  const readOnlyPassword = configMap.get('NAS_PUBLIC_PASSWORD') || '';
  
  // Create WebDAV client with read-only credentials
  const client = createClient(normalizedUrl, {
    username: readOnlyUsername,
    password: readOnlyPassword,
    // ...
  });
  
  // Fetch file from NAS
  const fileBuffer = await client.getFileContents(fullPath);
  
  // Return file to browser
  res.setHeader('Content-Type', contentType);
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(fileBuffer);
});
```

#### 2. Upload Code (server/routers.ts)

**Geändert:** URLs verwenden jetzt `/api/nas/...` statt direkte NAS-URLs

```typescript
// ✅ NACH DEM FIX
const relativePath = nasPath.replace(/^\/volume1/, '');
const encodedPath = relativePath.split('/').map(p => encodeURIComponent(p)).join('/');
url = `/api/nas${encodedPath}`;  // /api/nas/Daten/.../bild.jpg
```

**Vorher:**
```typescript
// ❌ VOR DEM FIX
const baseUrl = webdavUrl.replace(/:2002$/, '');
url = `${baseUrl}${encodedPath}`;  // https://ugreen.tschatscher.eu/Daten/.../bild.jpg
```

#### 3. Database Configuration

**Read-Only Credentials in `appConfig` Tabelle:**

```sql
INSERT INTO appConfig (configKey, configValue) 
VALUES 
  ('NAS_PUBLIC_USERNAME', 'ImmoJaeger'),
  ('NAS_PUBLIC_PASSWORD', 'Survive1985#')
ON DUPLICATE KEY UPDATE configValue = VALUES(configValue);
```

**NAS-Berechtigungen:**
- User: `ImmoJaeger`
- Rechte: **NUR LESEN** in `/Daten/...` Ordner
- Kein Schreibzugriff, kein Löschen

---

## 🔧 Migration

### Alte Bilder in Datenbank aktualisieren

**Problem:** Bestehende Bilder haben noch alte URLs (`https://ugreen...`)

**Lösung:** Migration-Script ausführen

```bash
cd ~/dashboard
node scripts/migrate-urls-to-proxy.js
```

**Was macht das Script?**
1. Findet alle Bilder mit `https://ugreen.tschatscher.eu/...` URLs
2. Ersetzt durch `/api/nas/...` URLs
3. Macht dasselbe für Dokumente

**Manuell (falls Script nicht verfügbar):**

```bash
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection('mysql://dashboard:Survive1985%23@localhost:3306/dashboard');
  
  // Migrate images
  await conn.execute(\`
    UPDATE propertyImages 
    SET imageUrl = REPLACE(imageUrl, 'https://ugreen.tschatscher.eu', '/api/nas')
    WHERE imageUrl LIKE 'https://ugreen%'
  \`);
  
  // Migrate documents
  await conn.execute(\`
    UPDATE documents 
    SET fileUrl = REPLACE(fileUrl, 'https://ugreen.tschatscher.eu', '/api/nas')
    WHERE fileUrl LIKE 'https://ugreen%'
  \`);
  
  console.log('✅ Migration completed!');
  await conn.end();
})();
"
```

---

## 🔒 Security Best Practices

### 1. Separate Read-Only User

**Warum?**
- ✅ Wenn Credentials kompromittiert werden, kann niemand Dateien löschen/ändern
- ✅ Admin-Credentials bleiben geschützt
- ✅ Audit-Trail: Unterscheidung zwischen Admin- und Public-Zugriff

**NAS-Setup:**
1. Neuen User erstellen: `ImmoJaeger`
2. Nur **Lese-Rechte** auf `/Daten/...` Ordner
3. Kein Schreibzugriff, kein Löschen

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
- ✅ Reduziert NAS-Last
- ✅ Schnellere Ladezeiten
- ✅ Weniger Netzwerk-Traffic

---

## ✅ Testing

### 1. Test Proxy Endpoint

```bash
curl -I http://localhost:3000/api/nas/Daten/Allianz/Agentur%20Jaeger/.../bild.jpg
```

**Erwartete Antwort:**
```
HTTP/1.1 200 OK
Content-Type: image/jpeg
Cache-Control: public, max-age=3600
```

### 2. Test in Browser (Inkognito-Modus)

1. Öffne Landing Page im Inkognito-Modus
2. Öffne Developer Tools → Network Tab
3. Suche nach `/api/nas/...` Requests
4. Status sollte `200 OK` sein
5. Bilder sollten sichtbar sein

### 3. Test Database Credentials

```bash
node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection('mysql://dashboard:Survive1985%23@localhost:3306/dashboard');
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

## 🐛 Troubleshooting

### Problem: "NAS read-only access not configured"

**Ursache:** Credentials nicht in Datenbank

**Lösung:**
```sql
INSERT INTO appConfig (configKey, configValue) 
VALUES ('NAS_PUBLIC_USERNAME', 'ImmoJaeger'), ('NAS_PUBLIC_PASSWORD', 'Survive1985#')
ON DUPLICATE KEY UPDATE configValue = VALUES(configValue);
```

### Problem: Bilder laden nicht (404)

**Ursache:** URL-Encoding Problem

**Lösung:** Jedes Pfad-Segment einzeln encoden
```typescript
const encodedPath = relativePath.split('/').map(p => encodeURIComponent(p)).join('/');
```

### Problem: NAS-Login-Dialog erscheint

**Ursache:** Code verwendet noch direkte NAS-URLs

**Lösung:** Suche nach `https://ugreen` im Code und ersetze durch `/api/nas`

```bash
cd ~/dashboard
grep -r "https://ugreen" server/ client/
```

### Problem: Alte Bilder werden nicht angezeigt

**Ursache:** Datenbank enthält noch alte URLs

**Lösung:** Migration-Script ausführen (siehe oben)

---

## 📋 Checklist für Deployment

### Vor dem Deployment

- [ ] Read-Only User auf NAS erstellt (`ImmoJaeger`)
- [ ] Credentials in Datenbank gespeichert (`NAS_PUBLIC_USERNAME`, `NAS_PUBLIC_PASSWORD`)
- [ ] Migration-Script ausgeführt (alte URLs aktualisiert)
- [ ] Code zu GitHub gepusht

### Nach dem Deployment

- [ ] `git pull origin main` auf VM
- [ ] `pm2 restart dashboard`
- [ ] Landing Page im Inkognito-Modus testen
- [ ] Bilder werden angezeigt (kein Login-Dialog)
- [ ] Neues Bild hochladen und testen

---

## 📚 Weitere Dokumentation

- **Ausführliche Dokumentation:** `docs/NAS-IMAGE-PROXY.md`
- **Migration-Script:** `scripts/migrate-urls-to-proxy.js`
- **Proxy-Endpoint:** `server/_core/index.ts` (Zeile 49-142)
- **Upload-Code:** `server/routers.ts` (Zeile 755+)

---

## 🎯 Zusammenfassung

**Problem:**
- Browser blockieren Credentials in Image-URLs
- Bilder auf Landing Pages nicht sichtbar

**Lösung:**
- Server-Side Proxy mit Read-Only Credentials
- URLs: `/api/nas/...` statt `https://ugreen.../...`
- Proxy holt Bilder vom NAS und gibt sie an Browser weiter

**Vorteile:**
- ✅ Öffentliche Landing Pages funktionieren
- ✅ Keine Credentials im Browser
- ✅ Caching für Performance
- ✅ Zentrale Credential-Verwaltung
- ✅ Sicherheit durch Read-Only User

**Status:** ✅ **FUNKTIONIERT!**
