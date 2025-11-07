# ImmoScout24 API Reference

## Overview
The Import/Export API allows creating, changing, deleting, and publishing real estate objects.

## Key Points
- Contact person, multimedia attachments, and publishing are separate endpoints
- Don't support GMT params in date fields
- Need correct geocodes for visibility (use Geo Services APIs)

## Separate Endpoints
1. **CONTACT ADDRESS**: create/change/call/delete contact data
2. **ATTACHMENT**: create/change/call/delete multimedia attachments (pictures, videos, PDFs, URLs)
3. **PUBLISHCHANNEL**: List of publish channels the realtor is entitled to publish in

## Real Estate Types

### Wohnung Miete (apartmentRent)
Key fields:
- externalId: String (50 chars, "/" and "\\" allowed)
- title: String (Max 100 chars) *required
- street, houseNumber, postcode, city: *required
- showAddress: boolean *required
- baseRent: double *required (0 = "Preis auf Anfrage")
- apartmentType: enum (ROOF_STOREY, LOFT, MAISONETTE, PENTHOUSE, etc.)
- floor: int (0-999)
- condition: enum (NO_INFORMATION, FIRST_TIME_USE, MINT_CONDITION, REFURBISHED, MODERNIZED, etc.)
- constructionYear: int (0-9999)
- lastRefurbishment: String (1000-9999)
- interiorQuality: enum (NO_INFORMATION, LUXURY, SOPHISTICATED, NORMAL, SIMPLE)
- freeFrom: String (Max 50 chars)
- heatingType: enum
- thermalCharacteristic: double (0-9999.99) - energy consumption value
- BuildingEnergyRatingType: enum (NO_INFORMATION, ENERGY_REQUIRED, ENERGY_CONSUMPTION)
- numberOfFloors: int (0-999)
- usableFloorSpace: double
- numberOfBedRooms, numberOfBathRooms: double
- parkingSpaceType: enum (NO_INFORMATION, GARAGE, OUTSIDE, CARPORT, etc.)
- totalRent, serviceCharge, deposit, heatingCosts: double
- petsAllowed: enum (NO_INFORMATION, YES, NO, NEGOTIABLE)

### Haus Kauf (houseBuy)
Similar structure with buy-specific fields:
- price: double *required (purchase price)
- marketingType: PURCHASE
- houseType: enum (BUNGALOW, MID_TERRACE_HOUSE, MULTI_FAMILY_HOUSE, etc.)
- plotArea: double (land size)

### Common Fields Across Types
- externalId: Unique identifier from external system
- title: Property title/headline
- descriptionNote, furnishingNote, locationNote, otherNote: Text descriptions
- contact: Reference to contact person
- Energy certificate fields (thermalCharacteristic, BuildingEnergyRatingType, etc.)
- Condition, quality, features

## Important Enums

### Condition
- NO_INFORMATION
- FIRST_TIME_USE (Erstbezug)
- FIRST_TIME_USE_AFTER_REFURBISHMENT
- MINT_CONDITION (Neuwertig)
- REFURBISHED (Saniert)
- MODERNIZED (Modernisiert)
- FULLY_RENOVATED
- WELL_KEPT (Gepflegt)
- NEED_OF_RENOVATION
- NEGOTIABLE
- RIPE_FOR_DEMOLITION

### Interior Quality
- NO_INFORMATION
- LUXURY
- SOPHISTICATED
- NORMAL
- SIMPLE

### Parking Space Type
- NO_INFORMATION
- GARAGE
- OUTSIDE
- CARPORT
- DUPLEX
- CAR_PARK
- UNDERGROUND_GARAGE

## Data Mapping Notes
Our schema → ImmoScout24:
- title → title
- street, houseNumber, postalCode, city → street, houseNumber, postcode, city
- price → baseRent (for rent) or price (for buy)
- livingSpace → usableFloorSpace
- rooms → numberOfRooms (implied)
- bedrooms → numberOfBedRooms
- bathrooms → numberOfBathRooms
- buildYear → constructionYear
- condition → condition (need to map German values to enum)
- availableFrom → freeFrom
- parkingSpaces → numberOfParkingSpaces
- parkingType → parkingSpaceType

## Next Steps for Integration
1. Extend database schema with ImmoScout24-specific fields (externalId, etc.)
2. Create mapping logic between our schema and ImmoScout24 API
3. Implement OAuth authentication for ImmoScout24 API
4. Create sync endpoint to push properties to ImmoScout24
5. Handle responses and error cases
