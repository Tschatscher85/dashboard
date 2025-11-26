# FIELD MISMATCH ANALYSIS - ROOT CAUSE IDENTIFIED

## PROBLEM ZUSAMMENFASSUNG

**Das Hauptproblem ist gefunden:** Die Feldnamen im tRPC Router und im Drizzle Schema stimmen NICHT überein!

Wenn der User "Kaufpreis: 135.000 €" eingibt:
1. Frontend sendet `price: 135000` an den Router
2. Router leitet `price: 135000` an `updateProperty()` weiter
3. Drizzle ORM versucht das Feld `price` in der Datenbank zu aktualisieren
4. **ABER:** In der Datenbank existiert nur das Feld `purchasePrice`, NICHT `price`
5. Drizzle ignoriert das unbekannte Feld `price` stillschweigend
6. **Ergebnis:** Keine Fehlermeldung, aber Daten werden NICHT gespeichert!

## BETROFFENE FELDER

### Kritische Felder (werden NICHT gespeichert):

| Router Feldname | Sollte sein | Beschreibung |
|----------------|-------------|--------------|
| `price` | `purchasePrice` | **Kaufpreis** - KRITISCH! |
| `coldRent` | `baseRent` | **Kaltmiete** - KRITISCH! |
| `warmRent` | `totalRent` | **Warmmiete** - KRITISCH! |
| `balconyArea` | `balconyTerraceArea` | Balkonfläche |
| `parkingCount` | `parkingSpaces` | Anzahl Stellplätze |
| `flooringTypes` | `flooring` | Bodenbeläge |
| `heatingIncludedInAdditional` | `heatingCostsInServiceCharge` | Heizkosten in NK |
| `monthlyRentalIncome` | `rentalIncome` | Monatliche Mieteinnahmen |

### Felder die im Schema FEHLEN (müssen hinzugefügt werden):

- `category` - Kategorie
- `hideStreetOnPortals` - Straße auf Portalen verbergen
- `floorLevel` - Etage (Text)
- `totalFloors` - Gesamtanzahl Etagen
- `nonRecoverableCosts` - Nicht umlagefähige Kosten
- `houseMoney` - Hausgeld
- `maintenanceReserve` - Instandhaltungsrücklage
- `isBarrierFree` - Barrierefrei
- `hasLoggia` - Loggia vorhanden
- `isMonument` - Denkmalgeschützt
- `suitableAsHoliday` - Als Ferienwohnung geeignet
- `hasFireplace` - Kamin vorhanden
- `hasPool` - Pool vorhanden
- `hasSauna` - Sauna vorhanden
- `hasAlarm` - Alarmanlage
- `hasWinterGarden` - Wintergarten
- `hasAirConditioning` - Klimaanlage
- `hasParking` - Parkplatz vorhanden
- `bathroomFeatures` - Badausstattung
- `heatingSystemYear` - Baujahr Heizung
- `buildingPhase` - Bauphase
- `equipmentQuality` - Ausstattungsqualität
- `availableFrom` - Verfügbar ab
- `ownerType` - Eigentümertyp
- `commissionNote` - Provisionsnotiz
- `walkingTimeToPublicTransport` - Gehzeit ÖPNV
- `distanceToPublicTransport` - Entfernung ÖPNV
- `drivingTimeToHighway` - Fahrzeit Autobahn
- `distanceToHighway` - Entfernung Autobahn
- `drivingTimeToMainStation` - Fahrzeit Hauptbahnhof
- `distanceToMainStation` - Entfernung Hauptbahnhof
- `drivingTimeToAirport` - Fahrzeit Flughafen
- `distanceToAirport` - Entfernung Flughafen
- `landingPageSlug` - Landing Page URL
- `landingPagePublished` - Landing Page veröffentlicht

## WARUM FUNKTIONIEREN MANCHE FELDER?

Felder die funktionieren haben IDENTISCHE Namen in Router und Schema:
- `heatingCosts` ✅ (heißt in beiden gleich)
- `additionalCosts` ✅ (heißt in beiden gleich)
- `parkingPrice` ✅ (heißt in beiden gleich)

## LÖSUNG

Es gibt zwei Ansätze:

### Option 1: Field Mapping im Router (EMPFOHLEN)
Füge eine Mapping-Funktion im Router hinzu, die Feldnamen übersetzt:

```typescript
const mapRouterFieldsToSchema = (data: any) => {
  const mapped = { ...data };
  
  // Rename fields
  if ('price' in mapped) { mapped.purchasePrice = mapped.price; delete mapped.price; }
  if ('coldRent' in mapped) { mapped.baseRent = mapped.coldRent; delete mapped.coldRent; }
  if ('warmRent' in mapped) { mapped.totalRent = mapped.warmRent; delete mapped.warmRent; }
  // ... weitere Mappings
  
  return mapped;
};
```

### Option 2: Schema erweitern (LANGFRISTIG)
Füge die fehlenden Felder zum Schema hinzu und führe eine Migration durch.

## NÄCHSTE SCHRITTE

1. **Sofort:** Field Mapping im Router implementieren
2. **Mittelfrist:** Fehlende Felder zum Schema hinzufügen
3. **Langfristig:** Feldnamen vereinheitlichen (Breaking Change)

## WARUM WURDE DAS NICHT FRÜHER ENTDECKT?

- Drizzle ORM gibt KEINE Warnung bei unbekannten Feldern
- Die `updateProperty` Funktion filtert nur `undefined` Werte
- Unbekannte Felder werden stillschweigend ignoriert
- Keine Fehlermeldung = User denkt es hat funktioniert
