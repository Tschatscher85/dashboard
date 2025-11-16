# Dashboard Entwicklung - Zusammenfassung

**Datum:** 16. November 2025

---

## 🎯 Heute implementiert

### 1. **Property Landing Pages** 🏠
- ✅ Öffentliche Landing Pages für jede Immobilie (`/property/:id`)
- ✅ Bild-Galerie mit allen Property-Bildern
- ✅ Alle Immobilien-Details (Preis, Fläche, Zimmer, Energieausweis, etc.)
- ✅ Google Maps Integration
- ✅ **Kontaktformular** mit Brevo-Integration
- ✅ **Property Links Sektion** (virtuelle Rundgänge, Videos, etc.)
- ✅ **8 HTML-Templates** (modern, elegant, clean, popular, trust, progress, whitesmoke, iframe)
- ✅ **Server-Side Rendering** mit Nunjucks
- ✅ **Superchat Widget** in allen Templates
- ✅ **AGB/Impressum/Datenschutz Footer** mit Modal-Dialogen

### 2. **Brevo E-Mail Integration** 📧
- ✅ **Admin-Benachrichtigung**: Du erhältst E-Mail bei jeder Anfrage
- ✅ **Kunden-Bestätigung**: Kunde erhält automatische Bestätigungs-E-Mail
- ✅ **Brevo CRM**: Kontakte werden automatisch zu Liste 18 (Immobilienanfragen) hinzugefügt
- ✅ **Modul-spezifische E-Mail Settings** (3 Module):
  - 🏠 Immobilienmakler (realestateEmailFrom, realestateEmailFromName, realestateEmailNotificationTo)
  - 🛡️ Versicherungen (insuranceEmailFrom, insuranceEmailFromName, insuranceEmailNotificationTo)
  - 🏛️ Hausverwaltung (propertyMgmtEmailFrom, propertyMgmtEmailFromName, propertyMgmtEmailNotificationTo)
- ✅ Deutsche E-Mail-Templates mit Umlauten
- ✅ HTML + Plain Text Versionen

### 3. **PDF-Generierungs-System** 📄
**Backend Service (`server/pdfGenerator.ts`):**
- ✅ `generateExpose()` - Vollständiges Immobilien-Exposé
- ✅ `generateOnePager()` - Kompakte Übersicht (1 Seite)
- ✅ `generateInvoice()` - Rechnung mit Positionen, MwSt., Gesamt
- ✅ `generateMaklervertrag()` - Maklervertrag mit Eigentümer-Daten

**API Endpoints:**
- `pdf.generateExpose`
- `pdf.generateOnePager`
- `pdf.generateInvoice`
- `pdf.generateMaklervertrag`

**Features:**
- Automatischer PDF-Download im Browser
- Firmen-Branding (Logo, Kontaktdaten)
- Platzhalter-System für dynamische Inhalte
- Fehlerbehandlung mit Toast-Benachrichtigungen

### 4. **Property-Detail Aktionen-Dropdown** 🎯
**Buttons im Property-Detail:**
- 👁️ **Landing Page Vorschau** - Öffnet Landing Page in neuem Tab
- 🔗 **Landing Page teilen** - Kopiert Link in Zwischenablage
- 🖨️ **Exposé ausdrucken** - Generiert & lädt PDF herunter
- 🔗 **Exposé teilen** - (In Entwicklung)
- 🖨️ **One-Pager ausdrucken** - Generiert & lädt PDF herunter
- 🔗 **One-Pager teilen** - (In Entwicklung)
- 🧾 **Rechnung Käufer** - (Dialog folgt)
- 🧾 **Rechnung Verkäufer** - (Dialog folgt)
- 📝 **Maklervertrag erstellen** - Generiert & lädt PDF herunter

### 5. **Template-Management in Settings** 📝
**Neuer Tab "Dokument-Vorlagen":**
- ✅ Exposé-Template (mit Platzhaltern)
- ✅ One-Pager-Template (mit Platzhaltern)
- ✅ Rechnungs-Template Käufer (mit Platzhaltern)
- ✅ Rechnungs-Template Verkäufer (mit Platzhaltern)
- ✅ Maklervertrag-Template (mit Platzhaltern)

