import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import type { Property } from '../drizzle/schema';

interface ExposeImage {
  url: string;
  type: string;
}

interface ExposeOptions {
  property: Property;
  images?: ExposeImage[];
  template?: 'modern' | 'classic' | 'luxury';
}

export async function generateExpose(options: ExposeOptions): Promise<Uint8Array> {
  const { property, images = [], template = 'modern' } = options;

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const A4_WIDTH = 595;
  const A4_HEIGHT = 842;
  const MARGIN = 50;
  const CONTENT_WIDTH = A4_WIDTH - (MARGIN * 2);

  // ==================== PAGE 1: COVER ====================
  const coverPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  let yPos = A4_HEIGHT - MARGIN;

  // Header with property type and marketing type
  const propertyTypeLabel = getPropertyTypeLabel(property.propertyType);
  const marketingTypeLabel = getMarketingTypeLabel(property.marketingType);
  
  coverPage.drawText(`${propertyTypeLabel} zu ${marketingTypeLabel}`, {
    x: MARGIN,
    y: yPos,
    size: 12,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  yPos -= 50;

  // Title
  const titleLines = wrapText(property.title, 50);
  titleLines.forEach((line) => {
    coverPage.drawText(line, {
      x: MARGIN,
      y: yPos,
      size: 24,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    yPos -= 30;
  });

  // Location
  const location = [property.street, property.houseNumber, property.zipCode, property.city]
    .filter(Boolean)
    .join(' ');
  
  if (location) {
    coverPage.drawText(location, {
      x: MARGIN,
      y: yPos,
      size: 14,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
    yPos -= 50;
  }

  // Price box
  if (property.price) {
    const priceText = formatPrice(property.price);
    
    // Draw price box background
    coverPage.drawRectangle({
      x: MARGIN,
      y: yPos - 40,
      width: 250,
      height: 60,
      color: rgb(0, 0.4, 0.8),
    });

    coverPage.drawText(priceText, {
      x: MARGIN + 15,
      y: yPos - 20,
      size: 26,
      font: helveticaBoldFont,
      color: rgb(1, 1, 1),
    });
    yPos -= 80;
  }

  // Key facts in boxes
  yPos -= 20;
  const facts = [];

  if (property.livingArea) {
    facts.push({ label: 'Wohnfläche', value: `${property.livingArea} m²` });
  }
  if (property.rooms) {
    facts.push({ label: 'Zimmer', value: property.rooms.toString() });
  }
  if (property.bedrooms) {
    facts.push({ label: 'Schlafzimmer', value: property.bedrooms.toString() });
  }
  if (property.bathrooms) {
    facts.push({ label: 'Badezimmer', value: property.bathrooms.toString() });
  }
  if (property.yearBuilt) {
    facts.push({ label: 'Baujahr', value: property.yearBuilt.toString() });
  }
  if (property.plotArea) {
    facts.push({ label: 'Grundstück', value: `${property.plotArea} m²` });
  }

  // Draw facts in 2 columns
  const boxWidth = (CONTENT_WIDTH - 20) / 2;
  const boxHeight = 60;
  let xPos = MARGIN;
  let factIndex = 0;

  facts.forEach((fact, index) => {
    if (index > 0 && index % 2 === 0) {
      yPos -= boxHeight + 10;
      xPos = MARGIN;
    } else if (index > 0) {
      xPos = MARGIN + boxWidth + 20;
    }

    // Draw box
    coverPage.drawRectangle({
      x: xPos,
      y: yPos - boxHeight,
      width: boxWidth,
      height: boxHeight,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: rgb(0.8, 0.8, 0.8),
      borderWidth: 1,
    });

    // Draw label
    coverPage.drawText(fact.label, {
      x: xPos + 10,
      y: yPos - 25,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Draw value
    coverPage.drawText(fact.value, {
      x: xPos + 10,
      y: yPos - 45,
      size: 16,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });

    factIndex++;
  });

  // ==================== PAGE 2: DESCRIPTION & DETAILS ====================
  const detailsPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  yPos = A4_HEIGHT - MARGIN;

  // Description
  detailsPage.drawText('Objektbeschreibung', {
    x: MARGIN,
    y: yPos,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPos -= 30;

  if (property.description) {
    const descriptionLines = wrapText(property.description, 80);
    descriptionLines.forEach((line) => {
      if (yPos < 100) {
        // Start new page if needed
        const newPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
        yPos = A4_HEIGHT - MARGIN;
      }
      detailsPage.drawText(line, {
        x: MARGIN,
        y: yPos,
        size: 11,
        font: timesRomanFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 18;
    });
  }

  yPos -= 30;

  // Property details in 2 columns
  if (yPos < 300) {
    const newPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    yPos = A4_HEIGHT - MARGIN;
  }

  detailsPage.drawText('Objektdetails', {
    x: MARGIN,
    y: yPos,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPos -= 30;

  const details = [];

  if (property.propertyType) {
    details.push(['Immobilientyp:', getPropertyTypeLabel(property.propertyType)]);
  }
  if (property.marketingType) {
    details.push(['Vermarktungsart:', getMarketingTypeLabel(property.marketingType)]);
  }
  if (property.livingArea) {
    details.push(['Wohnfläche:', `${property.livingArea} m²`]);
  }
  if (property.plotArea) {
    details.push(['Grundstücksfläche:', `${property.plotArea} m²`]);
  }
  if (property.rooms) {
    details.push(['Zimmer:', property.rooms.toString()]);
  }
  if (property.bedrooms) {
    details.push(['Schlafzimmer:', property.bedrooms.toString()]);
  }
  if (property.bathrooms) {
    details.push(['Badezimmer:', property.bathrooms.toString()]);
  }
  if (property.floor !== null && property.floor !== undefined) {
    details.push(['Etage:', property.floor.toString()]);
  }
  if (property.totalFloors) {
    details.push(['Anzahl Etagen:', property.totalFloors.toString()]);
  }
  if (property.yearBuilt) {
    details.push(['Baujahr:', property.yearBuilt.toString()]);
  }
  if (property.condition) {
    details.push(['Zustand:', getConditionLabel(property.condition)]);
  }
  if (property.availableFrom) {
    const dateStr = property.availableFrom instanceof Date 
      ? property.availableFrom.toLocaleDateString('de-DE')
      : new Date(property.availableFrom as any).toLocaleDateString('de-DE');
    details.push(['Verfügbar ab:', dateStr]);
  }

  // Draw details in 2 columns
  const columnWidth = (CONTENT_WIDTH - 30) / 2;
  let currentColumn = 0;
  let columnYPos = yPos;

  details.forEach(([label, value], index) => {
    const xOffset = currentColumn === 0 ? MARGIN : MARGIN + columnWidth + 30;

    detailsPage.drawText(label, {
      x: xOffset,
      y: columnYPos,
      size: 10,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    detailsPage.drawText(value, {
      x: xOffset + 120,
      y: columnYPos,
      size: 10,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    columnYPos -= 20;

    // Switch to second column after half the details
    if (index === Math.floor(details.length / 2) - 1) {
      currentColumn = 1;
      columnYPos = yPos;
    }
  });

  yPos = Math.min(columnYPos, yPos - (Math.ceil(details.length / 2) * 20));
  yPos -= 40;

  // Costs section
  if (yPos < 200) {
    const newPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    yPos = A4_HEIGHT - MARGIN;
  }

  detailsPage.drawText('Kosten', {
    x: MARGIN,
    y: yPos,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPos -= 30;

  const costs = [];
  if (property.price) {
    const label = property.marketingType === 'sale' ? 'Kaufpreis:' : 'Kaltmiete:';
    costs.push([label, formatPrice(property.price)]);
  }
  if (property.additionalCosts) {
    costs.push(['Nebenkosten:', formatPrice(property.additionalCosts)]);
  }
  if (property.heatingCosts) {
    costs.push(['Heizkosten:', formatPrice(property.heatingCosts)]);
  }
  if (property.deposit) {
    costs.push(['Kaution:', formatPrice(property.deposit)]);
  }

  costs.forEach(([label, value]) => {
    detailsPage.drawText(label, {
      x: MARGIN,
      y: yPos,
      size: 11,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    detailsPage.drawText(value, {
      x: MARGIN + 150,
      y: yPos,
      size: 11,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 22;
  });

  // Features section
  yPos -= 30;
  if (yPos < 200) {
    const newPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    yPos = A4_HEIGHT - MARGIN;
  }

  detailsPage.drawText('Ausstattung', {
    x: MARGIN,
    y: yPos,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPos -= 30;

  const features = [];
  if (property.hasBalcony) features.push('✓ Balkon');
  if (property.hasTerrace) features.push('✓ Terrasse');
  if (property.hasGarden) features.push('✓ Garten');
  if (property.hasElevator) features.push('✓ Aufzug');
  if (property.hasParking) features.push('✓ Parkplatz');
  if (property.hasBasement) features.push('✓ Keller');

  if (features.length > 0) {
    // Draw features in 2 columns
    features.forEach((feature, index) => {
      const xOffset = index % 2 === 0 ? MARGIN : MARGIN + columnWidth + 30;
      const yOffset = yPos - (Math.floor(index / 2) * 22);

      detailsPage.drawText(feature, {
        x: xOffset,
        y: yOffset,
        size: 11,
        font: helveticaFont,
        color: rgb(0, 0.6, 0),
      });
    });

    yPos -= Math.ceil(features.length / 2) * 22 + 20;
  }

  // Energy information
  yPos -= 20;
  if (property.energyClass || property.energyConsumption) {
    if (yPos < 150) {
      const newPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
      yPos = A4_HEIGHT - MARGIN;
    }

    detailsPage.drawText('Energieausweis', {
      x: MARGIN,
      y: yPos,
      size: 18,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    yPos -= 30;

    if (property.energyClass) {
      // Draw energy class badge
      const energyColorValues = getEnergyClassColor(property.energyClass);
      detailsPage.drawRectangle({
        x: MARGIN,
        y: yPos - 30,
        width: 80,
        height: 40,
        color: rgb(energyColorValues[0], energyColorValues[1], energyColorValues[2]),
      });

      detailsPage.drawText(property.energyClass, {
        x: MARGIN + 25,
        y: yPos - 15,
        size: 20,
        font: helveticaBoldFont,
        color: rgb(1, 1, 1),
      });

      detailsPage.drawText('Energieeffizienzklasse', {
        x: MARGIN + 100,
        y: yPos - 15,
        size: 11,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });

      yPos -= 50;
    }

    if (property.energyConsumption) {
      detailsPage.drawText(`Energieverbrauch: ${property.energyConsumption} kWh/(m²*a)`, {
        x: MARGIN,
        y: yPos,
        size: 11,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPos -= 22;
    }

    if (property.heatingType) {
      detailsPage.drawText(`Heizungsart: ${property.heatingType}`, {
        x: MARGIN,
        y: yPos,
        size: 11,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
  }

  // ==================== PAGE 3+: IMAGE GALLERY ====================
  if (images.length > 0) {
    // Group images by category
    const imagesByCategory: Record<string, ExposeImage[]> = {};
    images.forEach((img) => {
      const category = img.type || 'other';
      if (!imagesByCategory[category]) {
        imagesByCategory[category] = [];
      }
      imagesByCategory[category].push(img);
    });

    // Prioritize certain categories
    const categoryOrder = [
      'exterior_view',
      'living_room',
      'kitchen',
      'bathroom',
      'bedroom',
      'garden',
      'balcony_terrace',
      'floor_plan',
      'other',
    ];

    let imagePage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    yPos = A4_HEIGHT - MARGIN;

    imagePage.drawText('Bildergalerie', {
      x: MARGIN,
      y: yPos,
      size: 18,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    yPos -= 40;

    // Add note about images (placeholder since we can't embed from URLs easily)
    imagePage.drawText('Hinweis: Bilder sind in der digitalen Version verfügbar.', {
      x: MARGIN,
      y: yPos,
      size: 10,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });
    yPos -= 30;

    // List images by category
    categoryOrder.forEach((category) => {
      const categoryImages = imagesByCategory[category];
      if (categoryImages && categoryImages.length > 0) {
        const categoryLabel = getImageCategoryLabel(category);

        if (yPos < 100) {
          imagePage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
          yPos = A4_HEIGHT - MARGIN;
        }

        imagePage.drawText(`${categoryLabel} (${categoryImages.length})`, {
          x: MARGIN,
          y: yPos,
          size: 12,
          font: helveticaBoldFont,
          color: rgb(0, 0, 0),
        });
        yPos -= 25;
      }
    });
  }

  // ==================== FINAL PAGE: CONTACT ====================
  const contactPage = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
  yPos = A4_HEIGHT - MARGIN;

  contactPage.drawText('Kontakt', {
    x: MARGIN,
    y: yPos,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPos -= 40;

  contactPage.drawText('Für weitere Informationen und Besichtigungstermine kontaktieren Sie uns:', {
    x: MARGIN,
    y: yPos,
    size: 11,
    font: helveticaFont,
    color: rgb(0.2, 0.2, 0.2),
  });
  yPos -= 40;

  // Contact details from environment variables (company branding)
  const contactDetails = [];
  
  if (process.env.COMPANY_NAME) {
    contactDetails.push(process.env.COMPANY_NAME);
  }
  
  if (process.env.COMPANY_ADDRESS) {
    contactDetails.push(process.env.COMPANY_ADDRESS);
  }
  
  if (process.env.COMPANY_PHONE) {
    contactDetails.push(`Telefon: ${process.env.COMPANY_PHONE}`);
  }
  
  if (process.env.COMPANY_EMAIL) {
    contactDetails.push(`E-Mail: ${process.env.COMPANY_EMAIL}`);
  }
  
  if (process.env.COMPANY_WEBSITE) {
    contactDetails.push(`Web: ${process.env.COMPANY_WEBSITE}`);
  }
  
  // Fallback if no company branding is configured
  if (contactDetails.length === 0) {
    contactDetails.push(
      'Immobilienmakler',
      'Telefon: +49 (0) 123 456789',
      'E-Mail: info@immobilien.de',
      'Web: www.immobilien.de'
    );
  }

  contactDetails.forEach((detail) => {
    contactPage.drawText(detail, {
      x: MARGIN,
      y: yPos,
      size: 11,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPos -= 22;
  });

  yPos -= 40;

  // Disclaimer
  contactPage.drawText('Alle Angaben ohne Gewähr. Irrtümer und Zwischenverkauf vorbehalten.', {
    x: MARGIN,
    y: yPos,
    size: 9,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Helper functions
function formatPrice(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    apartment: 'Wohnung',
    house: 'Haus',
    commercial: 'Gewerbe',
    land: 'Grundstück',
    parking: 'Stellplatz',
    other: 'Sonstiges',
  };
  return labels[type] || type;
}

function getMarketingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sale: 'Verkauf',
    rent: 'Vermietung',
    lease: 'Verpachtung',
  };
  return labels[type] || type;
}

function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    erstbezug: 'Erstbezug',
    erstbezug_nach_sanierung: 'Erstbezug nach Sanierung',
    neuwertig: 'Neuwertig',
    saniert: 'Saniert',
    teilsaniert: 'Teilsaniert',
    sanierungsbedürftig: 'Sanierungsbedürftig',
    baufällig: 'Baufällig',
    modernisiert: 'Modernisiert',
    vollständig_renoviert: 'Vollständig renoviert',
    teilweise_renoviert: 'Teilweise renoviert',
    gepflegt: 'Gepflegt',
    renovierungsbedürftig: 'Renovierungsbedürftig',
    nach_vereinbarung: 'Nach Vereinbarung',
    abbruchreif: 'Abbruchreif',
  };
  return labels[condition] || condition;
}

function getImageCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    exterior_view: 'Hausansicht',
    kitchen: 'Küche',
    bathroom: 'Bad',
    living_room: 'Wohnzimmer',
    bedroom: 'Schlafzimmer',
    garden: 'Garten',
    balcony_terrace: 'Balkon/Terrasse',
    basement: 'Keller',
    attic: 'Dachboden',
    garage: 'Garage',
    floor_plan: 'Grundrisse',
    other: 'Sonstiges',
  };
  return labels[category] || category;
}

function getEnergyClassColor(energyClass: string): [number, number, number] {
  const colors: Record<string, [number, number, number]> = {
    'A+': [0, 0.6, 0],
    'A': [0.2, 0.7, 0],
    'B': [0.5, 0.8, 0],
    'C': [0.8, 0.9, 0],
    'D': [1, 0.9, 0],
    'E': [1, 0.7, 0],
    'F': [1, 0.5, 0],
    'G': [1, 0.3, 0],
    'H': [1, 0, 0],
  };
  return colors[energyClass] || [0.5, 0.5, 0.5];
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach((word) => {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}
