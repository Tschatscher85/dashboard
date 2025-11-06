import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { Property } from '../drizzle/schema';

interface ExposeOptions {
  property: Property;
  images?: { url: string; type: string }[];
  template?: 'modern' | 'classic' | 'luxury';
}

export async function generateExpose(options: ExposeOptions): Promise<Uint8Array> {
  const { property, images = [], template = 'modern' } = options;

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Page 1: Cover with main image and title
  const coverPage = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = coverPage.getSize();

  // Header with property type and marketing type
  const propertyTypeLabel = getPropertyTypeLabel(property.propertyType);
  const marketingTypeLabel = getMarketingTypeLabel(property.marketingType);
  
  coverPage.drawText(`${propertyTypeLabel} zu ${marketingTypeLabel}`, {
    x: 50,
    y: height - 50,
    size: 12,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4),
  });

  // Title
  coverPage.drawText(property.title, {
    x: 50,
    y: height - 100,
    size: 24,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
    maxWidth: width - 100,
  });

  // Location
  const location = [property.street, property.houseNumber, property.zipCode, property.city]
    .filter(Boolean)
    .join(' ');
  
  if (location) {
    coverPage.drawText(location, {
      x: 50,
      y: height - 130,
      size: 14,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });
  }

  // Price box
  if (property.price) {
    const priceText = formatPrice(property.price);
    const priceBoxY = height - 200;
    
    // Draw price box background
    coverPage.drawRectangle({
      x: 50,
      y: priceBoxY - 10,
      width: 200,
      height: 50,
      color: rgb(0.95, 0.95, 0.95),
    });

    coverPage.drawText(priceText, {
      x: 60,
      y: priceBoxY + 10,
      size: 22,
      font: helveticaBoldFont,
      color: rgb(0, 0.4, 0.8),
    });
  }

  // Key facts
  let yPosition = height - 300;
  const facts = [];

  if (property.livingArea) {
    facts.push(`Wohnfläche: ${property.livingArea} m²`);
  }
  if (property.rooms) {
    facts.push(`Zimmer: ${property.rooms}`);
  }
  if (property.bedrooms) {
    facts.push(`Schlafzimmer: ${property.bedrooms}`);
  }
  if (property.bathrooms) {
    facts.push(`Badezimmer: ${property.bathrooms}`);
  }
  if (property.yearBuilt) {
    facts.push(`Baujahr: ${property.yearBuilt}`);
  }

  facts.forEach((fact) => {
    coverPage.drawText(fact, {
      x: 50,
      y: yPosition,
      size: 12,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 20;
  });

  // Page 2: Details
  const detailsPage = pdfDoc.addPage([595, 842]);
  yPosition = height - 50;

  // Description
  detailsPage.drawText('Objektbeschreibung', {
    x: 50,
    y: yPosition,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 30;

  if (property.description) {
    const descriptionLines = wrapText(property.description, 70);
    descriptionLines.forEach((line) => {
      if (yPosition < 100) {
        // Start new page if needed
        const newPage = pdfDoc.addPage([595, 842]);
        yPosition = height - 50;
        newPage.drawText(line, {
          x: 50,
          y: yPosition,
          size: 11,
          font: timesRomanFont,
          color: rgb(0.2, 0.2, 0.2),
        });
      } else {
        detailsPage.drawText(line, {
          x: 50,
          y: yPosition,
          size: 11,
          font: timesRomanFont,
          color: rgb(0.2, 0.2, 0.2),
        });
      }
      yPosition -= 18;
    });
  }

  yPosition -= 30;

  // Property details section
  if (yPosition < 200) {
    const newPage = pdfDoc.addPage([595, 842]);
    yPosition = height - 50;
  }

  detailsPage.drawText('Objektdetails', {
    x: 50,
    y: yPosition,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 30;

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
  if (property.yearBuilt) {
    details.push(['Baujahr:', property.yearBuilt.toString()]);
  }
  if (property.condition) {
    details.push(['Zustand:', getConditionLabel(property.condition)]);
  }

  details.forEach(([label, value]) => {
    detailsPage.drawText(label, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    detailsPage.drawText(value, {
      x: 200,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 20;
  });

  // Costs section
  yPosition -= 30;
  if (yPosition < 200) {
    const newPage = pdfDoc.addPage([595, 842]);
    yPosition = height - 50;
  }

  detailsPage.drawText('Kosten', {
    x: 50,
    y: yPosition,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 30;

  const costs = [];
  if (property.price) {
    costs.push(['Kaufpreis / Miete:', formatPrice(property.price)]);
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
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaBoldFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    detailsPage.drawText(value, {
      x: 200,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    yPosition -= 20;
  });

  // Features section
  yPosition -= 30;
  if (yPosition < 200) {
    const newPage = pdfDoc.addPage([595, 842]);
    yPosition = height - 50;
  }

  detailsPage.drawText('Ausstattung', {
    x: 50,
    y: yPosition,
    size: 18,
    font: helveticaBoldFont,
    color: rgb(0, 0, 0),
  });
  yPosition -= 30;

  const features = [];
  if (property.hasBalcony) features.push('Balkon');
  if (property.hasTerrace) features.push('Terrasse');
  if (property.hasGarden) features.push('Garten');
  if (property.hasElevator) features.push('Aufzug');
  if (property.hasParking) features.push('Parkplatz');
  if (property.hasBasement) features.push('Keller');

  if (features.length > 0) {
    const featuresText = features.join(' • ');
    detailsPage.drawText(featuresText, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont,
      color: rgb(0.2, 0.2, 0.2),
      maxWidth: width - 100,
    });
  }

  // Energy information
  yPosition -= 60;
  if (property.energyClass || property.energyConsumption) {
    if (yPosition < 150) {
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }

    detailsPage.drawText('Energieausweis', {
      x: 50,
      y: yPosition,
      size: 18,
      font: helveticaBoldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    if (property.energyClass) {
      detailsPage.drawText(`Energieeffizienzklasse: ${property.energyClass}`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= 20;
    }

    if (property.energyConsumption) {
      detailsPage.drawText(`Energieverbrauch: ${property.energyConsumption} kWh/(m²*a)`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
      yPosition -= 20;
    }

    if (property.heatingType) {
      detailsPage.drawText(`Heizungsart: ${property.heatingType}`, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
  }

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

// Helper functions
function formatPrice(cents: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
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
    new: 'Neubau',
    renovated: 'Saniert',
    good: 'Gut',
    needs_renovation: 'Renovierungsbedürftig',
    demolished: 'Abbruchreif',
  };
  return labels[condition] || condition;
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
