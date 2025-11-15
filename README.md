# 🏢 Immobilien-Verwaltung

Vollständige Immobilienverwaltungs-Plattform mit Objektverwaltung, Kundenverwaltung, Brevo CRM-Integration, NAS-Dokumentenmanagement, Google Maps Integration und Landing Pages.

## 📋 Projektbeschreibung

Diese Anwendung ist ein umfassendes Immobilienverwaltungssystem ähnlich ImmoScout24, Propstack und FlowFact. Sie bietet drei Hauptmodule:

1. **Immobilienmakler** - Objektverwaltung, Exposé-Generierung, Landing Pages
2. **Versicherungen** - Versicherungspolizzen-Verwaltung
3. **Hausverwaltung** - Verträge, Instandhaltung, Nebenkostenabrechnung

## ✨ Features

### 🏠 Immobilienverwaltung
- **160+ Objektfelder** - Vollständige Immobiliendaten (Stammdaten, Preise, Flächen, Ausstattung)
- **Kategorisierte Bildverwaltung** - 12 Kategorien (Hausansicht, Küche, Bad, Wohnzimmer, etc.)
- **Dokumentenverwaltung** - 4 Kategorien (Objektunterlagen, Sensible Daten, Vertragsunterlagen, Upload)
- **Landing Pages** - Propstack-inspiriertes Design mit Bildergalerie, Karte, Kontaktformular
- **Exposé-Generator** - Professionelle PDF-Exposés mit Energieausweis
- **AI-Beschreibungen** - OpenAI-Integration für automatische Objektbeschreibungen
- **Status-Tracking** - 7 Status (Akquise, Vorbereitung, Vermarktung, Reserviert, Notartermin, Verkauft, Abgeschlossen)

### 👥 Kontakt- & Lead-Management
- **Brevo CRM Sync** - Automatische Synchronisierung mit 4 Listen (Immobilien, Eigentümer, Versicherung, Hausverwaltung)
- **Tag-System** - 22 vordefinierte Tags in 3 Kategorien (Dienstleister, Kunde, Partner)
- **Aktivitäten-Tracking** - Historie aller Interaktionen

### 📅 Terminverwaltung
- **Google Calendar Integration** - OAuth 2.0 Synchronisierung
- **Terminkategorien** - Besichtigung, Vertragsunterzeichnung, Besprechung, etc.

### 🗺️ Google Maps Integration
- **Places Autocomplete** - Automatisches Ausfüllen von Adressfeldern
- **Distance Matrix API** - Automatische Berechnung von Entfernungen (ÖPNV, Autobahn, HBF, Flughafen)
- **Geocoding** - Automatische Koordinaten-Ermittlung

### 💾 NAS-Integration (Ugreen/Synology)
- **WebDAV Upload** - Primärer Upload-Kanal (Port 2002)
- **FTP Fallback** - Automatischer Fallback bei WebDAV-Ausfall (Port 21)
- **NAS Proxy** - Server-seitiger Proxy für öffentliche Landing Pages (`/api/nas/*`)
- **Ordnerstruktur** - Automatische Erstellung: `[Straße Hausnummer, PLZ Ort]/Bilder|Objektunterlagen|Sensible Daten|Vertragsunterlagen`
- **Sync-Funktion** - Import existierender Dateien vom NAS in die Datenbank

### 📊 Versicherungen-Modul
- **7 Versicherungstypen** - Haftpflicht, Hausrat, Gebäude, Leben, Berufsunfähigkeit, Rechtsschutz, Kfz
- **Broker-Verträge** - Provisionsabrechnung

### 🏗️ Hausverwaltung-Modul
- **Verwaltungsverträge** - Vertragsverwaltung
- **Instandhaltung** - 5 Kategorien (Reparatur, Wartung, Modernisierung, Notfall, Sonstiges)
- **Nebenkosten** - 9 Kostenarten (Wasser, Strom, Gas, Heizung, Müll, Grundsteuer, Versicherung, Hausmeister, Sonstiges)

### ⚙️ Einstellungen
- **Benutzerverwaltung** - Rollen (User, Admin)
- **API-Konfiguration** - Superchat, Brevo, OpenAI, Google Maps, ImmoScout24
- **Multi-Branding** - 3 separate Brandings für Immobilienmakler, Versicherungen, Hausverwaltung
- **Modul-Aktivierung** - Toggle für 3 Geschäftsbereiche