**Platzhalter-Dokumentation:**
- Property-Daten: `{{property.title}}`, `{{property.price}}`, `{{property.address}}`, etc.
- Eigentümer: `{{owner.name}}`, `{{owner.email}}`, `{{owner.phone}}`
- Käufer: `{{buyer.name}}`, `{{buyer.email}}`
- Firma: `{{company.name}}`, `{{company.address}}`
- Datum: `{{date}}`, `{{invoiceNumber}}`, etc.

**Datenbank-Felder:**
- `exposeTemplate`, `onePagerTemplate`, `invoiceTemplate`, `maklervertragTemplate`
- Speicherung in `settings` Tabelle (id=1)

### 6. **Kontakt-Management System** 📇

#### **Datenbank-Schema (60+ Felder)**
**Neue `contacts` Tabelle mit:**
- ✅ **Module** (Immobilienmakler, Versicherungen, Hausverwaltung) - Multi-Select
- ✅ **Kontakt-Typ** (Kunde, Partner, Dienstleister, Sonstiges)
- ✅ **Kategorie** (dynamisch basierend auf Typ):
  - **Kunde**: Eigentümer, Eigentümer Lead, Kapitalanleger, Kaufinteressent, Käufer, Mieter, Mietinteressent, Verkäufer, Vermieter
  - **Partner**: Finanzierung, Kooperation, Makler, Notar, Rechtsanwalt, Tippgeber
  - **Dienstleister**: Architekt, Bauträger, Fotograf, Handwerker, Hausverwaltung, IT-Branche, Eigennutzer
- ✅ **Stammdaten**: Anrede, Titel, Vorname, Nachname, Sprache, Alter, Nationalität, Geburtsdatum, Geburtsname, Geburtsort, Ausweis, Steuer-ID
- ✅ **Kontaktdaten**: E-Mail, Alternative E-Mail, Telefon, Mobil, Fax, Website, Warnhinweis
- ✅ **Adresse (Privat)**: Straße, Hausnummer, PLZ, Ort, Land
- ✅ **Firma**: Firmenname, Position, Firmenadresse (Straße, Hausnummer, PLZ, Ort, Land), Büro-Telefon, Büro-Mobil, Büro-Fax, Website 2, Gewerblicher Kontakt
- ✅ **Merkmale**: Betreuer, Co-Betreuer, Followup-Datum, Quelle, Status, Tags (Merkmale), Archiviert, Notizen, Erreichbarkeit
- ✅ **Verrechnung**: Kontakt sperren, Teams freigeben, Nutzer freigeben
- ✅ **DSGVO**: Status, Speichern-bis-Datum, Speichern-bis-Grund, Kontakterlaubnis erteilt, Newsletter gewünscht, Immobilienmailing gewünscht
- ✅ **Sync**: Google Contacts ID, Brevo Contact ID, Last Sync

#### **Backend API (`server/contactsRouter.ts`)**
**Endpoints:**
- `contacts.getAll` - Alle Kontakte mit Filtern (module, type, category, search)
- `contacts.getById` - Kontakt nach ID
- `contacts.create` - Neuen Kontakt erstellen
- `contacts.update` - Kontakt aktualisieren
- `contacts.delete` - Kontakt löschen
- `contacts.getCategories` - Kategorien nach Typ

**Filter-Optionen:**
- Nach Modul (Immobilienmakler, Versicherungen, Hausverwaltung)
- Nach Typ (Kunde, Partner, Dienstleister, Sonstiges)
- Nach Kategorie (dynamisch)
- Volltextsuche (Name, E-Mail, Firma)

#### **Frontend - Kontakt-Liste (`ContactsNew.tsx`)**
**Features:**
- ✅ **Modul-Filter Tabs**: Alle | Immobilienmakler | Versicherungen | Hausverwaltung
- ✅ **Typ-Filter Dropdown**: Alle Typen | Kunde | Partner | Dienstleister | Sonstiges
- ✅ **Suche**: Nach Name, E-Mail, Firma
- ✅ **Tabelle** mit Spalten:
  - Name (Vorname + Nachname)
  - E-Mail
  - Telefon
  - Firma
  - Typ & Kategorie
  - Module (Badges: 🏠 🛡️ 🏛️)
  - Aktionen (Ansehen, Bearbeiten, Löschen)
- ✅ **Responsive Design**
- ✅ **"Neuer Kontakt" Button**

