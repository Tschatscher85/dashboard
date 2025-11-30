# 🔄 Database Reset Guide

## Wann diese Anleitung verwenden?

- ❌ Daten werden nicht gespeichert (nach F5 weg)
- ❌ Website lädt ewig / hängt sich auf
- ❌ Fehler: "Column doesn't exist" oder "Table doesn't exist"
- ❌ Nach Schema-Änderungen (neue Felder hinzugefügt)
- ❌ Drizzle Migration schlägt fehl

## ⚠️ WARNUNG

**ALLE DATEN GEHEN VERLOREN!** Backup erstellen falls nötig!

---

## 🚀 Schritt-für-Schritt Anleitung

### 1. Datenbank komplett löschen und neu erstellen

```bash
mysql -u dashboard -p'Survive1985#' -e "DROP DATABASE dashboard; CREATE DATABASE dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

**Ergebnis:** Leere Datenbank `dashboard` ist erstellt

---

### 2. Schema in Datenbank übertragen

```bash
cd ~/dashboard
npm run db:push
```

**Was passiert:**
- Drizzle liest `drizzle/schema.ts`
- Erstellt alle Tabellen (25 Stück)
- Erstellt alle Spalten (z.B. 145 in `properties`)

**Erwartete Ausgabe:**
```
25 tables
properties 145 columns 0 indexes 0 fks
...
No schema changes, nothing to migrate 😴
```

**Wenn Drizzle Fragen stellt:** Einfach **Enter** drücken (wählt "create table")

---

### 3. Server neu starten

```bash
pm2 restart dashboard
```

**Prüfen ob Server läuft:**
```bash
pm2 status
```

**Sollte zeigen:** `status: online` ✅

---

### 4. Logs checken

```bash
pm2 logs dashboard --lines 20
```

**Sollte zeigen:**
```
Server running on http://localhost:3000/
```

**KEINE Errors wie:**
- ❌ `TypeError: (void 0) is not a function`
- ❌ `Column 'purchasePrice' doesn't exist`

---

### 5. Website testen

1. Öffne: `http://192.168.0.185:3000`
2. Erstelle neue Immobilie
3. Fülle Felder aus (z.B. Kaufpreis: 500000)
4. Klicke "Speichern"
5. Drücke **F5** (Seite neu laden)
6. **Daten sollten noch da sein!** ✅

---

## 🔍 Troubleshooting

### Problem: "Access denied for user 'dashboard'"

**Lösung:** MySQL User existiert nicht oder Passwort falsch

```bash
mysql -u root -p
```

Dann:
```sql
CREATE USER 'dashboard'@'localhost' IDENTIFIED BY 'Survive1985#';
GRANT ALL PRIVILEGES ON dashboard.* TO 'dashboard'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

### Problem: "npm run db:push" schlägt fehl

**Fehler:** `Table 'users' already exists`

**Lösung:** Datenbank wurde nicht richtig gelöscht!

```bash
mysql -u dashboard -p'Survive1985#' -e "DROP DATABASE IF EXISTS dashboard; CREATE DATABASE dashboard CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Dann nochmal `npm run db:push`

---

### Problem: Server startet nicht

**Fehler:** `TypeError: (void 0) is not a function`

**Lösung:** Build ist veraltet!

```bash
cd ~/dashboard
git pull origin main
npm run build
pm2 restart dashboard
```

---

### Problem: Daten werden immer noch nicht gespeichert

**Checke ob Daten in DB ankommen:**

```bash
mysql -u dashboard -p'Survive1985#' dashboard -e "SELECT id, title, purchasePrice, createdAt FROM properties ORDER BY createdAt DESC LIMIT 5;"
```

**Wenn `purchasePrice` NULL ist:**
- Problem ist im Frontend oder Router
- NICHT in der Datenbank!

**Checke Router:**
```bash
cd ~/dashboard
grep -n "purchasePrice" server/routers.ts | head -5
```

Sollte zeigen dass `purchasePrice` im CREATE und UPDATE Router ist!

---

## 📊 Datenbank-Status prüfen

### Alle Tabellen anzeigen

```bash
mysql -u dashboard -p'Survive1985#' dashboard -e "SHOW TABLES;"
```

**Sollte 25 Tabellen zeigen!**

---

### Properties Tabelle prüfen

```bash
mysql -u dashboard -p'Survive1985#' dashboard -e "DESCRIBE properties;" | head -50
```

**Sollte 145 Spalten zeigen, inkl.:**
- `purchasePrice`
- `baseRent`
- `totalRent`
- `balconyTerraceArea`
- etc.

---

### Anzahl Immobilien prüfen

```bash
mysql -u dashboard -p'Survive1985#' dashboard -e "SELECT COUNT(*) as total FROM properties;"
```

---

## 🎯 Zusammenfassung

**Bei Problemen mit der Datenbank:**

1. ✅ Datenbank löschen: `DROP DATABASE dashboard; CREATE DATABASE dashboard;`
2. ✅ Schema übertragen: `npm run db:push`
3. ✅ Server neu starten: `pm2 restart dashboard`
4. ✅ Testen: Website öffnen und Daten speichern

**Das war's!** 🚀

---

## 📝 Notizen

- **Backup:** Vor Reset Backup erstellen: `mysqldump -u dashboard -p'Survive1985#' dashboard > backup.sql`
- **Restore:** Backup wiederherstellen: `mysql -u dashboard -p'Survive1985#' dashboard < backup.sql`
- **Produktiv:** Auf Produktiv-Servern NIEMALS ohne Backup resetten!

---

**Erstellt:** 2025-11-30  
**Getestet:** ✅ Funktioniert!
