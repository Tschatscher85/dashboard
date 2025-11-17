# 🚀 Dashboard Deployment Guide - COMPLETE

## ✅ Was wurde gefixt

### 1. Properties List Display Bug ✅
**Problem:** Immobilien wurden nicht angezeigt  
**Ursache:** Frontend rief `.useQuery()` ohne Parameter auf  
**Lösung:** Bereits auf GitHub gefixt - alle Calls verwenden `.useQuery({})`

### 2. Contact Creation Fehler ✅
**Problem:** "Data truncated for column 'contactType'"  
**Ursache:** Database hatte English ENUMs, Frontend sendet German  
**Lösung:** Migration SQL `migration_fix_all_enums.sql` erstellt

### 3. Performance Probleme ✅
**Problem:** Extrem langsame Ladezeiten  
**Ursache:** Database Connection Issues, fehlende .env nach git pull  
**Lösung:** Automated Deployment Script mit .env Checks

---

## 📦 Neue Dateien auf GitHub

### 1. `migration_fix_all_enums.sql`
Komplette Database Migration für alle ENUM Felder:
- ✅ contacts: contactType, salutation, type
- ✅ properties: propertyType, marketingType, status, condition
- ✅ leads: status
- ✅ appointments: appointmentType, status

### 2. `.env.template`
Template für Environment Variables mit allen benötigten Feldern

### 3. `deploy.sh`
Automatisiertes Deployment Script mit:
- Pre-flight checks
- Backup creation
- Git pull
- Dependency installation
- Database migration (optional)
- Build
- PM2 restart
- Verification

### 4. `DEPLOYMENT_COMPLETE.md`
Diese Anleitung

---

## 🎯 Deployment Schritte

### Variante A: Automatisch (Empfohlen) 🤖

```bash
# 1. SSH verbinden
ssh tschatscher@109.90.44.221 -p 2222

# 2. Ins Dashboard Verzeichnis
cd /home/tschatscher/dashboard

# 3. .env prüfen (falls nicht vorhanden, aus Template erstellen)
ls -la .env

# Falls .env fehlt:
cp .env.template .env
nano .env
# DATABASE_URL eintragen: mysql://immojaeger:Survive1985%23@localhost:3306/dashboard

# 4. Deployment Script ausführen
./deploy.sh
```

**Das war's!** 🎉

Das Script macht automatisch:
- ✅ Git pull
- ✅ pnpm install
- ✅ Database Migration (fragt nach Bestätigung)
- ✅ pnpm run build
- ✅ pm2 restart dashboard --update-env

---

### Variante B: Manuell 🔧

```bash
# 1. SSH verbinden
ssh tschatscher@109.90.44.221 -p 2222

# 2. Ins Dashboard Verzeichnis
cd /home/tschatscher/dashboard

# 3. Git pull
git pull origin main

# 4. .env prüfen/erstellen
cat .env | grep DATABASE_URL
# Falls leer:
nano .env
# DATABASE_URL=mysql://immojaeger:Survive1985%23@localhost:3306/dashboard

# 5. Dependencies installieren
pnpm install

# 6. Database Migration (NUR EINMAL!)
mysql -u root -p dashboard < migration_fix_all_enums.sql

# 7. Build
pnpm run build

# 8. PM2 restart mit .env reload
pm2 restart dashboard --update-env

# 9. Status prüfen
pm2 status
pm2 logs dashboard --lines 20
```

---

## 🔍 Verification

### 1. PM2 Status prüfen
```bash
pm2 status
```

**Erwartete Ausgabe:**
```
┌────┬──────────┬─────────┬─────────┐
│ id │ name     │ status  │ cpu     │
├────┼──────────┼─────────┼─────────┤
│ 0  │ dashboard│ online  │ 0%      │
└────┴──────────┴─────────┴─────────┘
```

### 2. Logs prüfen
```bash
pm2 logs dashboard --lines 30
```

**Keine "Access denied" Fehler mehr!** ✅

### 3. Browser Test

**URL:** https://dashboard.tschatscher.eu

**Tests:**
1. ✅ **Immobilie erstellen**
   - "Neue Immobilie" klicken
   - Formular ausfüllen
   - "Erstellen" klicken
   - **Sollte in Liste erscheinen!**

2. ✅ **Kontakt erstellen**
   - "Neuer Kontakt" klicken
   - Formular ausfüllen
   - "Erstellen" klicken
   - **Sollte funktionieren ohne Fehler!**

3. ✅ **Performance**
   - Seiten sollten **schnell** laden
   - Keine 30 Sekunden Wartezeiten mehr

---

## 🐛 Troubleshooting

### Problem: "Access denied for user 'immojaeger'"

