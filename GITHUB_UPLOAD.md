# GitHub Upload Anleitung

## Voraussetzungen
- GitHub Account
- Git installiert auf Ihrem Computer

## Schritt 1: Code herunterladen
1. Öffnen Sie das **Management-UI** (rechts oben)
2. Klicken Sie auf **"Code"** Tab
3. Klicken Sie auf **"Download All Files"**
4. Entpacken Sie die ZIP-Datei auf Ihrem Computer

## Schritt 2: GitHub Repository erstellen
1. Gehen Sie zu [github.com](https://github.com)
2. Klicken Sie auf **"New Repository"** (grüner Button)
3. Repository-Name: `immobilien-verwaltung`
4. Wählen Sie **Private** (empfohlen, da Geschäftsdaten)
5. **NICHT** "Initialize with README" ankreuzen
6. Klicken Sie auf **"Create Repository"**

## Schritt 3: Code hochladen

### Option A: Via Terminal/Command Line
```bash
# In den Projekt-Ordner wechseln
cd pfad/zum/immobilien-verwaltung

# Remote hinzufügen (ersetzen Sie USERNAME mit Ihrem GitHub-Namen)
git remote add origin https://github.com/USERNAME/immobilien-verwaltung.git

# Branch umbenennen (falls nötig)
git branch -M main

# Code hochladen
git push -u origin main
```

### Option B: Via GitHub Desktop
1. Öffnen Sie [GitHub Desktop](https://desktop.github.com/)
2. Klicken Sie auf **"Add Existing Repository"**
3. Wählen Sie den entpackten Ordner
4. Klicken Sie auf **"Publish Repository"**
5. Wählen Sie **Private** und klicken Sie auf **"Publish"**

## Schritt 4: Verifizieren
1. Gehen Sie zu `https://github.com/USERNAME/immobilien-verwaltung`
2. Sie sollten alle Dateien sehen
3. Überprüfen Sie, dass `.env` Dateien **NICHT** hochgeladen wurden

## Wichtige Hinweise

### ⚠️ Sicherheit
- **NIEMALS** `.env` Dateien hochladen (bereits in `.gitignore`)
- **NIEMALS** Passwörter oder API-Keys committen
- Repository auf **Private** setzen

### 📝 Weitere Commits
Wenn Sie später Änderungen machen:
```bash
git add .
git commit -m "Beschreibung der Änderungen"
git push
```

### 🔄 Code vom Server aktualisieren
Wenn Sie auf dem Manus-Server weiterarbeiten und dann synchronisieren wollen:
```bash
# Auf Ihrem lokalen Computer
git pull origin main
```

## Troubleshooting

### Fehler: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/USERNAME/immobilien-verwaltung.git
```

### Fehler: "Authentication failed"
1. Erstellen Sie einen [Personal Access Token](https://github.com/settings/tokens)
2. Verwenden Sie den Token statt Ihres Passworts

### Fehler: "Permission denied"
Stellen Sie sicher, dass Sie der Owner des Repositories sind.

## Nächste Schritte
- ✅ Code ist auf GitHub gesichert
- ✅ Sie können von überall darauf zugreifen
- ✅ Versionskontrolle ist aktiviert
- ✅ Sie können mit anderen zusammenarbeiten (falls gewünscht)

## Support
Bei Fragen wenden Sie sich an Ihren Entwickler oder GitHub Support.
