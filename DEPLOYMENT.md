# 🚀 Deployment Guide - Immobilien-Verwaltung

**Letzte Aktualisierung:** 14. November 2025

---

## 📋 Voraussetzungen

### System
- **Ubuntu 22.04 LTS** oder neuer
- **Mindestens 2 GB RAM**
- **10 GB freier Speicherplatz**
- **Root oder sudo Zugriff**

### Software (wird automatisch installiert)
- **Node.js 20+**
- **pnpm** (Package Manager)
- **MySQL 8.0**
- **PM2** (Process Manager)
- **Git**

---

## 🎯 Schnellstart (Erstinstallation)

### 1. Repository klonen
```bash
cd ~
git clone https://github.com/Tschatscher85/immobilien-verwaltung.git
cd immobilien-verwaltung
```

### 2. Setup-Skript ausführen
```bash
./setup.sh
```

Das Skript führt automatisch aus:
- ✅ Installation aller Abhängigkeiten (Node.js, pnpm, MySQL, PM2)
- ✅ Erstellung der `.env` Datei
- ✅ Datenbank-Setup
- ✅ Build der Anwendung
- ✅ PM2 Konfiguration
- ✅ Start der Anwendung

### 3. Anwendung testen
```bash
curl http://localhost:3000
```

**Fertig!** 🎉 Die Anwendung läuft auf Port 3000.

---

## ⚙️ Manuelle Installation

Falls du das Setup-Skript nicht nutzen möchtest:

### 1. Abhängigkeiten installieren

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm

# MySQL
sudo apt-get update
sudo apt-get install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# PM2
npm install -g pm2
```

### 2. Projekt-Dependencies installieren
```bash
cd ~/immobilien-verwaltung
pnpm install
```

### 3. Environment konfigurieren
```bash
cp .env.example .env
nano .env
```

**Minimal-Konfiguration:**
```env
DATABASE_URL=mysql://immojaeger:YOUR_PASSWORD@localhost:3306/dashboard
JWT_SECRET=$(openssl rand -base64 32)
NAS_WEBDAV_URL=https://ugreen.tschatscher.eu:2002
NAS_USERNAME=tschatscher
NAS_PASSWORD=Survive1985#
PORT=3000
```

### 4. Datenbank erstellen
```bash
sudo mysql
```

```sql
CREATE DATABASE dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'immojaeger'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';
GRANT ALL PRIVILEGES ON dashboard.* TO 'immojaeger'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 5. Datenbank-Schema migrieren
```bash
pnpm db:push
```

### 6. Anwendung bauen
```bash
pnpm build
```

### 7. PM2 starten
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🔄 Updates durchführen

### Automatisch (empfohlen)
```bash
cd ~/immobilien-verwaltung
./update.sh
```

### Manuell
```bash
cd ~/immobilien-verwaltung
git pull origin main
pnpm install
pnpm db:push
pnpm build
pm2 restart immobilien-verwaltung
```

---

## 🌐 Nginx Reverse Proxy (optional)

### 1. Nginx installieren
```bash
sudo apt-get install -y nginx
```

### 2. Konfiguration erstellen
```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/immobilien-verwaltung
sudo ln -s /etc/nginx/sites-available/immobilien-verwaltung /etc/nginx/sites-enabled/
```

### 3. Domain anpassen
```bash
sudo nano /etc/nginx/sites-available/immobilien-verwaltung
```

Ändere `server_name` zu deiner Domain:
```nginx
server_name deine-domain.de www.deine-domain.de;
```

