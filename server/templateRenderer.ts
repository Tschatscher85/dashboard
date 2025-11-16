/**
 * Template Renderer Service
 * 
 * Renders HTML templates with property data using Nunjucks
 */

import nunjucks from 'nunjucks';
import path from 'path';
import fs from 'fs';
import { db } from './db';

// Configure Nunjucks
const templatesPath = path.join(__dirname, 'templates');
const env = nunjucks.configure(templatesPath, {
  autoescape: true,
  noCache: process.env.NODE_ENV === 'development',
});

// ============================================================================
// TYPES
// ============================================================================

interface PropertyData {
  id: number;
  title?: string | null;
  description?: string | null;
  price?: string | null;
  livingSpace?: string | null;
  rooms?: string | null;
  bedrooms?: string | null;
  bathrooms?: string | null;
  plotArea?: string | null;
  yearBuilt?: string | null;
  condition?: string | null;
  heatingType?: string | null;
  energyEfficiencyClass?: string | null;
  street?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  [key: string]: any;
}

interface ShopData {
  name: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  faviconUrl?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get available templates
 */
export function getAvailableTemplates(): string[] {
  try {
    const files = fs.readdirSync(templatesPath);
    return files
      .filter(file => file.endsWith('.html'))
      .map(file => file.replace('.html', ''));
  } catch (error) {
    console.error('Failed to read templates directory:', error);
    return ['modern']; // Fallback
  }
}

/**
 * Check if template exists
 */
export function templateExists(templateName: string): boolean {
  const templatePath = path.join(templatesPath, `${templateName}.html`);
  return fs.existsSync(templatePath);
}

/**
 * Convert property data to template format
 */
function formatPropertyData(property: PropertyData): any {
  return {
    id: property.id,
    title: property.title || 'Immobilie',
    description: property.description || '',
    price: property.price || 'Preis auf Anfrage',
    livingSpace: property.livingSpace || '',
    rooms: property.rooms || '',
    bedrooms: property.bedrooms || '',
    bathrooms: property.bathrooms || '',
    plotArea: property.plotArea || '',
    yearBuilt: property.yearBuilt || '',
    condition: property.condition || '',
    heatingType: property.heatingType || '',
    energyEfficiencyClass: property.energyEfficiencyClass || '',
    address: {
      street: property.street || '',
      houseNumber: property.houseNumber || '',
      postalCode: property.postalCode || '',
      city: property.city || '',
      full: `${property.street || ''} ${property.houseNumber || ''}, ${property.postalCode || ''} ${property.city || ''}`.trim(),
    },
    location: {
      latitude: property.latitude ? parseFloat(property.latitude) : null,
      longitude: property.longitude ? parseFloat(property.longitude) : null,
    },
    features: [],
    // Add all other fields
    ...property,
  };
}

/**
 * Get shop/company data from settings
 */
async function getShopData(): Promise<ShopData> {
  try {
    const settingsData = await db.getSettings();
    return {
      name: settingsData?.companyName || 'Immobilien',
      logo: settingsData?.companyLogo || '',
      phone: settingsData?.companyPhone || '',
      email: settingsData?.companyEmail || '',
      address: settingsData?.companyAddress || '',
      website: settingsData?.companyWebsite || '',
      faviconUrl: settingsData?.companyLogo || '',
    };
  } catch (error) {
    console.error('Failed to load shop data:', error);
    return {
      name: 'Immobilien',
    };
  }
}

/**
 * Get property images
 */
async function getPropertyImages(propertyId: number): Promise<any[]> {
  try {
    const images = await db.getPropertyImages(propertyId);
    return images.map((img: any) => ({
      url: img.url || img.path || '',
      thumbnail: img.url || img.path || '',
      title: img.title || '',
      description: img.description || '',
    }));
  } catch (error) {
    console.error('Failed to load property images:', error);
    return [];
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Render property landing page with template
 */
export async function renderPropertyLandingPage(
  propertyId: number,
  templateName: string = 'modern'
): Promise<string> {
  try {
    // Validate template
    if (!templateExists(templateName)) {
      console.warn(`Template "${templateName}" not found, using "modern" as fallback`);
      templateName = 'modern';
    }

    // Load property data
    const property = await db.getPropertyById(propertyId);
    if (!property) {
      throw new Error(`Property ${propertyId} not found`);
    }

    // Load additional data
    const [shop, images] = await Promise.all([
      getShopData(),
      getPropertyImages(propertyId),
    ]);

    // Format data for template
    const templateData = {
      property: formatPropertyData(property),
      shop,
      images,
      contactForm: {
        enabled: true,
        submitUrl: `/api/trpc/leads.create`,
      },
    };

    // Render template
    const html = nunjucks.render(`${templateName}.html`, templateData);
    
    return html;
  } catch (error) {
    console.error('Template rendering failed:', error);
    throw error;
  }
}

/**
 * Get default template from settings
 */
export async function getDefaultTemplate(): Promise<string> {
  try {
    const settings = await db.getSettings();
    return settings?.landingPageTemplate || 'modern';
  } catch (error) {
    console.error('Failed to load default template:', error);
    return 'modern';
  }
}
