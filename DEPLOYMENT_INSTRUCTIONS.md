# 🚀 Deployment Anleitung - Contact Documents Feature

## ✅ Was wurde implementiert?

### **Neue Features:**
1. **Dokumente-Management für Kontakte** mit WebDAV-Integration
2. **Modulspezifische Ordnerstrukturen:**
   - **Immobilienmakler:** `/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Kontakte/[Vorname Nachname]/`
   - **Versicherungen:** `/Daten/Allianz/Agentur Jaeger/Versicherungen/[Vorname Nachname]/`
   - **Hausverwaltung:** `/Daten/Allianz/Agentur Jaeger/Hausverwaltung/[Anschrift]/`

3. **UI-Features:**
   - Upload-Dialog mit Modul-, Kategorie- und Unterkategorie-Auswahl
   - Dokumenten-Liste gruppiert nach Modulen
   - Download und Löschen von Dokumenten
   - Integration im "Dokumente"-Tab der Kontakt-Detailseite

---

## 📦 Deployment Schritte

### **1. Auf Production Server einloggen**
```bash
ssh -p 2222 tschatscher@109.90.44.221
```

### **2. Code aktualisieren**
```bash
cd /var/www/immobilien-verwaltung
git pull
```

### **3. Dependencies installieren**
```bash
pnpm install
```

### **4. Datenbank-Migration durchführen**

**WICHTIG:** Die neue Tabelle `contactDocuments` muss erstellt werden!

```bash
# Migration erstellen
pnpm run db:generate

# Migration anwenden
pnpm run db:push
```

**Oder manuell via SQL:**
```sql
CREATE TABLE contactDocuments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  contactId INT NOT NULL,
  module ENUM('immobilienmakler', 'versicherungen', 'hausverwaltung') NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  fileUrl VARCHAR(500) NOT NULL,
  fileType VARCHAR(50),
  fileSize INT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  description TEXT,
  tags TEXT,
  uploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  uploadedBy INT,
  INDEX idx_contactId (contactId),
  INDEX idx_module (module)
);
```

### **5. Build durchführen**
```bash
pnpm run build
```

### **6. Server neu starten**
```bash
pm2 restart immobilien-dashboard
pm2 status
```

### **7. Logs prüfen**
```bash
pm2 logs immobilien-dashboard --lines 50
```

---

## ✅ Testing

### **1. Kontakt öffnen**
- Dashboard → Kontakte → Einen Kontakt auswählen

### **2. Zum "Dokumente"-Tab wechseln**
- Der Tab sollte jetzt die neue UI zeigen

### **3. Dokument hochladen**
- Button "Dokument hochladen" klicken
- Modul auswählen (z.B. Immobilienmakler)
- Kategorie auswählen (z.B. "Unterlagen Upload Eigentümer")
- Optional: Unterkategorie und Beschreibung eingeben
- Datei auswählen und hochladen

### **4. Dokument prüfen**
- Dokument sollte in der Liste erscheinen
- Auf WebDAV-Server prüfen, ob Ordner erstellt wurde:
  - Immobilienmakler: `/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Kontakte/[Name]/[Kategorie]/`
  - Versicherungen: `/Daten/Allianz/Agentur Jaeger/Versicherungen/[Name]/[Kategorie]/`
  - Hausverwaltung: `/Daten/Allianz/Agentur Jaeger/Hausverwaltung/[Adresse]/[Kategorie]/`

### **5. Download testen**
- Download-Button klicken
- Datei sollte heruntergeladen werden

### **6. Löschen testen**
- Löschen-Button klicken
- Dokument sollte aus Liste und WebDAV verschwinden

---

## 🔧 Troubleshooting

### **Problem: "WebDAV not configured"**
**Lösung:** WebDAV-Einstellungen in Settings prüfen:
- Dashboard → Einstellungen → Allgemein
- WebDAV URL, Port, Username, Password eingeben

### **Problem: "Database not available"**
**Lösung:** Datenbank-Migration durchführen (siehe Schritt 4)

### **Problem: "Contact not found"**
**Lösung:** Kontakt-ID prüfen, ggf. Kontakt neu erstellen

### **Problem: Build-Fehler**
**Lösung:** Dependencies neu installieren:
```bash
rm -rf node_modules
pnpm install
pnpm run build
```

---

## 📁 Geänderte Dateien

### **Backend:**
- `drizzle/schema.ts` - Neue Tabelle `contactDocuments`
- `server/contactDocumentsWebdav.ts` - WebDAV Service (NEU)
- `server/contactsRouter.ts` - Neue tRPC Endpoints

### **Frontend:**
- `client/src/components/ContactDocuments.tsx` - UI Komponente (NEU)
- `client/src/pages/dashboard/ContactDetail.tsx` - Integration

---

## 🎉 Fertig!

Das Feature ist jetzt live! 🚀

Bei Fragen oder Problemen: Logs prüfen mit `pm2 logs immobilien-dashboard`
