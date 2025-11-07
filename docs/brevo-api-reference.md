# Brevo API Reference (ehemals Sendinblue)

## Overview
Brevo provides APIs for transactional emails, SMS, contact management, and marketing automation.

## Key Features for Immobilien-Verwaltung

### 1. Transactional Emails
**Endpoint**: `POST https://api.brevo.com/v3/smtp/email`

**Use Cases**:
- Kontaktanfragen von Interessenten (property inquiry notifications)
- Bestätigungsmails nach Terminvereinbarung
- Benachrichtigungen an Eigentümer über neue Anfragen
- Automatische E-Mails bei Statusänderungen

**Key Parameters**:
- `to`: Array of recipients `[{"name":"John", "email":"john@example.com"}]`
- `sender`: Sender info `{"name":"Immobilien GmbH", "email":"info@immobilien.de"}`
- `subject`: Email subject
- `htmlContent`: HTML email body (if not using template)
- `templateId`: ID of pre-created template
- `params`: Dynamic template variables `{"PROPERTY_TITLE":"Haus in Leipzig", "PRICE":"450000"}`
- `replyTo`: Reply-to address
- `attachment`: Array of attachments (URL or base64)
- `tags`: Tags for email organization
- `scheduledAt`: Schedule email for later (UTC datetime)

**Response**:
- `201`: Email sent successfully
- `202`: Email scheduled
- `400`: Bad request

### 2. Contact Management
**Use Cases**:
- Interessenten-Datenbank aufbauen
- Kontakte nach Immobilientyp segmentieren
- Newsletter-Listen verwalten
- Lead-Tracking

**Endpoints**:
- Create/Update Contact
- Get Contact Lists
- Add Contact to List
- Remove Contact from List

### 3. Email Templates
**Use Cases**:
- Vordefinierte E-Mail-Vorlagen für häufige Szenarien
- Professionelles Design ohne HTML-Kenntnisse
- Dynamische Inhalte mit Platzhaltern

**Template Variables** (Beispiele für Immobilien):
```json
{
  "PROPERTY_TITLE": "Moderne 3-Zimmer-Wohnung",
  "PROPERTY_PRICE": "450.000 €",
  "PROPERTY_CITY": "Leipzig",
  "PROPERTY_ROOMS": "3",
  "PROPERTY_SIZE": "85 m²",
  "CONTACT_NAME": "Max Mustermann",
  "VIEWING_DATE": "15.12.2024 um 14:00 Uhr",
  "AGENT_NAME": "Anna Schmidt",
  "AGENT_PHONE": "+49 123 456789",
  "PROPERTY_URL": "https://immobilien.de/property/123"
}
```

### 4. Batch Sending (messageVersions)
**Use Case**: Mehrere personalisierte E-Mails auf einmal senden
- Max 2000 Empfänger pro Request
- Max 99 Empfänger pro messageVersion
- Individuelle Anpassung pro Version

**Example**:
```json
{
  "sender": {"email": "info@immobilien.de", "name": "Immobilien GmbH"},
  "subject": "Neue Immobilie verfügbar",
  "templateId": 123,
  "messageVersions": [
    {
      "to": [{"email": "kunde1@example.com", "name": "Kunde 1"}],
      "params": {"PROPERTY_TITLE": "Haus in Leipzig", "PRICE": "450000"}
    },
    {
      "to": [{"email": "kunde2@example.com", "name": "Kunde 2"}],
      "params": {"PROPERTY_TITLE": "Wohnung in Dresden", "PRICE": "280000"}
    }
  ]
}
```

## Integration Plan

### Phase 1: Transactional Emails
1. **Kontaktanfragen-Benachrichtigungen**
   - Interessent füllt Kontaktformular aus
   - System sendet E-Mail an Eigentümer/Makler
   - Bestätigungsmail an Interessenten

2. **Terminvereinbarungen**
   - Besichtigungstermin-Bestätigung
   - Erinnerung vor Termin
   - Absage/Änderung-Benachrichtigung

3. **Statusänderungen**
   - Immobilie verfügbar → E-Mail an Interessenten-Liste
   - Preisänderung → Benachrichtigung
   - Immobilie verkauft/vermietet → Info an alle Interessenten

### Phase 2: Contact Management
1. **Lead-Erfassung**
   - Automatisches Hinzufügen von Kontakten aus Anfragen
   - Segmentierung nach Interessen (Kauf/Miete, Wohnung/Haus, etc.)
   - Tags für bessere Organisation

2. **Newsletter**
   - Neue Immobilien-Newsletter
   - Marktberichte
   - Tipps für Käufer/Mieter

### Phase 3: Automation
1. **Drip Campaigns**
   - Automatische Follow-up-E-Mails
   - Nurturing-Sequenzen für Leads
   - Re-Engagement-Kampagnen

## Authentication
**Header**: `api-key: YOUR_BREVO_API_KEY`

Die API-Key ist bereits in den Secrets gespeichert: `BREVO_API_KEY`

## Implementation Notes
1. Brevo API-Key ist bereits verfügbar (`BREVO_API_KEY` in ENV)
2. Verwende Node.js SDK oder direkte HTTP-Requests
3. Rate Limits beachten (abhängig vom Brevo-Plan)
4. Webhook-Integration für Email-Events (opened, clicked, bounced, etc.)

## Next Steps
1. E-Mail-Templates in Brevo erstellen
2. tRPC-Endpoints für E-Mail-Versand implementieren
3. Contact-Management-Integration
4. Webhook-Handler für E-Mail-Events
5. Automatisierungs-Workflows definieren
