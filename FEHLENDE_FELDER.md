# Fehlende Speicher-Funktionalität - Analyse

## Basierend auf den Screenshots:

### 1. **Landing Page Überschrift**
- Feld: "Attraktive Überschrift für die Immobilie"
- Status: Wird NICHT gespeichert

### 2. **Ansprechpartner Section**
- Betreuer (Dropdown)
- Eigentümer (Kontakt suchen)
- Typ (optional)
- Käufer (Kontakt suchen)
- Notar (Kontakt suchen)
- Hausverwaltung (Kontakt suchen)
- Mieter (Kontakt suchen)
- Verknüpfte Kontakte (Kontakt suchen)
- Status: Wird NICHT gespeichert

### 3. **Portale Section**
- Status: Wird NICHT gespeichert

### 4. **Auftrag Section**
- Auftragsart (Dropdown)
- Laufzeit (Dropdown)
- Auftrag von bis (2 Datumsfelder)
- Status: Wird NICHT gespeichert

### 5. **Verkauf Section**
- Status: Wird NICHT gespeichert

### 6. **Provision Intern**
- Innenprovision (intern) - mit % oder € Toggle
- Außenprovision (intern) - mit % oder € Toggle
- Gesamtprovision - berechnet
- Status: Wird NICHT gespeichert

### 7. **Provision Extern**
- Außenprovision für Exposé
- Provisionshinweis (Textarea)
- Status: Wird NICHT gespeichert

### 8. **Energieausweis**
- Energieausweis (Dropdown)
- Erstellungsdatum (Datum)
- Ausstellungsdatum (Datum)
- Gültig bis (Datum)
- Energieausweistyp (Dropdown)
- Energieeffizienzklasse (Dropdown)
- Energiekennwert (kWh/(m²·a))
- Energiekennwert Strom (kWh/(m²·a))
- Energiekennwert Wärme (kWh/(m²·a))
- CO2-Emissionen (kg/m²a)
- Energieverbrauch für Warmwasser enthalten (Checkbox)
- Heizungsart (Dropdown)
- Wesentlicher Energieträger (Dropdown)
- Baujahr (z.B. 1990)
- Baujahr Anlagentechnik (z.B. 2010)
- Baujahr unbekannt (Checkbox)
- Status: Wird NICHT gespeichert

### 9. **Ausstattung & Highlights**
- Ausstattung & Highlights (großes Textfeld mit Emojis)
- Lage (Textfeld)
- Fazit (Textfeld)
- Kontaktieren Sie uns direkt! (Textfeld)
- Status: Wird NICHT gespeichert

## Nächste Schritte:
1. Datenbank-Schema prüfen ob Spalten existieren
2. Falls nicht: Migration erstellen
3. Backend API erweitern (routers.ts)
4. Frontend Forms anpassen
