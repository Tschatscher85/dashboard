# ⚡ Quick Start - Dashboard Deployment

## 🎯 Für den schnellen Einstieg

### 1️⃣ SSH Verbinden
```bash
ssh tschatscher@109.90.44.221 -p 2222
```

### 2️⃣ Ins Dashboard Verzeichnis
```bash
cd /home/tschatscher/dashboard
```

### 3️⃣ Deployment Script ausführen
```bash
./deploy.sh
```

**Das war's!** 🎉

---

## ❓ Falls deploy.sh nicht existiert

### Manuelles Deployment:

```bash
# 1. Code holen
git pull origin main

# 2. .env prüfen
cat .env | grep DATABASE_URL

# Falls leer:
nano .env
# DATABASE_URL=mysql://immojaeger:Survive1985%23@localhost:3306/dashboard
# CTRL+O, Enter, CTRL+X

# 3. Dependencies
pnpm install

# 4. Migration (NUR EINMAL!)
mysql -u root -p dashboard < migration_fix_all_enums.sql
# Passwort eingeben

# 5. Build
pnpm run build

# 6. Restart
pm2 restart dashboard --update-env
```

---

## ✅ Testen

**Browser:** https://dashboard.tschatscher.eu

1. Immobilie erstellen → Sollte in Liste erscheinen ✅
2. Kontakt erstellen → Sollte funktionieren ✅
3. Schnell laden → Keine 30 Sekunden mehr ✅

---

## 🐛 Fehler?

```bash
# Logs ansehen
pm2 logs dashboard --lines 30

# Status prüfen
pm2 status
```

**Siehe:** `DEPLOYMENT_COMPLETE.md` für Details
