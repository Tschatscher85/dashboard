// Extract all field names from the tRPC router update schema
const routerFields = [
  "title", "description", "category", "propertyType", "subType", "marketingType", "status",
  "street", "houseNumber", "zipCode", "city", "region", "country", "latitude", "longitude",
  "hideStreetOnPortals", "districtCourt", "landRegisterSheet", "landRegisterOf", 
  "cadastralDistrict", "corridor", "parcel", "livingArea", "plotArea", "usableArea",
  "balconyArea", "gardenArea", "rooms", "bedrooms", "bathrooms", "floor", "floorLevel",
  "totalFloors", "price", "priceOnRequest", "priceByNegotiation", "coldRent", "warmRent",
  "additionalCosts", "heatingCosts", "heatingIncludedInAdditional", "nonRecoverableCosts",
  "houseMoney", "maintenanceReserve", "parkingPrice", "monthlyRentalIncome", "deposit",
  "hasElevator", "isBarrierFree", "hasBasement", "hasGuestToilet", "hasBuiltInKitchen",
  "hasBalcony", "hasTerrace", "hasLoggia", "hasGarden", "isMonument", "suitableAsHoliday",
  "hasStorageRoom", "hasFireplace", "hasPool", "hasSauna", "hasAlarm", "hasWinterGarden",
  "hasAirConditioning", "hasParking", "parkingCount", "parkingType", "bathroomFeatures",
  "flooringTypes", "energyCertificateAvailability", "energyCertificateCreationDate",
  "energyCertificateIssueDate", "energyCertificateValidUntil", "energyCertificateType",
  "energyClass", "energyConsumption", "energyConsumptionElectricity", "energyConsumptionHeat",
  "co2Emissions", "includesWarmWater", "heatingType", "mainEnergySource", "buildingYearUnknown",
  "heatingSystemYear", "yearBuilt", "lastModernization", "condition", "buildingPhase",
  "equipmentQuality", "isRented", "availableFrom", "supervisorId", "ownerId", "ownerType",
  "buyerId", "notaryId", "propertyManagementId", "tenantId", "assignmentType",
  "assignmentDuration", "assignmentFrom", "assignmentTo", "internalCommissionPercent",
  "internalCommissionType", "externalCommissionInternalPercent", "externalCommissionInternalType",
  "totalCommission", "externalCommissionForExpose", "commissionNote",
  "walkingTimeToPublicTransport", "distanceToPublicTransport", "drivingTimeToHighway",
  "distanceToHighway", "drivingTimeToMainStation", "distanceToMainStation",
  "drivingTimeToAirport", "distanceToAirport", "landingPageSlug", "landingPagePublished",
  "headline", "descriptionHighlights", "descriptionLocation", "descriptionFazit",
  "descriptionCTA", "linkedContactIds"
];

// Schema field names (from reading the schema)
const schemaFields = [
  "id", "title", "headline", "description", "descriptionObject", "descriptionHighlights",
  "descriptionLocation", "descriptionFazit", "descriptionCTA", "propertyType", "subType",
  "marketingType", "status", "street", "houseNumber", "zipCode", "city", "region", "country",
  "latitude", "longitude", "livingArea", "usableArea", "plotArea", "rooms", "bedrooms",
  "bathrooms", "floors", "floor", "condition", "yearBuilt", "lastModernization",
  "hasBalcony", "hasTerrace", "hasGarden", "hasElevator", "hasBasement", "hasGarage",
  "hasGuestToilet", "hasBuiltInKitchen", "balconyTerraceArea", "gardenArea",
  "parkingSpaces", "parkingType", "parkingPrice", "furnishingQuality", "flooring",
  "hasStorageRoom", "baseRent", "additionalCosts", "heatingCosts", "totalRent", "deposit",
  "heatingCostsInServiceCharge", "purchasePrice", "priceOnRequest", "priceByNegotiation",
  "buyerCommission", "rentalIncome", "isRented", "energyCertificateAvailability",
  "energyCertificateCreationDate", "energyCertificateType", "energyConsumption",
  "energyConsumptionElectricity", "energyConsumptionHeat", "co2Emissions", "energyClass",
  "energyCertificateIssueDate", "energyCertificateValidUntil", "includesWarmWater",
  "heatingType", "mainEnergySource", "buildingYearUnknown", "supervisorId", "ownerId",
  "buyerId", "notaryId", "propertyManagementId", "tenantId", "linkedContactIds",
  "districtCourt", "courtName", "courtCity", "landRegisterNumber", "landRegisterSheet",
  "landRegisterOf", "cadastralDistrict", "corridor", "parcel", "parcelNumber",
  "plotNumber", "developmentStatus", "siteArea", "assignmentType", "assignmentDuration",
  "assignmentFrom", "assignmentTo", "internalCommissionPercent", "internalCommissionType",
  "externalCommissionInternalPercent", "externalCommissionInternalType", "totalCommission",
  "externalCommissionForExpose"
];

console.log("=== FIELD MISMATCH ANALYSIS ===\n");

// Find fields in router that don't exist in schema
const missingInSchema = routerFields.filter(f => !schemaFields.includes(f));
console.log("❌ Fields in ROUTER but NOT in SCHEMA (will NOT be saved):");
missingInSchema.forEach(f => console.log(`   - ${f}`));

console.log("\n");

// Find fields in schema that don't exist in router
const missingInRouter = schemaFields.filter(f => !routerFields.includes(f) && f !== 'id');
console.log("⚠️  Fields in SCHEMA but NOT in ROUTER (cannot be updated via UI):");
missingInRouter.forEach(f => console.log(`   - ${f}`));

console.log("\n=== CRITICAL MAPPING ISSUES ===");
console.log("Router -> Schema mapping needed:");
console.log("  price -> purchasePrice");
console.log("  coldRent -> baseRent");
console.log("  warmRent -> totalRent");
console.log("  balconyArea -> balconyTerraceArea");
console.log("  parkingCount -> parkingSpaces");
console.log("  flooringTypes -> flooring");
console.log("  heatingIncludedInAdditional -> heatingCostsInServiceCharge");
console.log("  monthlyRentalIncome -> rentalIncome");
console.log("  isBarrierFree -> (missing in schema!)");
console.log("  hasLoggia -> (missing in schema!)");
console.log("  isMonument -> (missing in schema!)");
console.log("  suitableAsHoliday -> (missing in schema!)");
console.log("  hasFireplace -> (missing in schema!)");
console.log("  hasPool -> (missing in schema!)");
console.log("  hasSauna -> (missing in schema!)");
console.log("  hasAlarm -> (missing in schema!)");
console.log("  hasWinterGarden -> (missing in schema!)");
console.log("  hasAirConditioning -> (missing in schema!)");
console.log("  hasParking -> (missing in schema!)");