#### **Frontend - Kontakt-Formular (`ContactForm.tsx`)**
**6 Tabs:**

**1. Stammdaten**
- Modul-Zuordnung (Multi-Select Checkboxen: Immobilienmakler, Versicherungen, Hausverwaltung)
- Kontakt-Typ (Dropdown: Kunde, Partner, Dienstleister, Sonstiges)
- Kategorie (dynamisch basierend auf Typ)
- Person/Firma Toggle
- Anrede, Titel, Vorname, Nachname
- Sprache, Alter, Nationalität
- E-Mail, Alternative E-Mail
- Telefon, Mobil, Fax
- Website, Warnhinweis
- Adresse (Straße, Hausnummer, PLZ, Ort, Land)

**2. Firma**
- Firmenname
- Position
- Firmenadresse (Straße, Hausnummer, PLZ, Ort, Land)
- Büro-Telefon, Büro-Mobil, Büro-Fax
- Website 2
- Gewerblicher Kontakt (Toggle)

**3. Merkmale & Co.**
- Betreuer (User-Select)
- Co-Betreuer (User-Select)
- Followup-Datum (Date Picker)
- Quelle (Input)
- Status (Dropdown)
- Erreichbarkeit (Textarea)
- Tags/Merkmale (Multi-Select)
- Archiviert (Toggle)
- Notizen (Textarea)

**4. Verrechnung**
- Kontakt sperren (Toggle)
- Teams freigeben (Multi-Select)
- Nutzer freigeben (Multi-Select)

**5. DSGVO**
- DSGVO-Status (Dropdown: Speicherung zugestimmt, Vorvertragliches Anbahungsverhältnis 1 Jahr, etc.)
- Speichern-bis-Datum (Date Picker)
- Speichern-bis-Grund (Textarea)
- Kontakterlaubnis erteilt (Toggle)
- Newsletter gewünscht (Toggle)
- Immobilienmailing gewünscht (Toggle)

**6. GwG-Angaben**
- Geburtsdatum (Date Picker)
- Geburtsname (Input)
- Geburtsort (Input)
- Geburtsland (Select)
- Ausweisart (Dropdown: Personalausweis, Reisepass, etc.)
- Personalausweisnummer (Input)
- Ausstellende Behörde (Input)
- Staatsangehörigkeit (Select)
- Steuer-ID (Input)

**Features:**
- ✅ Create & Update Modus (basierend auf Route)
- ✅ Toast-Benachrichtigungen
- ✅ Formular-Validierung
- ✅ Responsive Design
- ✅ Zurück-Button zur Kontakt-Liste

#### **Routing**
- `/dashboard/contacts` → ContactsNew (Liste)
- `/dashboard/contacts/new` → ContactForm (Erstellen)
- `/dashboard/contacts/:id` → ContactDetail (Ansicht)
- `/dashboard/contacts/:id/edit` → ContactForm (Bearbeiten)

---

## 📦 Commits heute

1. **✨ Brevo Integration + Landing Pages** (efc0d25)
   - E-Mail Settings pro Modul
   - AGB/Impressum/Datenschutz Footer
   - Template-Rendering System

2. **✨ PDF Document Generation** (e7ac251)
   - Exposé, One-Pager, Rechnungen, Maklervertrag
   - Aktionen-Dropdown im Property-Detail
   - PDF-Generator Service

3. **✨ Template Management System** (172ecb1)
   - Dokument-Vorlagen in Settings
   - Platzhalter-Dokumentation
   - Datenbank-Speicherung

4. **✨ Add comprehensive contact management backend** (6e2d3b4)
   - Contacts Tabelle mit 60+ Feldern
   - Contact API Router mit CRUD + Filter
   - Kategorie-System

5. **✨ Add contact management UI - Phase 3 & 4** (06ac08c)
   - ContactsNew.tsx (Liste mit Filtern)
   - ContactForm.tsx (Formular mit 6 Tabs)

6. **🔧 Fix contact routing and add new contact pages** (d921714)
   - Routing für /new und /:id/edit
   - ContactsNew.tsx aktiviert

---

## 🚀 Nächste Schritte

