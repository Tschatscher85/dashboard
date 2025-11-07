# API Integration Guide - Immobilien-Verwaltung

This document provides a comprehensive guide for integrating the Immobilien-Verwaltung platform with external systems.

## Table of Contents

1. [Property-Sync API](#property-sync-api)
2. [Brevo Email Integration](#brevo-email-integration)
3. [Superchat Multi-Channel Messaging](#superchat-multi-channel-messaging)
4. [Database Schema](#database-schema)

---

## Property-Sync API

The Property-Sync API allows external systems (e.g., your homepage, ImmoScout24) to synchronize property data with the Immobilien-Verwaltung platform.

### Endpoint

```
POST https://your-domain.manus.space/api/trpc/properties.sync
```

### Authentication

The endpoint requires an API key for authentication. The API key should be sent in the request body.

**Default API Key** (for testing): `mein-geheimer-sync-key-2024`

**Production**: Set the `PROPERTY_SYNC_API_KEY` environment variable to your custom API key.

### Request Format

The endpoint uses tRPC, so the request must follow the tRPC format:

```json
{
  "apiKey": "your-api-key-here",
  "properties": [
    {
      "externalId": "homepage-property-123",
      "title": "Moderne 3-Zimmer-Wohnung in Leipzig",
      "description": "Schöne Wohnung mit Balkon...",
      "propertyType": "apartment",
      "status": "marketing",
      "price": 450000,
      "priceType": "kaufpreis",
      "street": "Hauptstraße",
      "houseNumber": "42",
      "postalCode": "04109",
      "city": "Leipzig",
      "state": "Sachsen",
      "country": "Deutschland",
      "livingSpace": 85.5,
      "plotSize": 0,
      "rooms": 3,
      "bedrooms": 2,
      "bathrooms": 1,
      "buildYear": 2010,
      "features": "[\"Balkon\", \"Einbauküche\", \"Aufzug\"]",
      "images": "[\"https://example.com/image1.jpg\", \"https://example.com/image2.jpg\"]"
    }
  ]
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `externalId` | string | Yes | Unique identifier from external system |
| `title` | string | Yes | Property title |
| `description` | string | No | Detailed property description |
| `propertyType` | enum | Yes | One of: `apartment`, `house`, `commercial`, `land`, `parking`, `other` |
| `status` | enum | No | One of: `acquisition`, `preparation`, `marketing`, `reserved`, `sold`, `rented`, `inactive` |
| `price` | number | No | Property price in EUR |
| `priceType` | string | No | `kaufpreis`, `miete`, or `pacht` |
| `street` | string | No | Street name |
| `houseNumber` | string | No | House number |
| `postalCode` | string | No | Postal code |
| `city` | string | No | City name |
| `state` | string | No | State/region |
| `country` | string | No | Country (default: Deutschland) |
| `livingSpace` | number | No | Living area in m² |
| `plotSize` | number | No | Plot size in m² |
| `rooms` | number | No | Total number of rooms |
| `bedrooms` | number | No | Number of bedrooms |
| `bathrooms` | number | No | Number of bathrooms |
| `buildYear` | number | No | Year of construction |
| `features` | string | No | JSON array of features as string |
| `images` | string | No | JSON array of image URLs as string |

### Response Format

```json
{
  "success": true,
  "synced": 1,
  "failed": 0,
  "message": "1 properties synced successfully",
  "results": [
    {
      "externalId": "homepage-property-123",
      "success": true,
      "created": true,
      "id": 42
    }
  ]
}
```

### Behavior

- **Upsert Logic**: If a property with the same `externalId` exists, it will be updated. Otherwise, a new property will be created.
- **Sync Tracking**: The system tracks `syncSource`, `lastSyncedAt`, and `externalId` for each synced property.
- **Feature Mapping**: Features in the JSON array are automatically mapped to boolean fields (e.g., "Balkon" → `hasBalcony: true`).

### Example: Sync from Homepage

```javascript
const response = await fetch('https://your-domain.manus.space/api/trpc/properties.sync', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    apiKey: 'mein-geheimer-sync-key-2024',
    properties: [
      {
        externalId: 'homepage-123',
        title: 'Traumhaus in München',
        propertyType: 'house',
        price: 850000,
        priceType: 'kaufpreis',
        city: 'München',
        livingSpace: 150,
        rooms: 5,
        features: '["Garten", "Garage", "Balkon"]',
      },
    ],
  }),
});

const result = await response.json();
console.log(result);
```

---

## Brevo Email Integration

The platform integrates with Brevo (formerly Sendinblue) for transactional emails and contact management.

### Configuration

Set the `BREVO_API_KEY` environment variable with your Brevo API key.

**Get your API key**: https://app.brevo.com/settings/keys/api

### Available Email Functions

#### 1. Send Inquiry Notification

Sends an email notification to the admin when a new inquiry is received.

**tRPC Endpoint**: `brevo.sendInquiryNotification`

```typescript
await trpc.brevo.sendInquiryNotification.mutate({
  inquiryId: 123,
  adminEmail: 'info@immo-jaeger.eu',
});
```

#### 2. Send Appointment Confirmation

Sends an appointment confirmation email to a contact.

**tRPC Endpoint**: `brevo.sendAppointmentConfirmation`

```typescript
await trpc.brevo.sendAppointmentConfirmation.mutate({
  contactEmail: 'kunde@example.com',
  contactName: 'Max Mustermann',
  appointmentDate: '15.12.2024',
  appointmentTime: '14:00 Uhr',
  propertyId: 42, // Optional
  notes: 'Bitte Personalausweis mitbringen', // Optional
});
```

#### 3. Send Follow-Up Email

Sends a custom follow-up email to a contact.

**tRPC Endpoint**: `brevo.sendFollowUpEmail`

```typescript
await trpc.brevo.sendFollowUpEmail.mutate({
  contactEmail: 'kunde@example.com',
  contactName: 'Max Mustermann',
  subject: 'Ihre Immobilienanfrage',
  message: 'Sehr geehrter Herr Mustermann,\n\nvielen Dank für Ihr Interesse...',
  propertyId: 42, // Optional
});
```

#### 4. Sync Contact to Brevo

Syncs a contact from the database to Brevo CRM.

**tRPC Endpoint**: `brevo.syncContact`

```typescript
await trpc.brevo.syncContact.mutate({
  contactId: 123,
});
```

#### 5. Sync Lead to Brevo

Syncs a lead to Brevo's "Immobilienanfrage" list.

**tRPC Endpoint**: `brevo.syncLead`

```typescript
await trpc.brevo.syncLead.mutate({
  leadId: 456,
});
```

### Email Templates

All emails use HTML templates with the Immo-Jaeger branding. The sender is configured as:

```
Name: Immo-Jaeger
Email: noreply@immo-jaeger.eu
```

### Brevo Lists

The integration uses two predefined Brevo lists:

1. **Immobilienanfrage** - For property inquiries
2. **Eigentümeranfrage** - For owner inquiries

Make sure these lists exist in your Brevo account before using the sync features.

---

## Superchat Multi-Channel Messaging

Superchat integration enables multi-channel communication via WhatsApp, Facebook Messenger, Instagram, Telegram, Email, and more.

### Configuration

1. Set the `SUPERCHAT_API_KEY` environment variable
2. Configure your Superchat webhook URL in the Superchat dashboard:
   ```
   https://your-domain.manus.space/api/webhooks/superchat
   ```

### Webhook Endpoint

**Endpoint**: `POST /api/webhooks/superchat`

**Purpose**: Receives incoming messages from all connected channels.

**Webhook Payload** (from Superchat):

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

**Behavior**:
- Creates an inquiry record in the database
- Sends email notification to admin (if contact email is available)
- Tracks channel, contact info, and message content

### Sending Messages

#### Send Text Message

**tRPC Endpoint**: `inquiries.sendReply`

```typescript
await trpc.inquiries.sendReply.mutate({
  inquiryId: 123,
  channelId: 'your-superchat-channel-id',
  message: 'Vielen Dank für Ihre Anfrage. Wir melden uns in Kürze bei Ihnen.',
});
```

This endpoint:
1. Retrieves the inquiry details
2. Determines the recipient identifier (phone, email, or contact ID)
3. Sends the message via Superchat
4. Updates the inquiry status to "replied"
5. Tracks response count and timestamps

### Inquiry Management

#### List Inquiries

```typescript
const inquiries = await trpc.inquiries.list.useQuery({
  status: 'new', // Optional: filter by status
  channel: 'whatsapp', // Optional: filter by channel
  propertyId: 42, // Optional: filter by property
});
```

#### Get Inquiry Details

```typescript
const inquiry = await trpc.inquiries.getById.useQuery({ id: 123 });
```

#### Update Inquiry

```typescript
await trpc.inquiries.update.mutate({
  id: 123,
  data: {
    status: 'in_progress',
    assignedTo: 1, // User ID
  },
});
```

### Supported Channels

- `whatsapp` - WhatsApp Business
- `facebook` - Facebook Messenger
- `instagram` - Instagram Direct
- `telegram` - Telegram
- `email` - Email
- `phone` - Phone calls
- `form` - Web forms
- `other` - Other channels

### Inquiry Status Workflow

1. **new** - Newly received inquiry
2. **in_progress** - Being handled by an agent
3. **replied** - Reply sent to contact
4. **closed** - Inquiry resolved

---

## Database Schema

### Properties Table Extensions

The following fields have been added to support API integrations:

```sql
-- Sync tracking
externalId VARCHAR(255) UNIQUE  -- External system's unique ID
syncSource VARCHAR(100)          -- Source system (e.g., 'homepage', 'immoscout24')
lastSyncedAt TIMESTAMP           -- Last sync timestamp

-- Rental-specific fields
petsAllowed BOOLEAN              -- Are pets allowed?
```

### Inquiries Table

New table for tracking multi-channel inquiries:

```sql
CREATE TABLE inquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Relations
  propertyId INT,                -- Linked property (nullable)
  contactId INT,                 -- Linked contact (nullable)
  
  -- Channel information
  channel ENUM('whatsapp', 'facebook', 'instagram', 'telegram', 'email', 'phone', 'form', 'other'),
  
  -- Superchat integration
  superchatContactId VARCHAR(255),      -- Superchat contact ID
  superchatConversationId VARCHAR(255), -- Superchat conversation ID
  superchatMessageId VARCHAR(255),      -- Superchat message ID
  
  -- Contact information
  contactName VARCHAR(255),
  contactPhone VARCHAR(50),
  contactEmail VARCHAR(320),
  
  -- Message content
  subject VARCHAR(500),
  messageText TEXT,
  
  -- Status and assignment
  status ENUM('new', 'in_progress', 'replied', 'closed') DEFAULT 'new',
  assignedTo INT,                -- User ID of assigned agent
  
  -- Response tracking
  firstResponseAt TIMESTAMP,
  lastResponseAt TIMESTAMP,
  responseCount INT DEFAULT 0,
  
  -- Metadata
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## Testing the Integrations

### 1. Test Property-Sync API

```bash
curl -X POST https://your-domain.manus.space/api/trpc/properties.sync \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "mein-geheimer-sync-key-2024",
    "properties": [{
      "externalId": "test-123",
      "title": "Test Property",
      "propertyType": "apartment",
      "price": 300000,
      "city": "Leipzig"
    }]
  }'
```

### 2. Test Brevo Email

Use the admin dashboard to:
1. Create a test inquiry
2. Click "Send Email Notification"
3. Check your email inbox

### 3. Test Superchat Webhook

1. Configure webhook URL in Superchat dashboard
2. Send a test message from WhatsApp/Facebook
3. Check the inquiries list in the admin dashboard

---

## Security Considerations

1. **API Keys**: Store all API keys in environment variables, never in code
2. **Webhook Signature**: Implement signature verification for production webhooks
3. **Rate Limiting**: Consider adding rate limiting to public endpoints
4. **Input Validation**: All inputs are validated using Zod schemas
5. **SQL Injection**: Using Drizzle ORM prevents SQL injection attacks

---

## Support

For questions or issues:
- Email: info@immo-jaeger.eu
- Documentation: See `/docs` folder for API reference files

---

## Changelog

### 2024-11-07
- Initial release of API integrations
- Property-Sync API endpoint
- Brevo email integration
- Superchat webhook handler
- Inquiries management system
