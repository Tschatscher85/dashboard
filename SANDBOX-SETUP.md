# 🧪 Sandbox Entwicklungsumgebung

**Status:** ✅ Bereit für Entwicklung  
**URL:** https://3000-ifmrcgij31owr4ukjz9vh-567f34b3.manusvm.computer

---

## ✅ Was ist eingerichtet?

### 📦 Repository
- **Quelle:** https://github.com/Tschatscher85/dashboard
- **Branch:** main
- **Letzter Commit:** Deployment configuration and automation scripts
- **Verzeichnis:** `/home/ubuntu/dashboard`

### 🔧 Dependencies
- ✅ **pnpm install** ausgeführt
- ✅ Alle Pakete installiert
- ✅ Node.js 22.13.0
- ✅ pnpm 10.4.1

### ⚙️ Konfiguration
- ✅ `.env` Datei erstellt (Development)
- ✅ SQLite Datenbank (dev.db)
- ✅ NAS Read-Only Credentials (ImmoJaeger)
- ✅ Port 3000 freigegeben

### 🚀 Server
- ✅ Development Server läuft
- ✅ Hot Reload aktiviert
- ✅ Öffentlich erreichbar

---

## 🌐 Zugriff

### Öffentliche URL
```
https://3000-ifmrcgij31owr4ukjz9vh-567f34b3.manusvm.computer
```

### Lokaler Zugriff (in Sandbox)
```
http://localhost:3000
```

---

## 📁 Projektstruktur

```
/home/ubuntu/dashboard/
├── client/                 # Frontend (React + Vite)
├── server/                 # Backend (Node.js + Express + tRPC)
├── drizzle/                # Database Schema
├── shared/                 # Shared Types
├── .env                    # Environment Variables (Development)
├── .env.example            # Environment Template
├── ecosystem.config.js     # PM2 Config (für Production)
├── setup.sh                # Setup-Skript (für Production VM)
├── update.sh               # Update-Skript (für Production VM)
├── DEPLOYMENT.md           # Deployment-Anleitung
├── QUICKSTART-VM.md        # VM Quickstart
└── README.md               # Projekt-Dokumentation
```

---

## 🔧 Entwicklungs-Befehle

### Server steuern
```bash
# Dev Server starten (bereits läuft)
cd /home/ubuntu/dashboard
pnpm dev

# Server stoppen
pkill -f "tsx watch"

# Logs anschauen
tail -f /tmp/dev-server.log
```

### Code ändern
```bash
# Dateien bearbeiten
cd /home/ubuntu/dashboard
nano server/routers.ts
nano client/src/pages/Home.tsx

# Hot Reload erkennt Änderungen automatisch
```

### Datenbank
```bash
# Schema ändern
nano drizzle/schema.ts

# Migrationen generieren
pnpm db:push

# Datenbank zurücksetzen
rm dev.db
pnpm db:push
```

### Build testen
```bash
cd /home/ubuntu/dashboard
pnpm build

# Build-Ausgabe prüfen
ls -lh dist/
```

---

## 🔐 Environment Variables (.env)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=file:./dev.db
JWT_SECRET=sandbox-dev-secret-key-for-testing-only
NAS_WEBDAV_URL=https://ugreen.tschatscher.eu:2002
NAS_USERNAME=ImmoJaeger
NAS_PASSWORD=Survive1985#
```

**Hinweis:** SQLite wird für Sandbox verwendet, Production nutzt MySQL.

---

## 📊 Verfügbare Features

### ✅ Funktioniert in Sandbox
- Frontend (React UI)
- Backend (tRPC API)
- Datenbank (SQLite)
- NAS Read-Only Zugriff
- Hot Reload

### ⚠️ Eingeschränkt in Sandbox
- **OAuth:** Nicht konfiguriert (OAUTH_SERVER_URL fehlt)
- **NAS Upload:** Nur Read-Only User (ImmoJaeger)
- **E-Mail:** Keine Brevo API Keys
- **AI:** Keine OpenAI API Keys
- **Maps:** Keine Google Maps API Keys

### 💡 API Keys hinzufügen
```bash
# .env bearbeiten
nano /home/ubuntu/dashboard/.env

# Hinzufügen:
BREVO_API_KEY=xkeysib-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_MAPS_API_KEY=AIzaSy...

# Server neu starten
pkill -f "tsx watch"
cd /home/ubuntu/dashboard && pnpm dev > /tmp/dev-server.log 2>&1 &
```

---

## 🧪 Testing

### Frontend testen
```bash
# Browser öffnen
https://3000-ifmrcgij31owr4ukjz9vh-567f34b3.manusvm.computer
```

### API testen
```bash
# tRPC Endpoint testen
curl http://localhost:3000/api/trpc/system.health
```

### NAS-Verbindung testen
```bash
# WebDAV testen
curl -k -u ImmoJaeger:Survive1985# https://ugreen.tschatscher.eu:2002/
```

---

## 📝 Änderungen committen

### Workflow
```bash
cd /home/ubuntu/dashboard

# Status prüfen
git status

# Änderungen hinzufügen
git add .

# Committen
git commit -m "Beschreibung der Änderungen"

# Zu GitHub pushen
git push origin main
```

---

## 🔄 Von GitHub aktualisieren

```bash
cd /home/ubuntu/dashboard

# Neueste Änderungen holen
git pull origin main

# Dependencies aktualisieren
pnpm install

# Server neu starten
pkill -f "tsx watch"
pnpm dev > /tmp/dev-server.log 2>&1 &
```

---

## 🆘 Troubleshooting

### Server startet nicht
```bash
# Port 3000 prüfen
netstat -tulpn | grep :3000

# Prozesse killen
pkill -f "tsx watch"
pkill -f "pnpm dev"

# Neu starten
cd /home/ubuntu/dashboard
pnpm dev > /tmp/dev-server.log 2>&1 &
```

### Datenbank-Fehler
```bash
# Datenbank zurücksetzen
cd /home/ubuntu/dashboard
rm dev.db
pnpm db:push
```

### Dependencies-Probleme
```bash
# Node modules neu installieren
cd /home/ubuntu/dashboard
rm -rf node_modules
pnpm install
```

---

## 📚 Nächste Schritte

1. **Features entwickeln** - Code ändern, Hot Reload testet automatisch
2. **Testen** - Browser öffnen und Features ausprobieren
3. **Committen** - Änderungen zu GitHub pushen
4. **Deployment** - Auf Production VM mit `./setup.sh` deployen

---

**✅ Sandbox ist bereit für Entwicklung!** 🚀
