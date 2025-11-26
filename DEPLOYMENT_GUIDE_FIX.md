# Deployment-Anleitung: Property Update Persistence Fix

## Übersicht

Dieser Fix behebt das Problem, dass Property-Updates nicht persistent in der Datenbank gespeichert wurden.

**Status:** ✅ Getestet und zu GitHub gepusht  
**Repository:** https://github.com/Tschatscher85/dashboard  
**Commit:** a33b01b - "FIX: Property update persistence issue - Field mapping implementation"

---

## Was wurde behoben?

### Problem
- User füllt Felder aus (Kaufpreis, Kaltmiete, etc.)
- Klickt "Speichern"
- Keine Fehlermeldung
- Nach Reload (F5) sind Daten WEG

### Root Cause
**Field Name Mismatch** zwischen tRPC Router und Drizzle Schema:
- Router sendet `price`, Datenbank erwartet `purchasePrice`
- Router sendet `coldRent`, Datenbank erwartet `baseRent`
- Drizzle ORM ignoriert unbekannte Felder stillschweigend

### Lösung
1. **Field Mapping Funktion** - übersetzt Router-Feldnamen zu Schema-Feldnamen
2. **Schema erweitert** - 40+ fehlende Felder hinzugefügt
3. **Enhanced Logging** - besseres Debugging
4. **Datenbank-Migration** - SQL-Script für neue Spalten

---

## Deployment auf dem Server (dashboard.tschatscher.eu)

### Voraussetzungen

1. SSH-Zugang zum Server (192.168.0.185)
2. Zugriff auf MySQL-Datenbank
3. PM2 läuft bereits

### Schritt-für-Schritt Anleitung

#### 1. Auf den Server verbinden

```bash
ssh user@192.168.0.185
cd /pfad/zum/dashboard
```

#### 2. Neueste Änderungen pullen

```bash
git pull origin main
```

**Erwartete Ausgabe:**
```
remote: Enumerating objects...
Updating 74fc45c..a33b01b
Fast-forward
 FIELD_MISMATCH_ANALYSIS.md                      |  ... 
 FIX_DOCUMENTATION.md                            |  ...
 deploy_field_fix.sh                             |  ...
 drizzle/schema.ts                               |  ...
 migrations/add_missing_property_fields.sql      |  ...
 server/fieldMapping.ts                          |  ...
 server/routers.ts                               |  ...
 7 files changed, 875 insertions(+), 1 deletion(-)
```

#### 3. Dependencies installieren

```bash
npm install --legacy-peer-deps
```

#### 4. Datenbank-Migration ausführen

**WICHTIG:** Backup erstellen BEVOR du die Migration ausführst!

```bash
# Backup erstellen
mysqldump -h 192.168.0.185 -u root -p immobilien > backup_before_fix_$(date +%Y%m%d_%H%M%S).sql

# Migration ausführen
mysql -h 192.168.0.185 -u root -p immobilien < migrations/add_missing_property_fields.sql
```

**Bei Erfolg:** Keine Fehlermeldung

**Prüfen ob Spalten hinzugefügt wurden:**
```bash
mysql -h 192.168.0.185 -u root -p immobilien -e "DESCRIBE properties;" | grep -E "category|hideStreetOnPortals|isBarrierFree"
```

**Erwartete Ausgabe:**
```
category                | varchar(100)    | YES  |     | NULL    |       |
hideStreetOnPortals     | tinyint(1)      | YES  |     | 0       |       |
isBarrierFree           | tinyint(1)      | YES  |     | 0       |       |
```

#### 5. Build erstellen

```bash
npm run build
```

**Bei Erfolg:**
```
> immobilien-verwaltung@1.0.0 build
> vite build && esbuild server/_core/index.ts ...
  dist/index.js  316.6kb
⚡ Done in 30ms
```

#### 6. Anwendung neu starten

```bash
pm2 restart dashboard
```

**Oder falls nicht mit PM2:**
```bash
# Prozess finden und beenden
ps aux | grep node
kill <PID>

# Neu starten
npm start &
```

#### 7. Logs prüfen

```bash
pm2 logs dashboard --lines 50
```

**Suche nach:**
```
[tRPC] Before field mapping: [...]
[tRPC] After field mapping: [...]
[Database] updateProperty called with: {...}
```

---

## Automatisches Deployment (Alternative)

Falls du das automatische Script verwenden möchtest:

```bash
./deploy_field_fix.sh
```

**Das Script führt automatisch aus:**
1. Datenbank-Migration
2. npm install
3. npm run build
4. pm2 restart

---

## Testing nach Deployment

### 1. Property Update Test

1. Öffne https://dashboard.tschatscher.eu
2. Gehe zu einem Property
3. Fülle folgende Felder aus:
   - **Kaufpreis:** 135.000 €
   - **Kaltmiete:** 500 €
   - **Warmmiete:** 650 €
   - **Stellplätze:** 2
4. Klicke "Speichern"
5. Drücke **F5** (Reload)
6. **✅ Erwartetes Ergebnis:** Alle Daten bleiben erhalten!

### 2. Browser Console prüfen

1. Öffne DevTools (F12)
2. Network Tab
3. Suche nach `properties.update`
4. Prüfe Request Payload

**Vorher (Router-Feldnamen):**
```json
{
  "price": 135000,
  "coldRent": 500,
  "warmRent": 650
}
```

**Server verarbeitet jetzt korrekt zu:**
```json
{
  "purchasePrice": 135000,
  "baseRent": 500,
  "totalRent": 650
}
```