### **Sofort (Deployment):**
1. ✅ Auf Server deployen (git pull + build + restart)
2. ✅ Datenbank-Migration ausführen (neue Spalten)
3. ✅ Settings konfigurieren:
   - Brevo API Key
   - E-Mail-Adressen (pro Modul)
   - Landing Page Template wählen
   - Dokument-Templates anpassen
   - AGB/Impressum/Datenschutz Texte
4. ✅ Testen:
   - Landing Page öffnen
   - Kontaktformular ausfüllen
   - PDF-Generierung testen
   - Kontakte erstellen/bearbeiten

### **Später (Features):**
1. **Kontakt-System erweitern:**
   - ✅ Google Contacts Sync (mit Label-Mapping)
   - ✅ Brevo CRM Sync (mit Listen-Mapping)
   - ✅ Settings-Sektion "Synchronisation"
   - ✅ Bidirektionale Sync-Logik

2. **Rechnungs-Dialog:**
   - UI zum Eingeben von Rechnungspositionen
   - Berechnung MwSt., Gesamt
   - PDF-Generierung mit Positionen

3. **Share-Funktionalität:**
   - E-Mail-Versand von PDFs
   - WhatsApp-Share
   - Link-Share

4. **Eigentümer-Daten Integration:**
   - Eigentümer-Auswahl im Property-Detail
   - Automatische Daten im Maklervertrag

5. **Template-Vorschau:**
   - Live-Preview der Landing Page Templates
   - Template-Editor

---

## 📁 Wichtige Dateien

### **Backend:**
- `drizzle/schema.ts` - Datenbank-Schema (settings, contacts, propertyLinks)
- `server/email.ts` - Brevo E-Mail Service
- `server/pdfGenerator.ts` - PDF-Generierungs-Service
- `server/templateRenderer.ts` - Landing Page Template Renderer
- `server/contactsRouter.ts` - Contact API Router
- `server/routers.ts` - Haupt-Router (importiert contactsRouter)
- `server/db.ts` - Datenbank-Funktionen

### **Frontend:**
- `client/src/pages/dashboard/ContactsNew.tsx` - Kontakt-Liste
- `client/src/pages/dashboard/ContactForm.tsx` - Kontakt-Formular
- `client/src/pages/dashboard/PropertyDetail.tsx` - Property-Detail mit Aktionen-Dropdown
- `client/src/pages/Settings.tsx` - Settings mit E-Mail, Templates, etc.
- `client/src/App.tsx` - Routing

### **Templates:**
- `server/templates/modern.html` - Landing Page Template (+ 7 weitere)

---

## 🎯 Google Contacts Labels

**Bestehende Labels:**
- 🏢 **0705 - Firmen** (5)
- 👤 **0705 - Privat** (55)
- 🛡️ **Allianz Privat** (990) → Versicherungen
- 🏠 **Eigentümeranfragen** (37) → Immobilienmakler (Verkäufer)
- 💰 **Finanzierung** (34)
- 🏢 **Firmen** (114)
- 🏠 **Immobilienanfrage** (287) → Immobilienmakler (Käufer)
- 🐱 **TKVKatze** (61)

**Geplantes Mapping:**
- Immobilienmakler (Verkäufer) → `Eigentümeranfragen`
- Immobilienmakler (Käufer) → `Immobilienanfrage`
- Versicherungen → `Allianz Privat`
- Hausverwaltung → `[Neu erstellen]`

---

## ✅ Status

**Fertig:**
- ✅ Landing Pages mit 8 Templates
- ✅ Brevo E-Mail Integration (modul-spezifisch)
- ✅ PDF-Generierung (Exposé, One-Pager, Rechnung, Maklervertrag)
- ✅ Template-Management in Settings
- ✅ Kontakt-System (Backend + Frontend)
- ✅ Modul-Zuordnung (Multi-Select)
- ✅ Kontakt-Typen & Kategorien (wie Propstack)

**In Entwicklung:**
- ⏳ Google Contacts Sync
- ⏳ Brevo CRM Sync
- ⏳ Rechnungs-Dialog
- ⏳ Share-Funktionalität
- ⏳ Eigentümer-Integration

**TODO:**
- ⏳ Deployment auf Server
- ⏳ Datenbank-Migration
- ⏳ Settings konfigurieren
- ⏳ Testing

---

**Alle Änderungen sind auf GitHub gepusht!** ✅