## 🛠️ Technologie-Stack

### Frontend
- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Vite** - Build Tool
- **TailwindCSS 4** - Styling
- **shadcn/ui** - UI Components
- **tRPC** - Type-safe API
- **Wouter** - Routing

### Backend
- **Node.js 20** - Runtime
- **Express 4** - Web Framework
- **tRPC 11** - API Layer
- **Drizzle ORM** - Database ORM
- **MySQL 8.0** - Database
- **WebDAV** - NAS Integration
- **basic-ftp** - FTP Client

### Externe APIs
- **Brevo** - E-Mail Marketing & CRM
- **OpenAI** - AI-Beschreibungen
- **Google Maps** - Places, Geocoding, Distance Matrix
- **Google Calendar** - Termin-Synchronisierung
- **ImmoScout24** - Immobilienportal (vorbereitet)
- **Superchat** - Multi-Channel Messaging (vorbereitet)

## 📦 Installation

### Voraussetzungen
- **Node.js 20+** - JavaScript Runtime
- **pnpm** - Package Manager
- **MySQL 8.0** - Datenbank
- **Git** - Version Control

### 1. Repository klonen
```bash
git clone https://github.com/Tschatscher85/dashboard.git
cd dashboard
```

### 2. Dependencies installieren
```bash
pnpm install
```

### 3. Datenbank erstellen
```bash
mysql -u root -p
```

```sql
CREATE DATABASE dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'immojaeger'@'localhost' IDENTIFIED BY 'IHR_PASSWORT';
GRANT ALL PRIVILEGES ON dashboard.* TO 'immojaeger'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. .env Datei erstellen
```bash
cp .env.example .env
nano .env
```

**Beispiel .env:**
```env
# Database
DATABASE_URL=mysql://immojaeger:IHR_PASSWORT@localhost:3306/dashboard

# JWT Secret
JWT_SECRET=generiere-einen-sicheren-random-string

# NAS WebDAV Configuration (Admin-Zugriff für Upload)
NAS_WEBDAV_URL=https://ihre-nas-url.de
NAS_USERNAME=admin-user
NAS_PASSWORD=admin-passwort

# NAS FTP Configuration (Fallback)
NAS_FTP_HOST=ftp.ihre-nas-url.de
NAS_FTP_PORT=21
NAS_FTP_USER=admin-user
NAS_FTP_PASSWORD=admin-passwort

# Brevo API
BREVO_API_KEY=xkeysib-...

# OpenAI API
OPENAI_API_KEY=sk-proj-...

# Google Maps API
GOOGLE_MAPS_API_KEY=AIzaSy...

