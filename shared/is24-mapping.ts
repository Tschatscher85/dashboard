/**
 * ImmoScout24 Data Mapping Utilities
 * 
 * Maps between our internal property data format and ImmoScout24 API format.
 * Includes validation for IS24-required fields.
 */

export type PropertyType = "apartment" | "house" | "commercial" | "land" | "parking" | "other";
export type MarketingType = "sale" | "rent" | "lease";
export type InteriorQuality = "simple" | "normal" | "sophisticated" | "luxury";

/**
 * Map our property type to IS24 property type
 */
export function mapPropertyTypeToIS24(type: PropertyType): string {
  const mapping: Record<PropertyType, string> = {
    apartment: "APARTMENT",
    house: "HOUSE",
    commercial: "OFFICE", // or STORE, INDUSTRY depending on subtype
    land: "PLOT",
    parking: "GARAGE_PARKING",
    other: "APARTMENT", // Default fallback
  };
  return mapping[type] || "APARTMENT";
}

/**
 * Map our marketing type to IS24 marketing type
 */
export function mapMarketingTypeToIS24(type: MarketingType): string {
  const mapping: Record<MarketingType, string> = {
    sale: "BUY",
    rent: "RENT",
    lease: "LEASE",
  };
  return mapping[type] || "RENT";
}

/**
 * Map our interior quality to IS24 interior quality
 */
export function mapInteriorQualityToIS24(quality?: InteriorQuality): string {
  if (!quality) return "NORMAL";
  
  const mapping: Record<InteriorQuality, string> = {
    simple: "SIMPLE",
    normal: "NORMAL",
    sophisticated: "SOPHISTICATED",
    luxury: "LUXURY",
  };
  return mapping[quality] || "NORMAL";
}

/**
 * Map our condition to IS24 condition
 */
export function mapConditionToIS24(condition?: string): string {
  if (!condition) return "WELL_KEPT";
  
  const mapping: Record<string, string> = {
    erstbezug: "FIRST_TIME_USE",
    erstbezug_nach_sanierung: "FIRST_TIME_USE_AFTER_REFURBISHMENT",
    neuwertig: "MINT_CONDITION",
    saniert: "REFURBISHED",
    teilsaniert: "PARTIALLY_REFURBISHED",
    sanierungsbedürftig: "NEED_OF_RENOVATION",
    baufällig: "DILAPIDATED",
    modernisiert: "MODERNIZED",
    vollständig_renoviert: "FULLY_RENOVATED",
    teilweise_renoviert: "PARTIALLY_RENOVATED",
    gepflegt: "WELL_KEPT",
    renovierungsbedürftig: "NEED_OF_RENOVATION",
    nach_vereinbarung: "BY_ARRANGEMENT",
    abbruchreif: "RIPE_FOR_DEMOLITION",
  };
  return mapping[condition] || "WELL_KEPT";
}

/**
 * Validate required fields for IS24 publication
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePropertyForIS24(property: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!property.title || property.title.trim() === "") {
    errors.push("Titel ist erforderlich");
  }

  if (!property.description || property.description.trim() === "") {
    errors.push("Beschreibung ist erforderlich");
  }

  if (!property.propertyType) {
    errors.push("Immobilientyp ist erforderlich");
  }

  if (!property.marketingType) {
    errors.push("Vermarktungsart (Verkauf/Miete) ist erforderlich");
  }

  // Address validation
  if (!property.street || property.street.trim() === "") {
    errors.push("Straße ist erforderlich");
  }

  if (!property.zipCode || property.zipCode.trim() === "") {
    errors.push("PLZ ist erforderlich");
  }

  if (!property.city || property.city.trim() === "") {
    errors.push("Stadt ist erforderlich");
  }

  // Area validation
  if (!property.livingArea || property.livingArea <= 0) {
    errors.push("Wohnfläche ist erforderlich und muss größer als 0 sein");
  }

  // Rooms validation
  if (!property.rooms || property.rooms <= 0) {
    errors.push("Anzahl Zimmer ist erforderlich und muss größer als 0 sein");
  }

  // Price validation
  if (property.marketingType === "sale") {
    if (!property.price || property.price <= 0) {
      errors.push("Kaufpreis ist erforderlich für Verkaufsobjekte");
    }
  } else if (property.marketingType === "rent") {
    if (!property.coldRent || property.coldRent <= 0) {
      errors.push("Kaltmiete ist erforderlich für Mietobjekte");
    }
  }

  // IS24-specific required fields
  if (!property.interiorQuality) {
    warnings.push("Innenausstattung (interiorQuality) wird für IS24 empfohlen");
  }

  // Contact information
  if (!property.is24ContactPerson && !property.is24ContactId) {
    warnings.push("IS24 Ansprechpartner oder Kontakt-ID sollte angegeben werden");
  }

  // Energy certificate (required in Germany for most properties)
  if (!property.energyCertificateAvailability) {
    warnings.push("Energieausweis-Verfügbarkeit sollte angegeben werden");
  }

  if (property.energyCertificateAvailability === "liegt vor") {
    if (!property.energyClass) {
      warnings.push("Energieklasse sollte angegeben werden wenn Energieausweis vorliegt");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert our property data to IS24 API format
 * This is a simplified version - actual implementation will need more fields
 */
