# 🚀 Deployment Guide - Nach VM Snapshot Rollback

## 📋 Übersicht der Fixes

### ✅ Was wurde gefixt:

1. **Properties List Display Bug** 
   - Problem: Immobilien wurden nicht angezeigt
   - Ursache: `properties.list.useQuery()` ohne Parameter
   - Fix: `properties.list.useQuery({})` + Backend Fallback

2. **ENUM Field Mismatches**
   - Problem: DB hat English values, Frontend sendet German values
   - Ursache: Schema nicht synchronisiert
   - Fix: Migration SQL für alle ENUM Felder

3. **Contact Creation Fails**
   - Problem: "Data truncated for column 'contactType'"
   - Ursache: DB ENUM values nicht aktualisiert
   - Fix: Migration SQL

---

## 🎯 Deployment Schritte

### 1️⃣ VM Snapshot Rollback (von dir manuell)

```bash
# Snapshot zurückrollen in deiner VM Verwaltung
# Danach SSH verbinden:
ssh tschatscher@109.90.44.221 -p 2222
```

---

### 2️⃣ Code von GitHub holen

```bash
cd /home/tschatscher/dashboard

# Aktuellen Stand sichern (falls vorhanden)
git stash

# Neuesten Code holen
git pull origin main

# Dependencies installieren
pnpm install
```

---

### 3️⃣ Datenbank Migration ausführen

```bash
# Migration SQL herunterladen (falls nicht im Repo)
# Oder direkt aus dem Repo verwenden:

mysql -u root -p dashboard < migration_fix_enums.sql
```

**Passwort eingeben wenn gefragt!**

**Erwartete Ausgabe:**
```
✅ Migration completed successfully!
```

---

### 4️⃣ Projekt bauen

```bash
cd /home/tschatscher/dashboard

# Build ausführen
pnpm run build
```

**Erwartete Ausgabe:**
```
✓ built in XXXms
```

---

### 5️⃣ PM2 starten

```bash
# PM2 starten (falls noch nicht läuft)
pm2 start dist/index.js --name dashboard

# ODER neu starten (falls schon läuft)
pm2 restart dashboard

# Status prüfen
pm2 status

# Logs ansehen
pm2 logs dashboard --lines 50
```

**Erwartete Ausgabe:**
```
┌─────┬──────────┬─────────┬─────────┐
│ id  │ name     │ status  │ cpu     │
├─────┼──────────┼─────────┼─────────┤
│ 0   │ dashboard│ online  │ 0%      │
└─────┴──────────┴─────────┴─────────┘
```

---

### 6️⃣ Testen

1. **Browser öffnen:** `http://109.90.44.221:5000`

2. **Immobilie erstellen:**
   - Gehe zu "Immobilienmakler" → "Immobilien"
   - Klicke "Neue Immobilie"
   - Fülle Formular aus
   - Speichern
   - ✅ Immobilie sollte in Liste erscheinen!

3. **Kontakt erstellen:**
   - Gehe zu "Immobilienmakler" → "Kontakte"
   - Klicke "Neuer Kontakt"
   - Fülle Formular aus (Anrede: Herr/Frau, Typ: Kunde/Partner)
   - Speichern
   - ✅ Kontakt sollte erstellt werden!

---

## 🔍 Troubleshooting

### Problem: "Module not found"
```bash
cd /home/tschatscher/dashboard
rm -rf node_modules
pnpm install
pnpm run build
pm2 restart dashboard
```

### Problem: "Cannot connect to database"
```bash
# MySQL Status prüfen
sudo systemctl status mysql

# MySQL starten
sudo systemctl start mysql

# PM2 neu starten
pm2 restart dashboard
```

### Problem: "Port already in use"
```bash
# Prüfen was auf Port 5000 läuft
sudo lsof -i :5000

# Prozess beenden
pm2 stop dashboard
pm2 delete dashboard

# Neu starten
pm2 start dist/index.js --name dashboard
```

### Problem: Properties werden immer noch nicht angezeigt
```bash
# Browser Cache leeren!
# Oder Incognito Mode verwenden

# Logs prüfen:
pm2 logs dashboard --lines 100

# DB prüfen:
mysql -u root -p
USE dashboard;
SELECT * FROM properties ORDER BY id DESC LIMIT 5;
```

---

## 📝 Verifikation Checkliste

- [ ] VM Snapshot zurückgerollt
- [ ] Code von GitHub geholt (`git pull`)
- [ ] Dependencies installiert (`pnpm install`)
- [ ] Migration ausgeführt (`mysql < migration_fix_enums.sql`)
- [ ] Projekt gebaut (`pnpm run build`)
- [ ] PM2 gestartet (`pm2 start/restart dashboard`)
- [ ] Browser geöffnet (http://109.90.44.221:5000)
- [ ] Immobilie erstellt ✅
- [ ] Immobilie wird in Liste angezeigt ✅
- [ ] Kontakt erstellt ✅
- [ ] Kontakt wird in Liste angezeigt ✅

---

## 🎉 Erfolg!

Wenn alle Schritte erfolgreich waren, solltest du jetzt:

✅ Immobilien erstellen und sehen können
✅ Kontakte erstellen und sehen können
✅ Keine ENUM Fehler mehr haben
✅ Alle Features funktionieren

---

## 📞 Support

Falls Probleme auftreten:

1. **Logs prüfen:** `pm2 logs dashboard`
2. **DB prüfen:** `mysql -u root -p` → `USE dashboard;` → `SELECT * FROM contacts;`
3. **Browser Console:** F12 → Console Tab
4. **Screenshot machen** und mir zeigen!

---

## 🔄 Rollback (falls nötig)

Falls etwas schief geht:

```bash
# PM2 stoppen
pm2 stop dashboard
pm2 delete dashboard

# Alten Snapshot wieder laden
# (in deiner VM Verwaltung)

# Oder manuell zurücksetzen:
cd /home/tschatscher/dashboard
git reset --hard HEAD~1
pnpm run build
pm2 restart dashboard
```

---

**Viel Erfolg! 🚀**
