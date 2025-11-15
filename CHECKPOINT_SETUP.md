# ImmoJaeger - Setup Checkpoint

**Datum:** 12. November 2025  
**Status:** ✅ Projekt erfolgreich eingerichtet und NAS konfiguriert

## Durchgeführte Schritte

### 1. Repository geklont
```bash
gh repo clone Tschatscher85/immojaeger
```

### 2. Dependencies installiert
```bash
cd immojaeger
pnpm install
```

### 3. Datenbank eingerichtet
- MySQL Server installiert und gestartet
- Datenbank `immojaeger` erstellt
- Migrations ausgeführt: `pnpm db:push`

### 4. Environment-Variablen konfiguriert

Datei: `.env` (nicht in Git, muss lokal erstellt werden)

```env
DATABASE_URL=mysql://root:password@localhost:3306/immojaeger
NODE_ENV=development

# Manus OAuth Configuration
VITE_APP_ID=placeholder
VITE_OAUTH_PORTAL_URL=https://manus.im
OAUTH_SERVER_URL=https://api.manus.im
JWT_SECRET=dev-secret-key-change-in-production
OWNER_OPEN_ID=placeholder
```

### 5. NAS-Konfiguration in Datenbank

**FTP-Zugangsdaten (korrekt):**
- Host: `ftp.tschatscher.eu`
- Port: `21`
- User: `tschatscher`
- Passwort: `Survive1985#`
- Base Path: `/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf/`

**WebDAV-URL:**
- URL: `https://ugreen.tschatscher.eu`
- Read-Only User: `ImmoJaeger`
- Read-Only Passwort: `Survive1985#`

**SQL zum Einfügen der NAS-Konfiguration:**
```sql
INSERT INTO appConfig (configKey, configValue) VALUES 
('nas_protocol', 'ftp'),
('nas_ftp_host', 'ftp.tschatscher.eu'),
('nas_ftp_port', '21'),
('nas_username', 'tschatscher'),
('nas_password', 'Survive1985#'),
('nas_base_path', '/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf/'),
('nas_webdav_url', 'https://ugreen.tschatscher.eu')
ON DUPLICATE KEY UPDATE configValue=VALUES(configValue);
```

### 6. Server gestartet
```bash
pnpm dev
```

Server läuft auf: `http://localhost:3000`

## Verifizierte Funktionalität

✅ **MySQL-Datenbank:** Läuft und ist erreichbar  
✅ **Datenbank-Schema:** Alle Tabellen erstellt (15 Tabellen)  
✅ **Server:** Startet erfolgreich auf Port 3000  
✅ **FTP-Verbindung:** Erfolgreich getestet mit `ftp.tschatscher.eu`  
✅ **NAS-Konfiguration:** In Datenbank gespeichert  

## Wichtige Hinweise

### Zugangsdaten-Korrektur
Die HANDOVER_DOCUMENTATION.md hatte einen Fehler:
- ❌ Falsch: FTP User `ImmoJaeger`
- ✅ Richtig: FTP User `tschatscher`

### WebDAV vs. FTP
- **FTP:** Für Uploads verwenden (User: `tschatscher`)
- **WebDAV Read-Only:** Für Proxy-Zugriff (User: `ImmoJaeger`)

### NAS-Proxy-System
Der Backend-Proxy `/api/nas/*` verwendet die Read-Only WebDAV-Credentials (`ImmoJaeger`), um Bilder sicher an das Frontend zu liefern, ohne die Admin-Credentials preiszugeben.

## Nächste Schritte

1. ✅ Checkpoint erstellt
2. ⏭️ Test: Bild-Upload über Frontend
3. ⏭️ Test: Bild-Anzeige über NAS-Proxy
4. ⏭️ Test: Property Landing Page mit NAS-Bildern

## Bekannte Einschränkungen

- OAuth-Login funktioniert nur mit echten Manus-Credentials
- Für Tests: Admin-User direkt in DB erstellen oder Session-Token manuell setzen
- Frontend zeigt Login-Seite, aber Backend-API ist voll funktionsfähig

## Troubleshooting

### Server startet nicht
```bash
pkill -f "tsx watch"
cd /home/ubuntu/immojaeger
pnpm dev
```

### Datenbank-Verbindung fehlschlägt
```bash
sudo service mysql status
sudo service mysql start
```

### NAS-Verbindung testen
```bash
ftp -n ftp.tschatscher.eu
user tschatscher Survive1985#
pwd
ls
quit
```

---

**Status:** ✅ Bereit für Bilder-Upload-Tests
