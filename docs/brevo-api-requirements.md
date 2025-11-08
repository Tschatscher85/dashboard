# Brevo API Integration Requirements

## API Endpoint
- **Base URL:** `https://api.brevo.com/v3`
- **Create Contact:** `POST /contacts`
- **Update Contact:** `PUT /contacts/{identifier}`
- **Get Contact:** `GET /contacts/{identifier}`
- **Authentication:** API Key in header `api-key: YOUR_API_KEY`

## Required Fields (Minimum)
- `email` (required) - Email address
- `attributes` (object) - Contact attributes

## Available Brevo Contact Attributes

### Basis-Felder:
- `EMAIL` (Text) - Email-Adresse
- `VORNAME` (Text) - Vorname
- `NACHNAME` (Text) - Nachname
- `WHATSAPP` (Text) - WhatsApp-Nummer
- `SMS` (Text) - Telefonnummer (Format: +49xxxxxxxxxx)
- `EXT_ID` (Text) - Externe ID (unsere Kontakt-ID)

### Immobilien-spezifische Felder:
- `IMMOSCOUTID` (Text) - ImmoScout24 ID des Objekts
- `IMMOSCOUTANSCHRIFT` (Text) - Vollständige Adresse
- `POSTLEITZAHL` (Text) - PLZ
- `ORT` (Text) - Stadt
- `STRASSE` (Text) - Straße + Hausnummer
- `IMMOBILIENTYP` (Text) - Haus, Wohnung, Grundstück, etc.
- `IMMOBILIENWERT` (Text) - Kaufpreis oder Miete
- `WOHNFLAECHE` (Text) - Wohnfläche in m²
- `GRUNDSTUECKFLAECHE` (Text) - Grundstückfläche in m²
- `ZIMMERANZAHL` (Text) - Anzahl Zimmer
- `BAUJAHR` (Text) - Baujahr
- `LEAD` (Mehrfachauswahl) - Lead-Typ (Immobilienanfrage, Eigentümeranfrage)

## Integration Scenarios

### 1. Immobilienanfrage (Lead interessiert sich für Objekt)
**Daten:**
- Kontakt-Basis-Daten (Vorname, Nachname, Email, WhatsApp)
- Objekt-Referenz (IMMOSCOUTID, IMMOSCOUTANSCHRIFT)
- Objekt-Details (Typ, Wert, Fläche, Zimmer, etc.)
- LEAD: "Immobilienanfrage"

### 2. Eigentümeranfrage (Eigentümer möchte verkaufen)
**Daten:**
- Kontakt-Basis-Daten (Vorname, Nachname, Email, WhatsApp)
- Optional: Objekt-Daten (wenn bereits erfasst)
- LEAD: "Eigentümeranfrage"

## API Request Example

```json
POST https://api.brevo.com/v3/contacts
Headers:
  api-key: YOUR_API_KEY
  Content-Type: application/json

Body:
{
  "email": "max.mustermann@example.com",
  "attributes": {
    "VORNAME": "Max",
    "NACHNAME": "Mustermann",
    "WHATSAPP": "+491234567890",
    "SMS": "+491234567890",
    "EXT_ID": "123",
    "IMMOSCOUTID": "158820057",
    "IMMOSCOUTANSCHRIFT": "Klingenweg 15, 73312 Geislingen",
    "POSTLEITZAHL": "73312",
    "ORT": "Geislingen",
    "STRASSE": "Klingenweg 15",
    "IMMOBILIENTYP": "Haus",
    "IMMOBILIENWERT": "150000",
    "WOHNFLAECHE": "200",
    "ZIMMERANZAHL": "5",
    "BAUJAHR": "1990",
    "LEAD": ["Immobilienanfrage"]
  },
  "listIds": [12], // List ID für Immobilienanfragen
  "updateEnabled": true
}
```

## List Management
- Brevo nutzt **Listen** zur Segmentierung
- Wir benötigen zwei Listen:
  1. **Immobilienanfragen** (List ID in Settings konfigurierbar)
  2. **Eigentümeranfragen** (List ID in Settings konfigurierbar)

## Database Schema Requirements

### contacts table (extend):
- `brevoContactId` (varchar) - Brevo Contact ID
- `brevoSyncStatus` (enum: 'not_synced', 'synced', 'error')
- `brevoLastSyncedAt` (timestamp) - Letzte Synchronisierung
- `brevoListId` (int) - Brevo List ID
- `brevoErrorMessage` (text) - Fehlermeldung bei Sync-Fehler
- `inquiryType` (enum: 'property_inquiry', 'owner_inquiry', null) - Anfragetyp

## Settings Configuration
- `brevoApiKey` (bereits vorhanden)
- `brevoPropertyInquiryListId` (neu) - List ID für Immobilienanfragen
- `brevoOwnerInquiryListId` (neu) - List ID für Eigentümeranfragen
