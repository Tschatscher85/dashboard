# EMERGENCY FIX - 500 Error auf Properties Page

## Problem

**Symptom:** Seite lädt nicht, 500 Internal Server Error beim Öffnen von "Objekte"

**Root Cause:** Die Datenbank-Migration wurde noch nicht ausgeführt!

Die neuen Felder existieren im Code, aber NICHT in der Datenbank. Wenn die Anwendung versucht, die Properties zu laden, schlägt die SQL-Query fehl, weil die Spalten fehlen.

---

## Sofort-Lösung

### Option 1: Automatisches Script (EMPFOHLEN)

```bash
cd /pfad/zum/dashboard
./EMERGENCY_FIX.sh
```

Das Script führt automatisch aus:
1. Backup der Datenbank
2. Migration ausführen
3. Anwendung neu starten

### Option 2: Manuelle Schritte

```bash
# 1. Backup erstellen
mysqldump -h 192.168.0.185 -u root -p immobilien > backup_emergency_$(date +%Y%m%d).sql

# 2. Migration ausführen
mysql -h 192.168.0.185 -u root -p immobilien < migrations/add_missing_property_fields.sql

# 3. Anwendung neu starten
pm2 restart dashboard
```

---

## Was die Migration macht

Die Migration fügt **40+ fehlende Spalten** zur `properties` Tabelle hinzu:

### Portal-Einstellungen
- `hideStreetOnPortals` BOOLEAN

### Kategorisierung
- `category` VARCHAR(100)

### Etagen-Details
- `floorLevel` VARCHAR(50)
- `totalFloors` INT

### Finanzielle Felder
- `nonRecoverableCosts` DECIMAL(10,2)
- `houseMoney` DECIMAL(10,2)
- `maintenanceReserve` DECIMAL(10,2)

### Ausstattung
- `isBarrierFree` BOOLEAN
- `hasLoggia` BOOLEAN
- `isMonument` BOOLEAN
- `suitableAsHoliday` BOOLEAN
- `hasFireplace` BOOLEAN
- `hasPool` BOOLEAN
- `hasSauna` BOOLEAN
- `hasAlarm` BOOLEAN
- `hasWinterGarden` BOOLEAN
- `hasAirConditioning` BOOLEAN
- `hasParking` BOOLEAN
- `bathroomFeatures` TEXT

### Gebäude-Details
- `heatingSystemYear` INT
- `buildingPhase` VARCHAR(100)
- `equipmentQuality` VARCHAR(100)

### Verfügbarkeit
- `availableFrom` DATE

### Eigentümer
- `ownerType` VARCHAR(100)

### Verkehrsanbindung
- `walkingTimeToPublicTransport` INT
- `distanceToPublicTransport` DECIMAL(10,2)
- `drivingTimeToHighway` INT
- `distanceToHighway` DECIMAL(10,2)
- `drivingTimeToMainStation` INT
- `distanceToMainStation` DECIMAL(10,2)
- `drivingTimeToAirport` INT
- `distanceToAirport` DECIMAL(10,2)

### Landing Page
- `landingPageSlug` VARCHAR(255)
- `landingPagePublished` BOOLEAN

---

## Nach der Migration

### 1. Testen

```bash
# Öffne im Browser
http://dashboard.tschatscher.eu

# Gehe zu "Objekte"
# Die Seite sollte jetzt laden!
```

### 2. Logs prüfen

```bash
pm2 logs dashboard
```

Suche nach:
- ✅ Keine SQL-Fehler mehr
- ✅ Properties werden geladen
- ✅ Keine 500 Errors

### 3. Datenbank prüfen

```bash
mysql -h 192.168.0.185 -u root -p immobilien -e "DESCRIBE properties;" | grep -E "category|hideStreetOnPortals|isBarrierFree"
```

Sollte die neuen Spalten zeigen!

---

## Warum ist das passiert?

**Deployment-Reihenfolge war falsch:**

1. ✅ Code gepullt (mit neuen Feldern)
2. ✅ Build ausgeführt
3. ✅ Anwendung neu gestartet
4. ❌ **Migration NICHT ausgeführt** ← Das Problem!

**Richtige Reihenfolge:**

1. Code pullen
2. Dependencies installieren
3. **Migration ausführen** ← WICHTIG!
4. Build
5. Restart

---

## Rollback (falls nötig)

Falls die Migration Probleme verursacht:

```bash
# Backup wiederherstellen
mysql -h 192.168.0.185 -u root -p immobilien < backup_emergency_YYYYMMDD_HHMMSS.sql

# Alte Version auschecken
git checkout 74fc45c  # Commit VOR den Änderungen

# Build und Restart
npm run build
pm2 restart dashboard
```

---

## Prävention für die Zukunft

### Deployment-Checklist

Erstelle eine Datei `DEPLOYMENT_CHECKLIST.md`:

```markdown
# Deployment Checklist

- [ ] 1. Backup erstellen
- [ ] 2. Git pull
- [ ] 3. npm install --legacy-peer-deps
- [ ] 4. Migrations prüfen (ls migrations/)
- [ ] 5. Migrations ausführen (mysql < migrations/...)
- [ ] 6. npm run build
- [ ] 7. pm2 restart dashboard
- [ ] 8. Logs prüfen (pm2 logs)
- [ ] 9. Anwendung testen
```

### Automatisches Deployment-Script

Verwende `deploy_field_fix.sh` für zukünftige Deployments:

```bash
./deploy_field_fix.sh
```

Das Script führt ALLE Schritte in der richtigen Reihenfolge aus!

---

## Support

Bei weiteren Problemen:

1. **Logs prüfen:**
   ```bash
   pm2 logs dashboard --lines 100
   ```

2. **Datenbank prüfen:**
   ```bash
   mysql -h 192.168.0.185 -u root -p immobilien
   SHOW COLUMNS FROM properties;
   ```

3. **Browser Console prüfen:**
   - F12 → Console Tab
   - Suche nach Fehlermeldungen

4. **GitHub Issue erstellen:**
   https://github.com/Tschatscher85/dashboard/issues

---

## Zusammenfassung

**Problem:** Migration nicht ausgeführt → Spalten fehlen → SQL-Query schlägt fehl → 500 Error

**Lösung:** Migration ausführen → Spalten hinzugefügt → SQL-Query funktioniert → Seite lädt!

**Prävention:** Deployment-Script verwenden → Alle Schritte automatisch → Keine Fehler mehr!

---

**Führe jetzt EMERGENCY_FIX.sh aus und die Seite sollte wieder funktionieren!** ✅
