/**
 * Field Mapping for Property Updates
 * 
 * This file maps field names from the tRPC router to the actual database schema.
 * The router uses user-friendly field names, while the database uses different names.
 * 
 * Problem: When the router sends `price: 135000`, but the database expects `purchasePrice`,
 * Drizzle ORM silently ignores the unknown field, resulting in no data being saved.
 * 
 * Solution: This mapping function translates router field names to database field names.
 */

export interface RouterPropertyData {
  // Fields that need mapping
  price?: number | null;
  coldRent?: number | null;
  warmRent?: number | null;
  balconyArea?: number | null;
  parkingCount?: number | null;
  flooringTypes?: string | null;
  heatingIncludedInAdditional?: boolean | null;
  monthlyRentalIncome?: number | null;
  
  // Fields that match the schema (no mapping needed)
  [key: string]: any;
}

export interface SchemaPropertyData {
  purchasePrice?: number | null;
  baseRent?: number | null;
  totalRent?: number | null;
  balconyTerraceArea?: number | null;
  parkingSpaces?: number | null;
  flooring?: string | null;
  heatingCostsInServiceCharge?: boolean | null;
  rentalIncome?: number | null;
  
  [key: string]: any;
}

/**
 * Maps router field names to database schema field names
 */
export function mapRouterFieldsToSchema(routerData: RouterPropertyData): SchemaPropertyData {
  const mapped: any = { ...routerData };
  
  // Critical field mappings (these are the ones causing data loss!)
  const fieldMappings: Record<string, string> = {
    // Price fields
    'price': 'purchasePrice',
    'coldRent': 'baseRent',
    'warmRent': 'totalRent',
    
    // Area fields
    'balconyArea': 'balconyTerraceArea',
    
    // Parking
    'parkingCount': 'parkingSpaces',
    
    // Features
    'flooringTypes': 'flooring',
    'heatingIncludedInAdditional': 'heatingCostsInServiceCharge',
    
    // Investment
    'monthlyRentalIncome': 'rentalIncome',
  };
  
  // Apply mappings
  for (const [routerField, schemaField] of Object.entries(fieldMappings)) {
    if (routerField in mapped) {
      mapped[schemaField] = mapped[routerField];
      delete mapped[routerField];
    }
  }
  
  // Remove fields that don't exist in the schema (to avoid confusion in logs)
  // Note: All previously missing fields have been added to the schema!
  const fieldsNotInSchema: string[] = [
    // No fields should be in this list anymore after schema update
  ];
  
  // Log fields that will be ignored (for debugging)
  const ignoredFields: string[] = [];
  for (const field of fieldsNotInSchema) {
    if (field in mapped) {
      ignoredFields.push(field);
      delete mapped[field];
    }
  }
  
  if (ignoredFields.length > 0) {
    console.log('[Field Mapping] Ignoring fields not in schema:', ignoredFields);
  }
  
  return mapped;
}

/**
 * Validates that all fields in the data object exist in the database schema
 * Returns a list of unknown fields
 */
export function validateSchemaFields(data: any): string[] {
  const validSchemaFields = [
    'id', 'title', 'headline', 'description', 'descriptionObject', 'descriptionHighlights',
    'descriptionLocation', 'descriptionFazit', 'descriptionCTA', 'propertyType', 'subType',
    'marketingType', 'status', 'street', 'houseNumber', 'zipCode', 'city', 'region', 'country',
    'latitude', 'longitude', 'livingArea', 'usableArea', 'plotArea', 'rooms', 'bedrooms',
    'bathrooms', 'floors', 'floor', 'condition', 'yearBuilt', 'lastModernization',
    'hasBalcony', 'hasTerrace', 'hasGarden', 'hasElevator', 'hasBasement', 'hasGarage',
    'hasGuestToilet', 'hasBuiltInKitchen', 'balconyTerraceArea', 'gardenArea',
    'parkingSpaces', 'parkingType', 'parkingPrice', 'furnishingQuality', 'flooring',
    'hasStorageRoom', 'baseRent', 'additionalCosts', 'heatingCosts', 'totalRent', 'deposit',
    'heatingCostsInServiceCharge', 'purchasePrice', 'priceOnRequest', 'priceByNegotiation',
    'buyerCommission', 'rentalIncome', 'isRented', 'energyCertificateAvailability',
    'energyCertificateCreationDate', 'energyCertificateType', 'energyConsumption',
    'energyConsumptionElectricity', 'energyConsumptionHeat', 'co2Emissions', 'energyClass',
    'energyCertificateIssueDate', 'energyCertificateValidUntil', 'includesWarmWater',
    'heatingType', 'mainEnergySource', 'buildingYearUnknown', 'supervisorId', 'ownerId',
    'buyerId', 'notaryId', 'propertyManagementId', 'tenantId', 'linkedContactIds',
    'districtCourt', 'courtName', 'courtCity', 'landRegisterNumber', 'landRegisterSheet',
    'landRegisterOf', 'cadastralDistrict', 'corridor', 'parcel', 'parcelNumber',
    'plotNumber', 'developmentStatus', 'siteArea', 'assignmentType', 'assignmentDuration',
    'assignmentFrom', 'assignmentTo', 'internalCommissionPercent', 'internalCommissionType',
    'externalCommissionInternalPercent', 'externalCommissionInternalType', 'totalCommission',
    'externalCommissionForExpose', 'commissionNote', 'autoSendToPortals', 'hideStreetOnPortals',
    'category', 'floorLevel', 'totalFloors', 'nonRecoverableCosts', 'houseMoney', 'maintenanceReserve',
    'isBarrierFree', 'hasLoggia', 'isMonument', 'suitableAsHoliday', 'hasFireplace', 'hasPool',
    'hasSauna', 'hasAlarm', 'hasWinterGarden', 'hasAirConditioning', 'hasParking', 'bathroomFeatures',
    'heatingSystemYear', 'buildingPhase', 'equipmentQuality', 'availableFrom', 'ownerType',
    'walkingTimeToPublicTransport', 'distanceToPublicTransport', 'drivingTimeToHighway', 'distanceToHighway',
    'drivingTimeToMainStation', 'distanceToMainStation', 'drivingTimeToAirport', 'distanceToAirport',
    'landingPageSlug', 'landingPagePublished', 'warningNote', 'isArchived', 'internalNotes',
    'createdAt', 'updatedAt'
  ];
  
  const unknownFields: string[] = [];
  for (const field of Object.keys(data)) {
    if (!validSchemaFields.includes(field)) {
      unknownFields.push(field);
    }
  }
  
  return unknownFields;
}