### 4. Nginx testen und neu laden
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 SSL Zertifikat (Let's Encrypt)

### 1. Certbot installieren
```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### 2. SSL Zertifikat erstellen
```bash
sudo certbot --nginx -d deine-domain.de -d www.deine-domain.de
```

### 3. Auto-Renewal testen
```bash
sudo certbot renew --dry-run
```

---

## 📊 PM2 Befehle

### Status anzeigen
```bash
pm2 list
pm2 status
```

### Logs anzeigen
```bash
pm2 logs immobilien-verwaltung
pm2 logs immobilien-verwaltung --lines 100
```

### Anwendung steuern
```bash
pm2 restart immobilien-verwaltung
pm2 stop immobilien-verwaltung
pm2 start immobilien-verwaltung
pm2 delete immobilien-verwaltung
```

### Monitoring
```bash
pm2 monit
```

### Startup-Skript
```bash
pm2 startup          # Zeigt Befehl für Autostart
pm2 save             # Speichert aktuelle Prozesse
```

---

## 🗄️ Datenbank-Verwaltung

### Backup erstellen
```bash
mysqldump -u immojaeger -p dashboard > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Backup wiederherstellen
```bash
mysql -u immojaeger -p dashboard < backup_20251114_120000.sql
```

### Datenbank zurücksetzen
```bash
sudo mysql -e "DROP DATABASE dashboard;"
sudo mysql -e "CREATE DATABASE dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
pnpm db:push
```

---

## 🔧 Troubleshooting

### Port 3000 bereits belegt
```bash
# Prozess finden
sudo lsof -i :3000

# Prozess beenden
sudo kill -9 PID
```

### PM2 startet nicht
```bash
# PM2 komplett zurücksetzen
pm2 kill
pm2 start ecosystem.config.js
pm2 save
```

### Datenbank-Verbindung fehlgeschlagen
```bash
# MySQL Status prüfen
sudo systemctl status mysql

# MySQL neu starten
sudo systemctl restart mysql

# Verbindung testen
mysql -u immojaeger -p -e "SELECT 1;"
```

### NAS-Verbindung fehlgeschlagen
```bash
# WebDAV-Verbindung testen
curl -k -u tschatscher:Survive1985# https://ugreen.tschatscher.eu:2002/

# FTP-Verbindung testen
ftp ftp.tschatscher.eu
```

### Build-Fehler
```bash
# Node modules neu installieren
rm -rf node_modules
rm -rf ~/.pnpm-store
pnpm install

# Cache leeren
pnpm store prune
```

---

## 📝 Environment Variables

### Erforderlich
| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `DATABASE_URL` | MySQL Verbindung | `mysql://user:pass@localhost:3306/dashboard` |
| `JWT_SECRET` | JWT Secret (min. 32 Zeichen) | `openssl rand -base64 32` |
| `NAS_WEBDAV_URL` | WebDAV URL | `https://ugreen.tschatscher.eu:2002` |
| `NAS_USERNAME` | NAS Admin User | `tschatscher` |
| `NAS_PASSWORD` | NAS Admin Passwort | `Survive1985#` |

### Optional (in Settings UI konfigurierbar)
| Variable | Beschreibung | Wo beantragen? |
|----------|--------------|----------------|
| `BREVO_API_KEY` | Brevo CRM Integration | https://app.brevo.com/settings/keys/api |
| `OPENAI_API_KEY` | AI-Beschreibungen | https://platform.openai.com/api-keys |
| `GOOGLE_MAPS_API_KEY` | Google Maps Integration | https://console.cloud.google.com/apis/credentials |

---

## 🔐 Sicherheit

### Firewall konfigurieren
```bash
# UFW installieren
sudo apt-get install -y ufw

# Ports freigeben
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Firewall aktivieren
sudo ufw enable
```

### MySQL absichern
```bash
sudo mysql_secure_installation
```

### Regelmäßige Updates
```bash
# System-Updates
sudo apt-get update
sudo apt-get upgrade -y

# Node.js Updates
npm update -g pnpm pm2

# Anwendungs-Updates
cd ~/immobilien-verwaltung
./update.sh
```

---

## 📊 Monitoring

### System-Ressourcen
```bash
# CPU & RAM
htop

# Festplatte
df -h

# Netzwerk
sudo netstat -tulpn
```

### Logs
```bash
# PM2 Logs
pm2 logs immobilien-verwaltung

# Nginx Logs
sudo tail -f /var/log/nginx/immobilien-verwaltung-access.log
sudo tail -f /var/log/nginx/immobilien-verwaltung-error.log

# MySQL Logs
sudo tail -f /var/log/mysql/error.log
```

---

## 🆘 Support

Bei Problemen:
1. **Logs prüfen:** `pm2 logs immobilien-verwaltung`
2. **GitHub Issues:** https://github.com/Tschatscher85/immobilien-verwaltung/issues
3. **E-Mail:** support@immo-jaeger.eu

---

**✅ Viel Erfolg mit deiner Installation!** 🚀
