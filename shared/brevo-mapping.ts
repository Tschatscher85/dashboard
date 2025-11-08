/**
 * Brevo CRM Data Mapping Utilities
 * 
 * Converts contacts and properties to Brevo-compatible format
 */

export interface Contact {
  id: number;
  firstName?: string | null;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  street?: string | null;
  houseNumber?: string | null;
  zipCode?: string | null;
  city?: string | null;
  country?: string | null;
}

export interface Property {
  id: number;
  title: string;
  street?: string | null;
  houseNumber?: string | null;
  zipCode?: string | null;
  city?: string | null;
  propertyType?: string | null;
  price?: number | null;
  livingArea?: number | null;
  plotArea?: number | null;
  rooms?: number | null;
  yearBuilt?: number | null;
}

export interface BrevoContactAttributes {
  VORNAME?: string;
  NACHNAME?: string;
  EMAIL?: string;
  WHATSAPP?: string;
  SMS?: string;
  EXT_ID?: string;
  // Property-specific fields
  IMMOSCOUTID?: string;
  IMMOSCOUTANSCHRIFT?: string;
  POSTLEITZAHL?: string;
  ORT?: string;
  STRASSE?: string;
  IMMOBILIENTYP?: string;
  IMMOBILIENWERT?: string;
  WOHNFLAECHE?: string;
  GRUNDSTUECKFLAECHE?: string;
  ZIMMERANZAHL?: string;
  BAUJAHR?: string;
  LEAD?: string[];
}

/**
 * Validate contact data for Brevo sync
 * 
 * @param contact - Contact to validate
 * @returns Validation result with errors if any
 */
export function validateContactForBrevo(contact: Contact): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Email is required
  if (!contact.email) {
    errors.push("Email-Adresse ist erforderlich");
  }

  // Validate email format
  if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    errors.push("Ungültiges Email-Format");
  }

  // At least one name field required
  if (!contact.firstName && !contact.lastName) {
    errors.push("Vorname oder Nachname ist erforderlich");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert contact to Brevo attributes format
 * 
 * @param contact - Contact to convert
 * @param inquiryType - Type of inquiry (property_inquiry or owner_inquiry)
 * @param property - Optional property data for property inquiries
 * @returns Brevo-compatible attributes
 */
export function convertContactToBrevoAttributes(
  contact: Contact,
  inquiryType: 'property_inquiry' | 'owner_inquiry',
  property?: Property
): BrevoContactAttributes {
  const attributes: BrevoContactAttributes = {
    VORNAME: contact.firstName || "",
    NACHNAME: contact.lastName || "",
    EMAIL: contact.email || "",
    WHATSAPP: contact.mobile || "",
    SMS: formatPhoneForBrevo(contact.phone || contact.mobile || ""),
    EXT_ID: contact.id.toString(),
    LEAD: [inquiryType === 'property_inquiry' ? 'Immobilienanfrage' : 'Eigentümeranfrage'],
  };

  // Add property-specific fields if property is provided
  if (property) {
    attributes.IMMOSCOUTID = property.id.toString();
    
    // Format full address
    const addressParts = [
      property.street,
      property.houseNumber,
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0
      ? `${addressParts.join(' ')}, ${property.zipCode || ''} ${property.city || ''}`.trim()
      : '';
    
    attributes.IMMOSCOUTANSCHRIFT = fullAddress || undefined;
    attributes.POSTLEITZAHL = property.zipCode || undefined;
    attributes.ORT = property.city || undefined;
    attributes.STRASSE = property.street && property.houseNumber
      ? `${property.street} ${property.houseNumber}`.trim()
      : property.street || undefined;
    
    // Property type mapping
    attributes.IMMOBILIENTYP = mapPropertyType(property.propertyType);
    
    // Price (convert from cents to euros)
    attributes.IMMOBILIENWERT = property.price
      ? (property.price / 100).toFixed(0)
      : undefined;
    
    // Areas
    attributes.WOHNFLAECHE = property.livingArea?.toString();
    attributes.GRUNDSTUECKFLAECHE = property.plotArea?.toString();
    
    // Rooms
    attributes.ZIMMERANZAHL = property.rooms?.toString();
    
    // Year built
    attributes.BAUJAHR = property.yearBuilt?.toString();
  }

  // Remove undefined values
  Object.keys(attributes).forEach(key => {
    if (attributes[key as keyof BrevoContactAttributes] === undefined) {
      delete attributes[key as keyof BrevoContactAttributes];
    }
  });

  return attributes;
}

/**
 * Format phone number for Brevo
 * Brevo expects format: +49xxxxxxxxxx or 0049xxxxxxxxxx
 * 
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneForBrevo(phone: string): string {
  if (!phone) return "";
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // If starts with 0, replace with +49
  if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
    cleaned = '+49' + cleaned.substring(1);
  }
  
  // If starts with 49, add +
  if (cleaned.startsWith('49')) {
    cleaned = '+' + cleaned;
  }
  
  // If doesn't start with +, assume German number
  if (!cleaned.startsWith('+')) {
    cleaned = '+49' + cleaned;
  }
  
  return cleaned;
}

/**
 * Map internal property type to Brevo format
 * 
 * @param propertyType - Internal property type
 * @returns Brevo-compatible property type
 */
export function mapPropertyType(propertyType?: string | null): string | undefined {
  if (!propertyType) return undefined;
  
  const typeMap: Record<string, string> = {
    'apartment': 'Wohnung',
    'house': 'Haus',
    'commercial': 'Gewerbe',
    'land': 'Grundstück',
    'parking': 'Stellplatz',
    'other': 'Sonstiges',
  };
  
  return typeMap[propertyType] || propertyType;
}

/**
 * Get Brevo list ID based on inquiry type
 * 
 * @param inquiryType - Type of inquiry
 * @param propertyInquiryListId - List ID for property inquiries (default: 18)
 * @param ownerInquiryListId - List ID for owner inquiries (default: 19)
 * @returns Brevo list ID
 */
export function getBrevoListId(
  inquiryType: 'property_inquiry' | 'owner_inquiry',
  propertyInquiryListId: number = 18,
  ownerInquiryListId: number = 19
): number {
  return inquiryType === 'property_inquiry'
    ? propertyInquiryListId
    : ownerInquiryListId;
}
