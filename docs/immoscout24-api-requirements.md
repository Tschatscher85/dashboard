# ImmoScout24 API Integration Requirements

## Authentication (OAuth 1.0a - Three-Legged)

### Required Credentials
- **Consumer Key** (Client Key)
- **Consumer Secret** (Client Secret)
- **Access Token** (per user)
- **Access Token Secret** (per user)

### OAuth Flow
1. Get temporary **request token** from `/restapi/security/oauth/request_token`
2. Redirect user to **authorization URL** `/restapi/security/oauth/confirm_access?oauth_token={token}`
3. User authorizes → callback with **verification code**
4. Exchange request token + verifier for **access token** at `/restapi/security/oauth/access_token`
5. Use access token for all API requests

**Important:** Each access token belongs to exactly ONE user (must manage per-user tokens)

### Endpoints
- **Sandbox:** `https://rest.sandbox-immobilienscout24.de`
- **Production:** `https://rest.immobilienscout24.de`

## API Endpoints (Real Estate)

### Base Path
`/restapi/api/offer/v1.0/user/me/realestate/`

### Operations
1. **Insert Real Estate** - POST to create new property
2. **Update Real Estate** - PUT to update existing property
3. **Delete Real Estate** - DELETE to remove property
4. **Retrieve Real Estate** - GET single property
5. **List Real Estates** - GET all properties for user
6. **Publish** - Publish property to portals
7. **Unpublish** - Remove property from portals

### Multimedia Attachments
- **Upload Images** - Attach images to real estate objects
- **Delete Images** - Remove images from real estate objects
- **Reorder Images** - Change image order

## Required Database Fields

### Core Fields (Already Implemented)
- ✅ `title` - Property title
- ✅ `address` - Full address
- ✅ `price` - Price in EUR
- ✅ `livingSpace` - Living area in m²
- ✅ `numberOfRooms` - Room count
- ✅ `propertyType` - Type (apartment, house, etc.)
- ✅ `marketingType` - RENT or BUY

### IS24-Specific Fields (Need to Add)
- ❌ `externalId` - Unique ID in IS24 system (returned after creation)
- ❌ `is24PublishStatus` - Status: draft, published, unpublished
- ❌ `is24LastSyncedAt` - Last sync timestamp
- ❌ `is24ContactId` - Contact person ID in IS24
- ❌ `is24GroupNumber` - Group number for property organization

### Property Details (Need to Verify/Add)
- `interiorQuality` - SIMPLE, NORMAL, SOPHISTICATED, LUXURY
- `condition` - FIRST_TIME_USE, MINT_CONDITION, REFURBISHED, etc.
- `heatingType` - CENTRAL_HEATING, FLOOR_HEATING, etc.
- `energyCertificateType` - ENERGY_REQUIRED, ENERGY_CONSUMPTION
- `energyEfficiencyClass` - A+, A, B, C, D, E, F, G, H
- `yearConstructed` - Construction year
- `freeFrom` - Available from date
- `numberOfBathrooms` - Bathroom count
- `numberOfBedrooms` - Bedroom count
- `plotArea` - Plot size in m²
- `balcony` - Boolean
- `garden` - Boolean
- `guestToilet` - Boolean
- `cellar` - Boolean

### Rental-Specific Fields (Already Implemented)
- ✅ `baseRent` - Base rent
- ✅ `totalRent` - Total rent
- ✅ `deposit` - Security deposit
- ✅ `serviceCharge` - Service charges
- ✅ `heatingCosts` - Heating costs
- ✅ `petsAllowed` - Pets allowed

## Settings Configuration Required

### API Credentials Section
```typescript
{
  is24ConsumerKey: string;
  is24ConsumerSecret: string;
  is24AccessToken: string;
  is24AccessTokenSecret: string;
  is24UseSandbox: boolean;
}
```

### OAuth Callback URL
- Must be configured in IS24 developer account
- Example: `https://your-app.manus.space/api/oauth/is24/callback`

## Backend Endpoints to Create

### 1. OAuth Flow
- `POST /api/is24/auth/init` - Initialize OAuth flow
- `GET /api/oauth/is24/callback` - Handle OAuth callback
- `POST /api/is24/auth/refresh` - Refresh access token (if needed)

### 2. Real Estate Operations
- `POST /api/is24/properties/publish` - Publish property to IS24
- `PUT /api/is24/properties/:id/update` - Update IS24 property
- `DELETE /api/is24/properties/:id/unpublish` - Unpublish from IS24
- `GET /api/is24/properties/:id/status` - Get publish status
- `POST /api/is24/properties/:id/images` - Upload images to IS24

### 3. Sync Operations
- `POST /api/is24/properties/:id/sync` - Full sync (data + images)
- `GET /api/is24/properties/:id/report` - Get ScoutReport stats

## UI Components to Update

### 1. Settings Page
- Add IS24 API credentials section
- OAuth authorization button
- Connection test button
- Sandbox/Production toggle

### 2. Property Detail Page (Right Column)
- Display IS24 publish status (badge)
- Show IS24 external ID
- Show last sync timestamp
- Action buttons:
  - **Veröffentlichen** (Publish) - Green
  - **Aktualisieren** (Update) - Blue
  - **Deaktivieren** (Unpublish) - Yellow
- Show sync progress/errors

### 3. Property Form
- Add IS24-specific fields section
- Mark required fields for IS24 export
- Validation for IS24 requirements

## Data Mapping Strategy

### Property Type Mapping
```typescript
// Our types → IS24 types
{
  "wohnung": "APARTMENT",
  "haus": "HOUSE",
  "grundstueck": "PLOT",
  "gewerbe": "OFFICE"
}
```

### Marketing Type Mapping
```typescript
{
  "verkauf": "BUY",
  "vermietung": "RENT"
}
```

### Status Mapping
```typescript
{
  "verfuegbar": "ACTIVE",
  "reserviert": "RESERVED",
  "verkauft": "INACTIVE"
}
```

## Implementation Priority

### Phase 1: Infrastructure (Current)
1. ✅ Database schema extension
2. ✅ Settings page for credentials
3. ✅ Backend endpoint placeholders
4. ✅ UI field additions

### Phase 2: OAuth Integration (Next)
1. OAuth flow implementation
2. Token storage and management
3. Callback handling
4. Token refresh logic

### Phase 3: Core API Operations (Final)
1. Publish property to IS24
2. Update property on IS24
3. Unpublish property
4. Image upload to IS24
5. Status synchronization
6. Error handling and retry logic

## Notes
- IS24 uses OAuth 1.0a (NOT OAuth 2.0!)
- Each user needs their own access token
- Sandbox available for testing
- Rate limiting applies (check documentation)
- Images must be uploaded separately after property creation
