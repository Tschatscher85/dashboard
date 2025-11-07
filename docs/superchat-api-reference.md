# Superchat API Reference

## Overview
Superchat provides a unified API for messaging across multiple platforms (WhatsApp, Facebook Messenger, Instagram, Telegram, Email, etc.).

## Key Features for Immobilien-Verwaltung

### 1. Send Messages
**Endpoint**: `POST https://api.superchat.com/v1.0/messages`

**Authentication**: 
- Header: `X-API-KEY: your_api_key`

**Use Cases**:
- Antworten auf Immobilienanfragen über WhatsApp/Facebook
- Automatische Bestätigungen nach Kontaktformular-Einreichung
- Besichtigungstermin-Erinnerungen
- Follow-up-Nachrichten an Interessenten
- Statusupdates zu Immobilien

**Request Body**:
```json
{
  "to": [
    {
      "identifier": "+491234567890"  // Phone number (E164), email, or contact_id
    }
  ],
  "from": {
    "identifier": "your_channel_id"  // Your Superchat channel
  },
  "content": {
    "type": "text",  // or "media", "whats_app_template", "email"
    "text": "Hallo! Vielen Dank für Ihr Interesse an unserer Immobilie..."
  },
  "in_reply_to": "message_id"  // Optional: Reply to a specific message (email only)
}
```

**Content Types**:

1. **Text Message**:
```json
{
  "type": "text",
  "text": "Ihre Nachricht hier"
}
```

2. **Media Message** (Images, Videos, Documents):
```json
{
  "type": "media",
  "url": "https://example.com/image.jpg",
  "caption": "Grundriss der Wohnung"
}
```

3. **WhatsApp Template** (for initial contact):
```json
{
  "type": "whats_app_template",
  "template_name": "immobilien_anfrage",
  "language": "de",
  "components": [
    {
      "type": "body",
      "parameters": [
        {"type": "text", "text": "Max Mustermann"},
        {"type": "text", "text": "3-Zimmer-Wohnung Leipzig"}
      ]
    }
  ]
}
```

4. **Email**:
```json
{
  "type": "email",
  "subject": "Ihre Immobilienanfrage",
  "html": "<p>Sehr geehrte/r ...</p>",
  "text": "Sehr geehrte/r ..."
}
```

**Response**:
- `200`: Message sent successfully
- `400`: Client error (invalid data)
- `401`: Unauthorized (invalid API key)
- `500`: Server error

### 2. Receive Messages (Webhooks)
**Use Case**: Eingehende Nachrichten von Interessenten empfangen

**Webhook Setup**:
- Configure webhook URL in Superchat dashboard
- Receive POST requests when new messages arrive

**Webhook Payload**:
```json
{
  "event": "message.created",
  "data": {
    "id": "msg_123",
    "conversation_id": "conv_456",
    "contact": {
      "id": "contact_789",
      "name": "Max Mustermann",
      "phone": "+491234567890",
      "email": "max@example.com"
    },
    "content": {
      "type": "text",
      "text": "Ich interessiere mich für die Wohnung in Leipzig"
    },
    "channel": "whatsapp",
    "created_at": "2024-11-07T10:30:00Z"
  }
}
```

### 3. Conversations
**Endpoints**:
- `GET /v1.0/conversations` - List all conversations
- `GET /v1.0/conversations/{id}` - Get conversation details
- `GET /v1.0/conversations/{id}/messages` - Get conversation messages

**Use Cases**:
- Conversation history anzeigen
- Alle Anfragen zu einer Immobilie gruppieren
- Interessenten-Kommunikation nachverfolgen

### 4. Contacts
**Endpoints**:
- `GET /v1.0/contacts` - List all contacts
- `POST /v1.0/contacts` - Create contact
- `GET /v1.0/contacts/{id}` - Get contact details
- `PATCH /v1.0/contacts/{id}` - Update contact

**Use Cases**:
- Interessenten-Datenbank aufbauen
- Custom Attributes für Immobilien-Präferenzen
- Kontakte mit Immobilien verknüpfen

**Custom Attributes** (Beispiele):
```json
{
  "contact_id": "contact_123",
  "custom_attributes": {
    "interested_property_type": "apartment",
    "budget_max": "500000",
    "preferred_city": "Leipzig",
    "rooms_min": "3",
    "viewing_date": "2024-12-15"
  }
}
```

