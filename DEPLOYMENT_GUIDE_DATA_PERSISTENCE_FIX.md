# 🚀 DEPLOYMENT GUIDE - Data Persistence Fix

## ✅ Was wurde gefixt?

**Problem:** Property-Daten (z.B. Kaufpreis, Miete) wurden nach dem Speichern nicht persistent in der Datenbank gespeichert. Nach F5 waren die Daten weg.

**Lösung:** 16 fehlende Felder wurden zum properties UPDATE Router hinzugefügt:

1. `autoSendToPortals` (boolean)
2. `buyerCommission` (string)
3. `courtCity` (string)
4. `courtName` (string)
5. `descriptionObject` (string)
6. `developmentStatus` (enum)
7. `floors` (number)
8. `furnishingQuality` (enum)
9. `hasGarage` (boolean)
10. `internalNotes` (string)
11. `isArchived` (boolean)
12. `landRegisterNumber` (string)
13. `parcelNumber` (string)
14. `plotNumber` (string)
15. `siteArea` (number)
16. `warningNote` (string)

## 📋 Deployment Schritte

### 1. Auf dem Server einloggen

```bash
ssh user@192.168.0.185
cd /path/to/dashboard
```

### 2. Änderungen von GitHub holen

```bash
git pull origin main
```

**Erwartete Ausgabe:**
```
remote: Enumerating objects: 7, done.
remote: Counting objects: 100% (7/7), done.
remote: Compressing objects: 100% (1/1), done.
remote: Total 4 (delta 3), reused 4 (delta 3), pack-reused 0
Unpacking objects: 100% (4/4), done.
From https://github.com/Tschatscher85/dashboard
   4c6d4b2..3ec0fd6  main       -> origin/main
Updating 4c6d4b2..3ec0fd6
Fast-forward
 server/routers.ts | 16 ++++++++++++++++
 1 file changed, 16 insertions(+)
```

### 3. Projekt neu bauen

```bash
npm run build
```

**Erwartete Ausgabe:**
```
> immobilien-verwaltung@1.0.0 build
> vite build && esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

✓ built in X.XXs
⚡ Done in XXms
```

### 4. Server neu starten

```bash
pm2 restart dashboard
```

**Erwartete Ausgabe:**
```
[PM2] Applying action restartProcessId on app [dashboard](ids: [ 0 ])
[PM2] [dashboard](0) ✓
```

### 5. Status überprüfen

```bash
pm2 status
```

**Erwartete Ausgabe:**
```
┌─────┬──────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name         │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼──────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ dashboard    │ default     │ 1.0.0   │ fork    │ XXXXX    │ Xs     │ X    │ online    │ 0%       │ XX.X mb  │ user     │ disabled │
└─────┴──────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

**Status muss "online" sein!**

### 6. Logs überprüfen (optional)

```bash
pm2 logs dashboard --lines 50
```

## ✅ Testen

1. Öffne die Dashboard-Anwendung: `https://dashboard.tschatscher.eu`
2. Gehe zu einer Immobilie
3. Bearbeite ein Feld (z.B. Kaufpreis)
4. Klicke auf "Speichern"
5. Drücke F5 (Seite neu laden)
6. **Das Feld sollte jetzt den gespeicherten Wert behalten!**

## 🔍 Troubleshooting

### Problem: Build schlägt fehl

**Lösung:**
```bash
# Node modules neu installieren
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problem: Server startet nicht

**Lösung:**
```bash
# PM2 Logs anschauen
pm2 logs dashboard --lines 100

# Server komplett neu starten
pm2 delete dashboard
pm2 start dist/index.js --name dashboard
```

### Problem: Daten werden immer noch nicht gespeichert

**Lösung:**
```bash
# Browser-Cache leeren (Strg + Shift + R)
# Oder im Browser: Developer Tools → Application → Clear Storage → Clear site data

# Überprüfe, ob die richtigen Felder gesendet werden:
# Browser → Developer Tools → Network → Filter: "update" → Payload anschauen
```

## 📊 Technische Details

### Geänderte Dateien:
- `server/routers.ts` (Zeilen 783-798): 16 neue Felder im UPDATE Router

### Commit:
- Hash: `3ec0fd6`
- Message: "Fix: Add 16 missing fields to properties UPDATE router"

### Router → Schema Mapping:
Alle 16 Felder existieren bereits in der Datenbank (`drizzle/schema.ts`). Sie wurden nur im tRPC Router ergänzt.

## 🎯 Erwartetes Ergebnis

Nach dem Deployment:
- ✅ Alle Property-Felder werden persistent gespeichert
- ✅ Keine Datenverluste nach F5
- ✅ Server läuft stabil
- ✅ Keine Build-Fehler
- ✅ Keine Runtime-Errors

## 📞 Support

Bei Problemen:
1. Logs überprüfen: `pm2 logs dashboard`
2. Browser Developer Console überprüfen (F12)
3. Network-Tab überprüfen (F12 → Network)

---

**Deployment durchgeführt am:** [Datum eintragen]  
**Durchgeführt von:** [Name eintragen]  
**Status:** [✅ Erfolgreich / ❌ Fehlgeschlagen]
