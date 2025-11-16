/**
 * PDF Generator Service
 * 
 * Generates PDFs for Exposé, One-Pager, Invoices, and Maklervertrag
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { db } from './db';
import * as fs from 'fs';
import * as path from 'path';

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
  street?: string | null;
  houseNumber?: string | null;
  postalCode?: string | null;
  city?: string | null;
  [key: string]: any;
}

interface CompanyData {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  recipientName: string;
  recipientAddress: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Replace placeholders in template text
 */
function replacePlaceholders(template: string, data: Record<string, any>): string {
  let result = template;
  
  // Replace {{key}} placeholders
  Object.keys(data).forEach(key => {
    const value = data[key] || '';
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    result = result.replace(regex, String(value));
  });
  
  return result;
}

/**
 * Get company data from settings
 */
async function getCompanyData(): Promise<CompanyData> {
  try {
    const settings = await db.getSettings();
    return {
      name: settings?.realestateName || settings?.companyName || 'Immobilienmakler',
      address: settings?.realestateAddress || settings?.companyAddress || '',
      phone: settings?.realestatePhone || settings?.companyPhone || '',
      email: settings?.realestateEmail || settings?.companyEmail || '',
      website: settings?.realestateWebsite || settings?.companyWebsite || '',
      logo: settings?.realestateLogo || settings?.companyLogo || '',
    };
  } catch (error) {
    console.error('Failed to load company data:', error);
    return {
      name: 'Immobilienmakler',
    };
  }
}

/**
 * Format price
 */