### 5. Templates (WhatsApp)
**Use Case**: Vordefinierte Nachrichten-Templates für WhatsApp Business

**Template-Kategorien**:
- **Utility**: Terminbestätigungen, Erinnerungen
- **Marketing**: Neue Immobilien-Angebote (mit Opt-in)

**Template-Beispiel**:
```
Name: immobilien_besichtigung
Category: UTILITY
Language: de

Body:
Hallo {{1}},

Ihre Besichtigung für {{2}} ist bestätigt für:
📅 {{3}}
📍 {{4}}

Bei Fragen erreichen Sie uns unter {{5}}.

Viele Grüße,
Ihr Immobilien-Team
```

### 6. Labels
**Use Cases**:
- Conversations kategorisieren (z.B. "Kaufinteresse", "Mietinteresse", "Besichtigung geplant")
- Prioritäten setzen (z.B. "Heiß", "Warm", "Kalt")
- Status tracken (z.B. "Offen", "In Bearbeitung", "Abgeschlossen")

## Integration Plan

### Phase 1: Webhook Integration
1. **Webhook-Endpoint erstellen** (`/api/webhooks/superchat`)
   - Eingehende Nachrichten empfangen
   - Contact-Informationen extrahieren
   - In Datenbank speichern (neue Tabelle: `inquiries`)

2. **Benachrichtigungen**
   - E-Mail an Eigentümer/Makler bei neuer Anfrage (via Brevo)
   - In-App-Benachrichtigung im Dashboard

### Phase 2: Outbound Messaging
1. **Automatische Antworten**
   - Bestätigungsnachricht nach Kontaktformular
   - Besichtigungstermin-Bestätigung
   - Follow-up nach Besichtigung

2. **Manuelle Nachrichten**
   - UI im Dashboard zum Senden von Nachrichten
   - Conversation-History anzeigen
   - Quick-Replies für häufige Antworten

### Phase 3: Advanced Features
1. **WhatsApp Templates**
   - Templates für verschiedene Szenarien erstellen
   - Template-basierte Nachrichten senden

2. **Contact Management**
   - Interessenten-Profile mit Custom Attributes
   - Segmentierung nach Präferenzen
   - Lead-Scoring

3. **Automation**
   - Automatische Follow-ups
   - Drip Campaigns
   - Re-Engagement

## Database Schema Extensions

### New Table: `inquiries`
```sql
CREATE TABLE inquiries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  property_id INT,  -- Foreign key to properties table
  contact_id VARCHAR(255),  -- Superchat contact ID
  conversation_id VARCHAR(255),  -- Superchat conversation ID
  message_id VARCHAR(255),  -- Superchat message ID
  channel VARCHAR(50),  -- whatsapp, facebook, email, etc.
  contact_name VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_email VARCHAR(255),
  message_text TEXT,
  status ENUM('new', 'in_progress', 'replied', 'closed') DEFAULT 'new',
  assigned_to INT,  -- User ID of assigned agent
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (property_id) REFERENCES properties(id),
  INDEX idx_property (property_id),
  INDEX idx_contact (contact_id),
  INDEX idx_status (status)
);
```

### Extend `properties` table:
```sql
ALTER TABLE properties ADD COLUMN superchat_channel_id VARCHAR(255);
```

## Authentication
**Method**: API Key in header
- Header: `X-API-KEY: your_superchat_api_key`

**Note**: Superchat API key needs to be added to secrets (not currently in ENV).

## Rate Limiting
- Check Superchat documentation for current limits
- Implement retry logic with exponential backoff

## Next Steps
1. Add Superchat API key to secrets
2. Create `inquiries` table in database
3. Implement webhook endpoint for incoming messages
4. Create tRPC mutations for sending messages
5. Build UI for conversation management
6. Set up WhatsApp Business templates
7. Implement automated workflows

## Important Notes
- **WhatsApp Business API**: Requires approved templates for initial contact (24h window rule)
- **GDPR Compliance**: Store consent for messaging, provide opt-out mechanism
- **Message Templates**: Need to be approved by Meta before use
- **Webhook Security**: Verify webhook signatures to prevent spoofing