# Server Port
PORT=3000
```

### 5. Datenbank-Schema migrieren
```bash
pnpm db:push
```

### 6. Development Server starten
```bash
pnpm dev
```

Anwendung läuft auf: **http://localhost:3000**

## 🚀 Production Deployment (VM)

### Automatisch (empfohlen)
```bash
./setup.sh
```

Das Setup-Skript installiert automatisch alle Abhängigkeiten, erstellt die Datenbank und startet die Anwendung.

### Manuell

#### 1. PM2 installieren
```bash
npm install -g pm2
```

#### 2. Build erstellen
```bash
pnpm build
```

#### 3. PM2 starten
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Updates durchführen
```bash
./update.sh
```

**Siehe auch:** [DEPLOYMENT.md](DEPLOYMENT.md) und [QUICKSTART-VM.md](QUICKSTART-VM.md) für detaillierte Anleitungen

### 4. Nginx Reverse Proxy (optional)
```nginx
server {
    listen 80;
    server_name ihre-domain.de;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔐 API-Keys & Secrets

### Brevo CRM
1. Account erstellen: https://www.brevo.com
2. API Key generieren: **Einstellungen → API Keys**
3. Listen erstellen:
   - **Immobilienanfrage** (z.B. ID 18)
   - **Eigentümeranfrage** (z.B. ID 19)
   - **Versicherung** (z.B. ID 20)
   - **Hausverwaltung** (z.B. ID 21)

### OpenAI
1. Account erstellen: https://platform.openai.com
2. API Key generieren: **API Keys → Create new secret key**
3. Guthaben aufladen (mindestens $5)

### Google Maps
1. Google Cloud Console: https://console.cloud.google.com
2. Projekt erstellen
3. APIs aktivieren:
   - **Places API**
   - **Geocoding API**
   - **Distance Matrix API**
   - **Maps JavaScript API**
4. API Key erstellen: **APIs & Services → Credentials**
5. API Key einschränken (empfohlen):
   - **Application restrictions:** HTTP referrers
   - **API restrictions:** Nur die 4 oben genannten APIs

### Google Calendar (optional)
1. Google Cloud Console → **APIs & Services → Credentials**
2. **OAuth 2.0 Client IDs** erstellen
3. Authorized redirect URIs: `https://ihre-domain.de/api/oauth/google/callback`
4. Client ID und Secret in Settings eintragen

### NAS WebDAV/FTP
**Ugreen NAS:**
- WebDAV aktivieren: **Einstellungen → Netzwerk → WebDAV** (Port 2002)
- FTP aktivieren: **Einstellungen → Netzwerk → FTP** (Port 21)
- Benutzer anlegen: **Einstellungen → Benutzer**
- Ordner freigeben: `/volume1/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf`

**Synology NAS:**
- WebDAV aktivieren: **Systemsteuerung → Dateidienste → WebDAV**
- FTP aktivieren: **Systemsteuerung → Dateidienste → FTP**

## 🗄️ Datenbank-Schema

**15 Tabellen:**
- `users` - Benutzer & Rollen
- `properties` - Immobilien (160+ Felder)
- `propertyImages` - Bilder mit Kategorien
- `documents` - Dokumente mit Kategorien
- `contacts` - Kontakte & Leads
- `appointments` - Termine
- `activities` - Aktivitäten-Historie
- `insurancePolicies` - Versicherungspolizzen
- `brokerContracts` - Maklerverträge
- `propertyManagementContracts` - Hausverwaltungsverträge
- `maintenanceRecords` - Instandhaltung
- `utilityBills` - Nebenkosten
- `inquiries` - Anfragen (Superchat)
- `appConfig` - Einstellungen (Key-Value Store)
- `leads` - Leads

## 📁 Projekt-Struktur

```
immobilien-verwaltung/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # UI Components
│   │   ├── pages/         # Pages (Dashboard, Properties, Contacts, etc.)
│   │   ├── lib/           # tRPC Client
│   │   └── const.ts       # Constants (APP_TITLE, APP_LOGO)
│   └── index.html
├── server/                # Backend (Node.js + Express + tRPC)
│   ├── _core/             # Core Framework (OAuth, Context, tRPC)
│   ├── db.ts              # Database Queries
│   ├── routers.ts         # tRPC Routers
│   ├── lib/               # Libraries (WebDAV, FTP, Brevo, OpenAI)
│   └── routes/            # Express Routes (Webhooks)
├── drizzle/               # Database Schema & Migrations
│   ├── schema.ts          # Drizzle Schema
│   └── migrations/        # SQL Migrations
├── shared/                # Shared Types & Constants
├── .env                   # Environment Variables (NICHT committen!)
├── package.json
├── tsconfig.json
└── README.md
```

## 🔧 NAS-Integration Details

### Upload-Logik
1. **WebDAV** (Primär) - Port 2002, HTTPS mit self-signed SSL
2. **FTP** (Fallback) - Port 21, optional FTPS (Port 990)
3. **S3** (Final Fallback) - Cloud Storage

### Ordnerstruktur auf NAS
```
/volume1/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf/
└── Bahnhofstraße 2, 73329 Kuchen/
    ├── Bilder/                    # Öffentlich (Landing Page, Exposé)
    ├── Objektunterlagen/          # Öffentlich (Interessenten)
    ├── Sensible Daten/            # Intern (nur Admin)
    └── Vertragsunterlagen/        # Intern (nur Admin)
```

### NAS Proxy Endpoint
**Problem:** Browser blockieren Credentials in Image-URLs (`https://user:pass@nas/image.jpg`)

**Lösung:** Server-seitiger Proxy `/api/nas/*`
- Lädt Read-Only Credentials aus Datenbank
- Holt Bilder vom NAS mit Authentication
- Gibt Bilder an Browser ohne Credentials zurück
- 1-Stunde Caching für Performance

**Verwendung:**
```html
<!-- Statt direkter NAS-URL: -->
<img src="https://ugreen.tschatscher.eu/Daten/.../bild.jpg" />

<!-- Proxy-URL verwenden: -->
<img src="/api/nas/Daten/.../bild.jpg" />
```

### Read-Only Zugriff konfigurieren
1. **NAS:** Separaten Benutzer anlegen (z.B. `ImmoJaeger`)
2. **Rechte:** Nur Lese-Zugriff auf Immobilien-Ordner
3. **Settings UI:** Credentials in "NAS Public Username/Password" eintragen

## 🗺️ Google Maps Integration

### Places Autocomplete
- Automatisches Ausfüllen: Straße, Hausnummer, PLZ, Stadt, Land
- Automatische Koordinaten (Latitude/Longitude)
- Nur deutsche Adressen (`componentRestrictions: { country: 'de' }`)

### Distance Matrix API
- Automatische Berechnung von Entfernungen
- 4 Ziele: ÖPNV, Autobahn, Hauptbahnhof, Flughafen
- Ergebnisse in Minuten (zu Fuß) und Kilometern (Auto)

**Verwendung:**
```typescript
// PropertyDetailForm.tsx - Straßen-Input mit Autocomplete
<Input ref={streetInputRef} ... />

// PropertyRightColumn.tsx - Distanzen berechnen
<Button onClick={calculateDistances}>Distanzen berechnen</Button>
```

## 📝 Landing Pages

### Features
- **Propstack-Design** - Modernes, professionelles Layout
- **Sticky Navigation** - Details, Bilder, Lage, Kontakt
- **Hero Image** - Großes Titelbild (Featured Image)
- **Bildergalerie** - Kategorisiert mit Lightbox
- **Objektdaten-Tabelle** - 30+ Felder in 2 Spalten
- **OpenStreetMap** - Interaktive Karte
- **Kontaktformular** - Lead-Erfassung
- **Dokumente** - Download-Bereich (nur markierte Dokumente)
- **Legal Footer** - Impressum, AGB, Datenschutz (Modals)

### URL-Struktur
```
https://ihre-domain.de/property/:id
```

### SEO-Optimierung
- Meta-Tags (Title, Description)
- Strukturierte Daten (JSON-LD)
- Responsive Design
- Print-optimiert (Exposé)

## 🎨 Multi-Branding

3 separate Brandings für verschiedene Geschäftsbereiche:

1. **Immobilienmakler**
   - Logo, Name, Kontaktdaten
   - Impressum, AGB, Datenschutz
   - Wird auf Landing Pages verwendet

2. **Versicherungen**
   - Separates Branding für Versicherungsbereich

3. **Hausverwaltung**
   - Separates Branding für Hausverwaltungsbereich

**Konfiguration:** Settings → Unternehmen Tab

## 🔄 Brevo CRM Sync

### Automatische Synchronisierung
- **Toggle:** Settings → API-Konfiguration → "Automatische Brevo-Synchronisierung"
- **Trigger:** Beim Erstellen neuer Kontakte
- **Listen:** 4 Listen (Immobilien, Eigentümer, Versicherung, Hausverwaltung)

### Manuelle Synchronisierung
- **Kontakte-Seite:** "Zu Brevo synchronisieren" Button
- **Dialog:** Anfragetyp auswählen
- **Bulk-Sync:** Mehrere Kontakte gleichzeitig

### Badges
Kontakte zeigen farbige Badges für Sync-Status:
- 🔵 **Immobilienanfrage**
- 🟢 **Eigentümeranfrage**
- 🟣 **Versicherung**
- 🟠 **Hausverwaltung**

## 🧪 Testing

### Development
```bash
pnpm dev
```

### Build Test
```bash
pnpm build
pnpm preview
```

### TypeScript Check
```bash
pnpm tsc
```

## 📚 Weitere Dokumentation

- **API Integration Guide:** `docs/API-INTEGRATION-GUIDE.md`
- **Database Schema:** `drizzle/schema.ts`
- **tRPC Routers:** `server/routers.ts`

## 🤝 Contributing

Dieses Projekt ist für internen Gebrauch. Keine externen Contributions.

## 📄 Lizenz

Proprietär - Alle Rechte vorbehalten

## 👨‍💻 Entwickelt für

**Sven Jaeger - Immo-Jaeger**
- Website: https://immo-jaeger.eu
- Adresse: Bahnhofstraße 2, 73329 Kuchen

## 🆘 Support

Bei Fragen oder Problemen:
1. GitHub Issues: https://github.com/Tschatscher85/immobilien-verwaltung/issues
2. E-Mail: support@immo-jaeger.eu

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** 13. November 2025  
**Status:** ✅ Production Ready