function formatPrice(cents: number | null): string {
  if (cents === null) return 'Preis auf Anfrage';
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

// ============================================================================
// EXPOSÉ GENERATION
// ============================================================================

/**
 * Generate Exposé PDF
 */
export async function generateExpose(propertyId: number): Promise<Buffer> {
  // Load property data
  const property = await db.getPropertyById(propertyId);
  if (!property) {
    throw new Error(`Property ${propertyId} not found`);
  }

  const company = await getCompanyData();

  // Create PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Header
  page.drawText(company.name, {
    x: 50,
    y: height - 50,
    size: 20,
    font: fontBold,
    color: rgb(0, 0.4, 0.63),
  });

  // Property Title
  page.drawText(property.title || 'Immobilie', {
    x: 50,
    y: height - 100,
    size: 16,
    font: fontBold,
  });

  // Address
  const address = `${property.street || ''} ${property.houseNumber || ''}, ${property.postalCode || ''} ${property.city || ''}`;
  page.drawText(address, {
    x: 50,
    y: height - 125,
    size: 12,
    font,
  });

  // Price
  page.drawText(`Preis: ${formatPrice(property.price)}`, {
    x: 50,
    y: height - 150,
    size: 14,
    font: fontBold,
    color: rgb(0, 0.4, 0.63),
  });

  // Details
  let yPos = height - 190;
  const details = [
    { label: 'Wohnfläche', value: property.livingSpace ? `${property.livingSpace} m²` : '-' },
    { label: 'Zimmer', value: property.rooms || '-' },
    { label: 'Objektart', value: property.propertyType || '-' },
    { label: 'Vermarktungsart', value: property.marketingType === 'sale' ? 'Kauf' : 'Miete' },
  ];

  details.forEach(detail => {
    page.drawText(`${detail.label}:`, {
      x: 50,
      y: yPos,
      size: 11,
      font: fontBold,
    });
    page.drawText(detail.value, {
      x: 200,
      y: yPos,
      size: 11,
      font,
    });
    yPos -= 25;
  });

  // Description
  if (property.description) {
    yPos -= 20;
    page.drawText('Objektbeschreibung:', {
      x: 50,
      y: yPos,
      size: 12,
      font: fontBold,
    });
    yPos -= 20;
    
    // Wrap text
    const maxWidth = width - 100;
    const words = property.description.split(' ');
    let line = '';
    
    words.forEach(word => {
      const testLine = line + word + ' ';
      const textWidth = font.widthOfTextAtSize(testLine, 10);
      
      if (textWidth > maxWidth && line !== '') {
        page.drawText(line, {
          x: 50,
          y: yPos,
          size: 10,
          font,
        });
        line = word + ' ';
        yPos -= 15;
      } else {
        line = testLine;
      }
    });
    
    if (line) {
      page.drawText(line, {
        x: 50,
        y: yPos,
        size: 10,
        font,
      });
    }
  }

  // Footer
  page.drawText(company.name, {
    x: 50,
    y: 50,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  if (company.phone) {
    page.drawText(`Tel: ${company.phone}`, {
      x: 50,
      y: 35,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
  
  if (company.email) {
    page.drawText(`E-Mail: ${company.email}`, {
      x: 250,
      y: 35,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ============================================================================
// ONE-PAGER GENERATION
// ============================================================================

/**
 * Generate One-Pager PDF
 */
export async function generateOnePager(propertyId: number): Promise<Buffer> {
  // Load property data
  const property = await db.getPropertyById(propertyId);
  if (!property) {
    throw new Error(`Property ${propertyId} not found`);
  }

  const company = await getCompanyData();

  // Create PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Title
  page.drawText(property.title || 'Immobilie', {
    x: 50,
    y: height - 50,
    size: 18,
    font: fontBold,
  });

  // Quick Facts in a box
  const boxY = height - 200;
  page.drawRectangle({
    x: 50,
    y: boxY,
    width: width - 100,
    height: 120,
    borderColor: rgb(0, 0.4, 0.63),
    borderWidth: 2,
  });

  // Facts inside box
  let factY = boxY + 90;
  const facts = [
    { label: 'Preis', value: formatPrice(property.price) },
    { label: 'Fläche', value: property.livingSpace ? `${property.livingSpace} m²` : '-' },
    { label: 'Zimmer', value: property.rooms || '-' },
    { label: 'Lage', value: `${property.postalCode || ''} ${property.city || ''}` },
  ];

  facts.forEach((fact, index) => {
    const xPos = 70 + (index % 2) * 250;
    const yPos = factY - Math.floor(index / 2) * 40;
    
    page.drawText(fact.label, {
      x: xPos,
      y: yPos,
      size: 10,
      font: fontBold,
    });
    page.drawText(fact.value, {
      x: xPos,
      y: yPos - 15,
      size: 12,
      font,
      color: rgb(0, 0.4, 0.63),
    });
  });

  // Contact
  let contactY = boxY - 50;
  page.drawText('Kontakt:', {
    x: 50,
    y: contactY,
    size: 12,
    font: fontBold,
  });
  
  contactY -= 25;
  page.drawText(company.name, {
    x: 50,
    y: contactY,
    size: 11,
    font,
  });
  
  if (company.phone) {
    contactY -= 20;
    page.drawText(`Tel: ${company.phone}`, {
      x: 50,
      y: contactY,
      size: 10,
      font,
    });
  }
  
  if (company.email) {
    contactY -= 20;
    page.drawText(`E-Mail: ${company.email}`, {
      x: 50,
      y: contactY,
      size: 10,
      font,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ============================================================================
// INVOICE GENERATION
// ============================================================================

/**
 * Generate Invoice PDF
 */
export async function generateInvoice(
  propertyId: number,
  recipientType: 'buyer' | 'seller',
  invoiceData: InvoiceData
): Promise<Buffer> {
  const property = await db.getPropertyById(propertyId);
  const company = await getCompanyData();

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Header
  page.drawText('RECHNUNG', {
    x: 50,
    y: height - 50,
    size: 20,
    font: fontBold,
  });

  // Invoice details
  page.drawText(`Rechnungsnummer: ${invoiceData.invoiceNumber}`, {
    x: 50,
    y: height - 80,
    size: 11,
    font,
  });

  page.drawText(`Datum: ${invoiceData.date}`, {
    x: 50,
    y: height - 100,
    size: 11,
    font,
  });

  // Recipient
  page.drawText('Rechnungsempfänger:', {
    x: 50,
    y: height - 140,
    size: 11,
    font: fontBold,
  });

  page.drawText(invoiceData.recipientName, {
    x: 50,
    y: height - 160,
    size: 11,
    font,
  });

  page.drawText(invoiceData.recipientAddress, {
    x: 50,
    y: height - 180,
    size: 11,
    font,
  });

  // Items table
  let tableY = height - 240;
  page.drawText('Pos.', { x: 50, y: tableY, size: 10, font: fontBold });
  page.drawText('Beschreibung', { x: 100, y: tableY, size: 10, font: fontBold });
  page.drawText('Menge', { x: 350, y: tableY, size: 10, font: fontBold });
  page.drawText('Einzelpreis', { x: 400, y: tableY, size: 10, font: fontBold });
  page.drawText('Gesamt', { x: 480, y: tableY, size: 10, font: fontBold });

  tableY -= 20;
  page.drawLine({
    start: { x: 50, y: tableY },
    end: { x: width - 50, y: tableY },
    thickness: 1,
  });

  tableY -= 20;
  invoiceData.items.forEach((item, index) => {
    page.drawText((index + 1).toString(), { x: 50, y: tableY, size: 10, font });
    page.drawText(item.description, { x: 100, y: tableY, size: 10, font });
    page.drawText(item.quantity.toString(), { x: 350, y: tableY, size: 10, font });
    page.drawText(`${item.unitPrice.toFixed(2)} €`, { x: 400, y: tableY, size: 10, font });
    page.drawText(`${item.total.toFixed(2)} €`, { x: 480, y: tableY, size: 10, font });
    tableY -= 20;
  });

  // Totals
  tableY -= 20;
  page.drawText('Zwischensumme:', { x: 350, y: tableY, size: 10, font: fontBold });
  page.drawText(`${invoiceData.subtotal.toFixed(2)} €`, { x: 480, y: tableY, size: 10, font });

  tableY -= 20;
  page.drawText('MwSt. (19%):', { x: 350, y: tableY, size: 10, font: fontBold });
  page.drawText(`${invoiceData.tax.toFixed(2)} €`, { x: 480, y: tableY, size: 10, font });

  tableY -= 20;
  page.drawLine({
    start: { x: 350, y: tableY + 5 },
    end: { x: width - 50, y: tableY + 5 },
    thickness: 1,
  });

  tableY -= 20;
  page.drawText('Gesamtbetrag:', { x: 350, y: tableY, size: 12, font: fontBold });
  page.drawText(`${invoiceData.total.toFixed(2)} €`, { x: 480, y: tableY, size: 12, font: fontBold });

  // Footer
  page.drawText(company.name, {
    x: 50,
    y: 50,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

// ============================================================================
// MAKLERVERTRAG GENERATION
// ============================================================================

/**
 * Generate Maklervertrag PDF
 */
export async function generateMaklervertrag(propertyId: number, ownerId: number): Promise<Buffer> {
  const property = await db.getPropertyById(propertyId);
  const company = await getCompanyData();
  
  // TODO: Load owner data from contacts table
  const owner = { name: 'Eigentümer Name', address: 'Eigentümer Adresse' };

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Title
  page.drawText('MAKLERVERTRAG', {
    x: 50,
    y: height - 50,
    size: 18,
    font: fontBold,
  });

  // Contract text
  let yPos = height - 100;
  const contractText = [
    'zwischen',
    '',
    `${company.name}`,
    `${company.address}`,
    '',
    '- nachfolgend "Makler" genannt -',
    '',
    'und',
    '',
    `${owner.name}`,
    `${owner.address}`,
    '',
    '- nachfolgend "Auftraggeber" genannt -',
    '',
    '§ 1 Vertragsgegenstand',
    `Der Auftraggeber beauftragt den Makler mit der Vermittlung der Immobilie "${property?.title || 'Immobilie'}" zum Verkauf.`,
    '',
    '§ 2 Provision',
    'Die Provision beträgt 3,57% (inkl. MwSt.) des Kaufpreises und ist bei Abschluss des Kaufvertrages fällig.',
  ];

  contractText.forEach(line => {
    if (yPos < 100) return; // Stop if page is full
    
    const size = line.startsWith('§') ? 11 : 10;
    const lineFont = line.startsWith('§') || line.includes('nachfolgend') ? fontBold : font;
    
    page.drawText(line, {
      x: 50,
      y: yPos,
      size,
      font: lineFont,
    });
    yPos -= 20;
  });

  // Signature fields
  const sigY = 150;
  page.drawLine({
    start: { x: 50, y: sigY },
    end: { x: 200, y: sigY },
    thickness: 1,
  });
  page.drawText('Datum, Unterschrift Makler', {
    x: 50,
    y: sigY - 20,
    size: 9,
    font,
  });

  page.drawLine({
    start: { x: width - 200, y: sigY },
    end: { x: width - 50, y: sigY },
    thickness: 1,
  });
  page.drawText('Datum, Unterschrift Auftraggeber', {
    x: width - 200,
    y: sigY - 20,
    size: 9,
    font,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
