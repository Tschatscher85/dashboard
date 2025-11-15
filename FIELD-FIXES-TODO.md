# Field Fixes TODO

## Problem
User reports that many fields in PropertyRightColumn are not saving to database.

## Root Cause
Fields are missing:
1. `value={formData.fieldName}` binding
2. `onChange={(e) => handleChange('fieldName', e.target.value)}` handler
3. Some fields have hardcoded `disabled` instead of `disabled={!isEditing}`

## Fields to Fix

### 1. Ansprechpartner Section
- [ ] Betreuer (Select) - needs value + onChange
- [ ] Eigentümer (Input) - needs value + onChange
- [ ] Typ (Input) - needs value + onChange
- [ ] Käufer (Input) - needs value + onChange
- [ ] Notar (Input) - needs value + onChange
- [ ] Hausverwaltung (Input) - needs value + onChange
- [ ] Mieter (Input) - needs value + onChange
- [ ] Verknüpfte Kontakte (Input) - needs value + onChange
- [ ] Typ (Input) - needs value + onChange

### 2. Portale Section
- [ ] IS24-Ansprechpartner (Select) - needs value + onChange
- [ ] IS24-Objekt-Nr. (Input) - needs value + onChange
- [ ] IS24-Gruppen-Nr. (Input) - needs value + onChange
- [ ] Übersetzungen (Input) - needs value + onChange

### 3. Auftrag Section
- [ ] Auftragsart (Select) - needs value + onChange
- [ ] Laufzeit (Select) - needs value + onChange
- [ ] Auftrag von (Input date) - needs value + onChange
- [ ] Auftrag bis (Input date) - needs value + onChange

### 4. Provision Intern Section
- [ ] Innenprovision (intern) (Input number) - needs value + onChange
- [ ] Außenprovision (intern) (Input number) - needs value + onChange
- [ ] **Gesamtprovision (Input)** - needs value + onChange + remove hardcoded `disabled`

### 5. Provision Extern Section
- [ ] Außenprovision für Exposé (Input) - needs value + onChange
- [ ] Provisionshinweis (Textarea) - needs value + onChange

### 6. Energieausweis Section
- [ ] Energieausweis (Select) - needs value + onChange
- [ ] Erstellungsdatum (Select) - needs value + onChange
- [ ] Ausstellungsdatum (Input date) - needs value + onChange
- [ ] Gültig bis (Input date) - needs value + onChange
- [ ] Energieausweistyp (Select) - needs value + onChange
- [ ] Energieeffizienzklasse (Select) - needs value + onChange
- [ ] Energiekennwert (Input) - ✅ HAS value + onChange
- [ ] Energiekennwert Strom (Input) - ✅ HAS value + onChange
- [ ] Energiekennwert Wärme (Input) - ✅ HAS value + onChange
- [ ] CO2-Emissionen (Input) - ✅ HAS value + onChange
- [ ] Energieverbrauch für Warmwasser enthalten (Switch) - needs value + onChange
- [ ] Heizungsart (Select) - needs value + onChange
- [ ] Wesentlicher Energieträger (Select) - needs value + onChange
- [ ] Baujahr (Input number) - needs value + onChange
- [ ] Baujahr Anlagentechnik (Input number) - needs value + onChange
- [ ] Baujahr unbekannt (Switch) - needs value + onChange

### 7. Zusatzinformationen Section
- [ ] Vermietet (Switch) - needs value + onChange
- [ ] Verfügbar ab (Input date) - needs value + onChange
- [ ] Letzte Modernisierung (Jahr) (Input number) - needs value + onChange
- [ ] Objektzustand (Select) - needs value + onChange
- [ ] Qualität der Ausstattung (Select) - needs value + onChange

### 8. Fahrzeiten Section
- [ ] Fußweg zu ÖPNV (Input) - ✅ HAS value + onChange
- [ ] Distanz (Input) - ✅ HAS value + onChange
- [ ] Fahrzeit nächste Autobahn (Input) - ✅ HAS value + onChange
- [ ] Distanz (Input) - ✅ HAS value + onChange
- [ ] Fahrzeit nächster HBF (Input) - ✅ HAS value + onChange
- [ ] Distanz (Input) - ✅ HAS value + onChange
- [ ] Fahrzeit nächster Flughafen (Input) - ✅ HAS value + onChange
- [ ] Distanz (Input) - ✅ HAS value + onChange

## Database Schema Check

Need to verify these fields exist in `properties` table:
- betreuer
- eigentuemer
- eigentuemerTyp
- kaeufer
- notar
- hausverwaltung
- mieter
- verknuepfteKontakte
- verknuepfteKontakteTyp
- is24Ansprechpartner
- is24ObjektNr
- is24GruppenNr
- uebersetzungen
- auftragsart
- laufzeit
- auftragVon
- auftragBis
- innenprovision
- aussenprovisionIntern
- gesamtprovision
- aussenprovisionExpose
- provisionshinweis
- energieausweis
- energieausweisErstellungsdatum
- energieausweisAusstellungsdatum
- energieausweisGueltigBis
- energieausweistyp
- energieeffizienzklasse
- energieverbrauchWarmwasser
- heizungsart
- energietraeger
- baujahr
- baujahrAnlagentechnik
- baujahrUnbekannt
- vermietet
- verfuegbarAb
- letzteModernisierung
- objektzustand
- qualitaetAusstattung

## Next Steps

1. Check database schema for missing columns
2. Add missing columns to schema
3. Run migration
4. Fix all field bindings in PropertyRightColumn.tsx
5. Test save functionality
6. Push to GitHub