### 3. Datenbank direkt prüfen

```bash
mysql -h 192.168.0.185 -u root -p immobilien -e "
SELECT id, title, purchasePrice, baseRent, totalRent, parkingSpaces 
FROM properties 
WHERE id = 1;
"
```

**Erwartete Ausgabe:**
```
+----+------------------+---------------+----------+-----------+---------------+
| id | title            | purchasePrice | baseRent | totalRent | parkingSpaces |
+----+------------------+---------------+----------+-----------+---------------+
|  1 | Test Property    | 135000.00     | 500.00   | 650.00    | 2             |
+----+------------------+---------------+----------+-----------+---------------+
```

---

## Troubleshooting

### Problem: Migration schlägt fehl

**Fehlermeldung:** `ERROR 1060 (42S21): Duplicate column name 'category'`

**Lösung:** Spalte existiert bereits, das ist OK. Die Migration verwendet `IF NOT EXISTS`.

---

### Problem: Build schlägt fehl

**Lösung:**
```bash
# Cache löschen
rm -rf node_modules
rm -rf dist
rm -rf client/dist

# Neu installieren
npm install --legacy-peer-deps

# Neu bauen
npm run build
```

---

### Problem: Daten werden immer noch nicht gespeichert

**Debug-Schritte:**

1. **Server-Logs prüfen:**
```bash
pm2 logs dashboard --lines 100 | grep -E "tRPC|Database|Field Mapping"
```

2. **Prüfe ob Field Mapping aktiv ist:**
```bash
grep -n "mapRouterFieldsToSchema" dist/index.js
```

Sollte Zeilen finden!

3. **Prüfe ob neue Spalten existieren:**
```bash
mysql -h 192.168.0.185 -u root -p immobilien -e "SHOW COLUMNS FROM properties LIKE '%available%';"
```

4. **Prüfe Browser Console:**
- Öffne DevTools (F12)
- Console Tab
- Suche nach Fehlermeldungen

---

## Rollback (falls nötig)

### Option 1: Git Rollback

```bash
git revert a33b01b
npm run build
pm2 restart dashboard
```

### Option 2: Datenbank Rollback

```bash
# Backup wiederherstellen
mysql -h 192.168.0.185 -u root -p immobilien < backup_before_fix_YYYYMMDD_HHMMSS.sql
```

### Option 3: VM Snapshot

Falls du VM Snapshots hast, kannst du auf den letzten funktionierenden Zustand zurückgehen.

---

## Neue Felder die jetzt verfügbar sind

Nach dem Deployment sind folgende neue Felder verfügbar:

### Portal-Einstellungen
- `hideStreetOnPortals` - Straße auf Portalen verbergen

### Kategorisierung
- `category` - Kategorie

### Etagen-Details
- `floorLevel` - Etage (Text)
- `totalFloors` - Gesamtanzahl Etagen

### Finanzielle Felder
- `nonRecoverableCosts` - Nicht umlagefähige Kosten
- `houseMoney` - Hausgeld
- `maintenanceReserve` - Instandhaltungsrücklage

### Ausstattung
- `isBarrierFree` - Barrierefrei
- `hasLoggia` - Loggia
- `isMonument` - Denkmalgeschützt
- `suitableAsHoliday` - Als Ferienwohnung geeignet
- `hasFireplace` - Kamin
- `hasPool` - Pool
- `hasSauna` - Sauna
- `hasAlarm` - Alarmanlage
- `hasWinterGarden` - Wintergarten
- `hasAirConditioning` - Klimaanlage
- `hasParking` - Parkplatz
- `bathroomFeatures` - Badausstattung

### Gebäude-Details
- `heatingSystemYear` - Baujahr Heizung
- `buildingPhase` - Bauphase
- `equipmentQuality` - Ausstattungsqualität

### Verfügbarkeit
- `availableFrom` - Verfügbar ab

### Eigentümer
- `ownerType` - Eigentümertyp

### Verkehrsanbindung
- `walkingTimeToPublicTransport` - Gehzeit ÖPNV (Min)
- `distanceToPublicTransport` - Entfernung ÖPNV (km)
- `drivingTimeToHighway` - Fahrzeit Autobahn (Min)
- `distanceToHighway` - Entfernung Autobahn (km)
- `drivingTimeToMainStation` - Fahrzeit Hauptbahnhof (Min)
- `distanceToMainStation` - Entfernung Hauptbahnhof (km)
- `drivingTimeToAirport` - Fahrzeit Flughafen (Min)
- `distanceToAirport` - Entfernung Flughafen (km)

### Landing Page
- `landingPageSlug` - URL Slug
- `landingPagePublished` - Veröffentlicht

---

## Support

Bei Problemen:

1. **Logs prüfen:** `pm2 logs dashboard`
2. **Datenbank prüfen:** `mysql -h 192.168.0.185 -u root -p`
3. **Browser Console prüfen:** F12
4. **Dokumentation lesen:** `FIX_DOCUMENTATION.md`
5. **GitHub Issue erstellen:** https://github.com/Tschatscher85/dashboard/issues

---

## Zusammenfassung

✅ **Root Cause identifiziert:** Field Name Mismatch  
✅ **Fix implementiert:** Field Mapping + Schema Extension  
✅ **Getestet:** Alle Tests erfolgreich  
✅ **Dokumentiert:** Vollständige Anleitung  
✅ **Zu GitHub gepusht:** Commit a33b01b  

**Alle Property-Updates werden jetzt persistent gespeichert!** 🎉