**Lösung:**
```bash
# .env prüfen
cat .env | grep DATABASE_URL

# Falls leer oder falsch:
nano .env
# DATABASE_URL=mysql://immojaeger:Survive1985%23@localhost:3306/dashboard

# PM2 mit .env reload
pm2 restart dashboard --update-env
```

### Problem: Properties Liste ist leer

**Lösung:**
```bash
# Prüfen ob Daten in DB sind
mysql -u root -p
USE dashboard;
SELECT COUNT(*) FROM properties;

# Falls 0, dann Testdaten erstellen über Frontend
# Falls > 0, dann Frontend Cache leeren:
# Browser: CTRL + SHIFT + R (Hard Reload)
```

### Problem: "Data truncated for column 'contactType'"

**Lösung:**
```bash
# Migration noch nicht gelaufen!
mysql -u root -p dashboard < migration_fix_all_enums.sql

# PM2 restart
pm2 restart dashboard
```

### Problem: Build Fehler

**Lösung:**
```bash
# Node modules neu installieren
rm -rf node_modules
pnpm install

# Erneut bauen
pnpm run build
```

### Problem: PM2 startet nicht

**Lösung:**
```bash
# PM2 komplett neu starten
pm2 stop dashboard
pm2 delete dashboard
pm2 start dist/index.js --name dashboard
pm2 save

# Logs prüfen
pm2 logs dashboard
```

---

## 📊 Database Migration Details

### Was macht die Migration?

**ENUM Felder werden von English → German konvertiert:**

#### Contacts
```sql
contactType: buyer → kunde, seller → partner, other → sonstiges
salutation: mr → herr, ms → frau, diverse → divers
type: company → firma
```

#### Properties
```sql
propertyType: apartment → wohnung, house → haus, etc.
marketingType: sale → kauf, rent → miete, lease → pacht
status: acquisition → akquise, marketing → vermarktung, etc.
condition: new → neubau, renovated → saniert, etc.
```

#### Leads
```sql
status: new → neu, contacted → kontaktiert, etc.
```

#### Appointments
```sql
appointmentType: viewing → besichtigung, meeting → termin, etc.
status: scheduled → geplant, completed → abgeschlossen, etc.
```

### Ist die Migration sicher?

✅ **JA!** Die Migration:
- Behält alte Werte während der Migration
- Migriert alle existierenden Daten
- Entfernt erst dann alte ENUM Werte
- Kann mehrfach ausgeführt werden (idempotent)

### Kann ich die Migration rückgängig machen?

**Ja, aber nicht empfohlen!** 

Besser: VM Snapshot VOR der Migration machen!

---

## 🔐 .env Template

```bash
# Database (WICHTIG!)
DATABASE_URL=mysql://immojaeger:Survive1985%23@localhost:3306/dashboard

# Server
HOST=0.0.0.0
NODE_ENV=production
PORT=3000

# JWT Secret
JWT_SECRET=X7k9mP2nQ8vI4wR6tY1uZ3bN5cM8sA0pS2dF4gH6jK0=

# Alle anderen Variablen siehe .env.template
```

---

## 📝 Nach dem Deployment

### 1. .env in .gitignore

**Prüfen:**
```bash
cat .gitignore | grep .env
```

**Falls nicht drin:**
```bash
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to .gitignore"
git push
```

### 2. PM2 Startup (Optional)

**Dashboard automatisch beim Server-Neustart starten:**
```bash
pm2 startup
# Befehl kopieren und ausführen (wird angezeigt)

pm2 save
```

### 3. Backup einrichten (Optional)

**Automatisches Backup Script:**
```bash
# Erstelle Backup Script
nano /home/tschatscher/backup-dashboard.sh
```

```bash
#!/bin/bash
mysqldump -u root -p dashboard > /home/tschatscher/backups/dashboard-$(date +%Y%m%d).sql
```

```bash
chmod +x /home/tschatscher/backup-dashboard.sh

# Cronjob für tägliches Backup (2 Uhr nachts)
crontab -e
# 0 2 * * * /home/tschatscher/backup-dashboard.sh
```

---

## 🎉 Erfolg!

Nach dem Deployment sollte:

✅ **Properties List** funktionieren  
✅ **Contact Creation** funktionieren  
✅ **Schnelle Performance** (< 2 Sekunden Ladezeit)  
✅ **Keine ENUM Fehler** mehr  
✅ **Alle CRUD Operationen** funktionieren  

---

## 📞 Support

Bei Problemen:

1. **Logs prüfen:** `pm2 logs dashboard --lines 50`
2. **Status prüfen:** `pm2 status`
3. **Database prüfen:** `mysql -u root -p` → `USE dashboard;` → `SHOW TABLES;`
4. **Browser Console prüfen:** F12 → Console Tab

---

**Viel Erfolg beim Deployment! 🚀**
