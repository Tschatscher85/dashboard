# ⚡ Quick Deployment Reference

## 🎯 Nach VM Snapshot Rollback:

```bash
# 1. SSH verbinden
ssh tschatscher@109.90.44.221 -p 2222

# 2. Code holen
cd /home/tschatscher/dashboard
git pull origin main
pnpm install

# 3. Datenbank migrieren
mysql -u root -p dashboard < migration_fix_enums.sql

# 4. Build & Deploy
pnpm run build
pm2 restart dashboard

# 5. Status prüfen
pm2 status
pm2 logs dashboard --lines 20

# 6. Testen
# Browser: http://109.90.44.221:5000
# - Immobilie erstellen ✅
# - Kontakt erstellen ✅
```

## 🐛 Quick Troubleshooting

```bash
# Logs ansehen
pm2 logs dashboard

# DB prüfen
mysql -u root -p
USE dashboard;
SELECT * FROM properties ORDER BY id DESC LIMIT 5;
SELECT * FROM contacts ORDER BY id DESC LIMIT 5;

# PM2 neu starten
pm2 restart dashboard

# Kompletter Neustart
pm2 stop dashboard
pm2 delete dashboard
pm2 start dist/index.js --name dashboard
pm2 save
```

## ✅ Was wurde gefixt:

1. **Properties List Display** → `.useQuery({})` statt `.useQuery()`
2. **Contact ENUM Errors** → Migration SQL für contactType, salutation, type
3. **Backend Robustness** → `input || {}` Fallback

## 📝 Commit Info:

```
Commit: 2ca661f
Message: Fix: Properties list display + ENUM field mismatches
Branch: main
```

---

**Für Details siehe:** `DEPLOYMENT_GUIDE.md` und `FINAL_FIX_SUMMARY.md`