export function convertPropertyToIS24Format(property: any): any {
  const is24Property: any = {
    // Basic information
    title: property.title,
    descriptionNote: property.description,
    
    // Property type
    "@xsi.type": mapPropertyTypeToIS24(property.propertyType),
    
    // Marketing type
    marketingType: mapMarketingTypeToIS24(property.marketingType),
    
    // Address
    address: {
      street: property.street,
      houseNumber: property.houseNumber || "",
      postcode: property.zipCode,
      city: property.city,
      quarter: property.region || "",
      country: {
        countryCode: "DEU", // Germany
      },
    },
    
    // Areas
    livingSpace: property.livingArea,
    numberOfRooms: property.rooms,
    numberOfBedRooms: property.numberOfBedrooms || property.bedrooms,
    numberOfBathRooms: property.numberOfBathrooms || property.bathrooms,
    
    // Condition and quality
    condition: mapConditionToIS24(property.condition),
    interiorQuality: mapInteriorQualityToIS24(property.interiorQuality),
    
    // Construction
    constructionYear: property.yearBuilt,
    lastRefurbishment: property.lastModernization,
    
    // Floor information
    floor: property.floor,
    numberOfFloors: property.totalFloors,
    
    // Features
    cellar: property.hasBasement || false,
    balcony: property.hasBalcony || false,
    garden: property.hasGarden || false,
    guestToilet: property.hasGuestToilet || false,
    lift: property.hasElevator || false,
    builtInKitchen: property.hasBuiltInKitchen || false,
    
    // Contact
    ...(property.is24ContactId && { contactId: property.is24ContactId }),
    ...(property.is24GroupNumber && { groupNumber: property.is24GroupNumber }),
  };

  // Add price information based on marketing type
  if (property.marketingType === "sale") {
    is24Property.price = {
      value: Math.round(property.price / 100), // Convert cents to euros
      currency: "EUR",
      marketingType: "PURCHASE",
      priceIntervalType: "ONE_TIME_CHARGE",
    };
  } else if (property.marketingType === "rent") {
    is24Property.price = {
      value: Math.round(property.coldRent / 100), // Convert cents to euros
      currency: "EUR",
      marketingType: "RENT",
      priceIntervalType: "MONTH",
    };
    
    if (property.additionalCosts) {
      is24Property.serviceCharge = Math.round(property.additionalCosts / 100);
    }
    
    if (property.heatingCosts) {
      is24Property.heatingCosts = Math.round(property.heatingCosts / 100);
    }
    
    if (property.deposit) {
      is24Property.deposit = Math.round(property.deposit / 100);
    }
  }

  // Add energy certificate if available
  if (property.energyCertificateAvailability) {
    is24Property.energyCertificate = {
      energyCertificateAvailability: property.energyCertificateAvailability === "liegt vor" ? "AVAILABLE" : "NOT_AVAILABLE",
      ...(property.energyClass && { energyEfficiencyClass: property.energyClass }),
      ...(property.energyCertificateType && {
        energyCertificateCreationDate: property.energyCertificateType === "Bedarfsausweis" ? "DEMAND" : "CONSUMPTION",
      }),
    };
  }

  // Add free from date if specified
  if (property.freeFrom) {
    is24Property.freeFrom = property.freeFrom;
  } else if (property.availableFrom) {
    is24Property.freeFrom = property.availableFrom;
  }

  return is24Property;
}

/**
 * Get human-readable validation summary
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.valid && result.warnings.length === 0) {
    return "✅ Objekt ist bereit für ImmoScout24-Veröffentlichung";
  }

  const parts: string[] = [];

  if (!result.valid) {
    parts.push(`❌ ${result.errors.length} Fehler gefunden:`);
    result.errors.forEach((error) => parts.push(`  • ${error}`));
  }

  if (result.warnings.length > 0) {
    parts.push(`⚠️ ${result.warnings.length} Warnung(en):`);
    result.warnings.forEach((warning) => parts.push(`  • ${warning}`));
  }

  return parts.join("\n");
}

/**
 * Check if property can be published to IS24
 */
export function canPublishToIS24(property: any): boolean {
  const validation = validatePropertyForIS24(property);
  return validation.valid;
}
