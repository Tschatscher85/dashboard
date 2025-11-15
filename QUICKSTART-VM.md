# ⚡ Quickstart für deine Ubuntu VM

**Für:** Sven Jaeger - Immo-Jaeger  
**Datum:** 14. November 2025

---

## 🎯 Ziel

Alte Installation entfernen und neue Version von GitHub installieren.

---

## 📋 Schritt-für-Schritt Anleitung

### 🧹 Phase 1: Alte Installation entfernen

```bash
# 1. PM2 stoppen
pm2 stop all
pm2 delete all
pm2 kill

# 2. Datenbank löschen
sudo mysql -e "DROP DATABASE IF EXISTS dashboard;"
sudo mysql -e "DROP USER IF EXISTS 'immojaeger'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 3. Alte Verzeichnisse entfernen
rm -rf ~/dashboard/
rm -rf ~/immobilien-verwaltung/

# 4. Überprüfen
pm2 list                              # Sollte leer sein
sudo mysql -e "SHOW DATABASES;"       # "dashboard" sollte fehlen
ls -la ~/                             # Keine alten Ordner
```

---

### 🚀 Phase 2: Neue Installation

```bash
# 1. Repository klonen
cd ~
git clone https://github.com/Tschatscher85/immobilien-verwaltung.git
cd immobilien-verwaltung

# 2. Setup ausführen
./setup.sh
```

**Das Setup-Skript fragt dich:**
- ✅ Soll die Datenbank erstellt werden? → **Ja (y)**
- ✅ .env Datei bearbeiten → **Drücke Enter** (Standardwerte sind bereits korrekt)

---

### ⚙️ Phase 3: Konfiguration prüfen

```bash
# .env Datei prüfen (optional)
cat .env
```

**Wichtige Werte (sollten bereits korrekt sein):**
```env
DATABASE_URL=mysql://immojaeger:PASSWORD@localhost:3306/dashboard
NAS_WEBDAV_URL=https://ugreen.tschatscher.eu:2002
NAS_USERNAME=tschatscher
NAS_PASSWORD=Survive1985#
```

---

### ✅ Phase 4: Testen

```bash
# 1. PM2 Status prüfen
pm2 list

# 2. Logs anschauen
pm2 logs immobilien-verwaltung --lines 50

# 3. Anwendung testen
curl http://localhost:3000

# 4. Im Browser öffnen
# http://DEINE-VM-IP:3000
```

---

## 🔧 Häufige Befehle

### Anwendung steuern
```bash
pm2 restart immobilien-verwaltung    # Neu starten
pm2 stop immobilien-verwaltung       # Stoppen
pm2 logs immobilien-verwaltung       # Logs anzeigen
pm2 monit                            # Monitoring
```

### Updates durchführen
```bash
cd ~/immobilien-verwaltung
./update.sh
```

### Datenbank-Backup
```bash
mysqldump -u immojaeger -p dashboard > backup_$(date +%Y%m%d).sql
```

---

## 🆘 Probleme?

### Port 3000 belegt
```bash
sudo lsof -i :3000
sudo kill -9 PID
pm2 restart immobilien-verwaltung
```

### PM2 startet nicht
```bash
pm2 kill
pm2 start ecosystem.config.js
pm2 save
```

### MySQL Fehler
```bash
sudo systemctl restart mysql
sudo mysql -e "SHOW DATABASES;"
```

---

## 📊 Was passiert beim Setup?

1. **Abhängigkeiten installieren** (Node.js, pnpm, MySQL, PM2)
2. **Dependencies installieren** (`pnpm install`)
3. **.env Datei erstellen** (von `.env.example`)
4. **Datenbank erstellen** (`dashboard` + User `immojaeger`)
5. **Schema migrieren** (`pnpm db:push` - 15 Tabellen)
6. **Anwendung bauen** (`pnpm build`)
7. **PM2 starten** (Autostart aktiviert)

---

## 🎯 Erwartetes Ergebnis

Nach erfolgreichem Setup:

- ✅ PM2 zeigt `immobilien-verwaltung` als `online`
- ✅ Port 3000 ist erreichbar
- ✅ Datenbank `dashboard` existiert mit 15 Tabellen
- ✅ Logs zeigen keine Fehler
- ✅ Anwendung läuft automatisch nach Neustart

---

## 📝 Nächste Schritte (optional)

### 1. Nginx Reverse Proxy
```bash
sudo apt-get install -y nginx
sudo cp nginx.conf.example /etc/nginx/sites-available/immobilien-verwaltung
sudo ln -s /etc/nginx/sites-available/immobilien-verwaltung /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2. SSL Zertifikat
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d immo-jaeger.eu -d www.immo-jaeger.eu
```

### 3. API-Keys konfigurieren
- In der Anwendung: **Settings → API-Konfiguration**
- Brevo API Key
- OpenAI API Key
- Google Maps API Key

---

## 🔐 Wichtige Credentials

### Datenbank
- **User:** `immojaeger`
- **Password:** Wird beim Setup gesetzt
- **Database:** `dashboard`

### NAS (bereits in .env)
- **WebDAV URL:** `https://ugreen.tschatscher.eu:2002`
- **Username:** `tschatscher`
- **Password:** `Survive1985#`

---

**✅ Fertig! Bei Fragen einfach melden.** 🚀
