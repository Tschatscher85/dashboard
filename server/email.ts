/**
 * Brevo Email Service
 * 
 * Handles transactional email sending via Brevo API
 */

import { getDb } from "./db";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  propertyTitle?: string;
}

interface BrevoEmailRequest {
  sender: { name: string; email: string };
  to: Array<{ email: string; name?: string }>;
  subject: string;
  htmlContent: string;
  textContent: string;
}

interface BrevoContact {
  email: string;
  attributes?: {
    FIRSTNAME?: string;
    LASTNAME?: string;
    SMS?: string;
    [key: string]: any;
  };
  listIds?: number[];
  updateEnabled?: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Encode German special characters to HTML entities
 */
function encodeGermanChars(text: string): string {
  return text
    .replace(/ä/g, "&auml;")
    .replace(/ö/g, "&ouml;")
    .replace(/ü/g, "&uuml;")
    .replace(/Ä/g, "&Auml;")
    .replace(/Ö/g, "&Ouml;")
    .replace(/Ü/g, "&Uuml;")
    .replace(/ß/g, "&szlig;")
    .replace(/²/g, "&sup2;")
    .replace(/³/g, "&sup3;");
}

/**
 * Get email settings from database
 * @param module - Which module to get settings for (realestate, insurance, propertyMgmt)
 */
async function getEmailSettings(module: 'realestate' | 'insurance' | 'propertyMgmt' = 'realestate') {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  const { settings } = await import('../drizzle/schema');
  const settingsData = await db.select().from(settings).limit(1);
  if (!settingsData || settingsData.length === 0) {
    throw new Error("Email settings not configured");
  }
  
  const config = settingsData[0];
  
  if (!config.brevoApiKey) {
    throw new Error("Brevo API Key not configured");
  }
  
  // Module-specific email settings with fallback to legacy settings
  let fromEmail, fromName, notificationEmail;
  
  if (module === 'realestate') {
    fromEmail = config.realestateEmailFrom || config.emailFrom || "noreply@immo-jaeger.eu";
    fromName = config.realestateEmailFromName || config.emailFromName || "Immo-Jaeger";
    notificationEmail = config.realestateEmailNotificationTo || config.emailNotificationTo || "info@immo-jaeger.eu";
  } else if (module === 'insurance') {
    fromEmail = config.insuranceEmailFrom || config.emailFrom || "noreply@versicherung.eu";
    fromName = config.insuranceEmailFromName || config.emailFromName || "Versicherungsmakler";
    notificationEmail = config.insuranceEmailNotificationTo || config.emailNotificationTo || "info@versicherung.eu";
  } else if (module === 'propertyMgmt') {
    fromEmail = config.propertyMgmtEmailFrom || config.emailFrom || "noreply@hausverwaltung.eu";
    fromName = config.propertyMgmtEmailFromName || config.emailFromName || "Hausverwaltung";
    notificationEmail = config.propertyMgmtEmailNotificationTo || config.emailNotificationTo || "info@hausverwaltung.eu";
  }
  
  return {
    apiKey: config.brevoApiKey,
    fromEmail,
    fromName,
    notificationEmail,
  };
}

/**
 * Send email via Brevo Transactional Email API
 */
async function sendBrevoEmail(emailData: BrevoEmailRequest, apiKey: string): Promise<void> {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error: ${response.status} - ${errorText}`);
  }
}

/**
 * Create or update contact in Brevo CRM and add to list
 * List 18 = Immobilienanfragen
 */
async function createBrevoContact(contactData: BrevoContact, apiKey: string): Promise<void> {
  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(contactData),
  });

  // 201 = created, 204 = updated (already exists)
  if (!response.ok && response.status !== 204) {
    const errorText = await response.text();
    throw new Error(`Brevo Contacts API error: ${response.status} - ${errorText}`);
  }
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Generate HTML email template for lead notification (to admin)
 */
function generateLeadNotificationHTML(data: LeadData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Neue Kontaktanfrage</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #0066A1; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Neue Kontaktanfrage</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Sie haben eine neue Kontaktanfrage ${data.propertyTitle ? `zur Immobilie <strong>${encodeGermanChars(data.propertyTitle)}</strong>` : ""} erhalten:</p>
        
        <h3>Kontaktdaten:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${encodeGermanChars(data.firstName)} ${encodeGermanChars(data.lastName)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>E-Mail:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.email}</td></tr>
          ${data.phone ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Telefon:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.phone}</td></tr>` : ""}
          ${data.message ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Nachricht:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${encodeGermanChars(data.message)}</td></tr>` : ""}
        </table>
      </div>
      <div style="background-color: #0066A1; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">&copy; 2025 Immobilien Dashboard</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email for lead notification (to admin)
 */
function generateLeadNotificationText(data: LeadData): string {
  return `
Neue Kontaktanfrage
===================

Sie haben eine neue Kontaktanfrage ${data.propertyTitle ? `zur Immobilie "${data.propertyTitle}"` : ""} erhalten:

Kontaktdaten:
- Name: ${data.firstName} ${data.lastName}
- E-Mail: ${data.email}
${data.phone ? `- Telefon: ${data.phone}` : ""}
${data.message ? `- Nachricht: ${data.message}` : ""}

---
© 2025 Immobilien Dashboard
  `.trim();
}

/**
 * Generate HTML email template for lead confirmation (to customer)
 */
function generateLeadConfirmationHTML(data: LeadData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ihre Kontaktanfrage</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #0066A1; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Vielen Dank für Ihre Anfrage</h1>
      </div>
      <div style="padding: 20px; background-color: #f9f9f9;">
        <p>Sehr geehrte/r ${encodeGermanChars(data.firstName)} ${encodeGermanChars(data.lastName)},</p>
        
        <p>vielen Dank für Ihre Kontaktanfrage ${data.propertyTitle ? `zur Immobilie <strong>${encodeGermanChars(data.propertyTitle)}</strong>` : ""}. Wir haben Ihre Nachricht erhalten und werden uns in Kürze bei Ihnen melden.</p>
        
        <h3>Ihre Kontaktdaten:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${encodeGermanChars(data.firstName)} ${encodeGermanChars(data.lastName)}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>E-Mail:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.email}</td></tr>
          ${data.phone ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Telefon:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.phone}</td></tr>` : ""}
          ${data.message ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Nachricht:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${encodeGermanChars(data.message)}</td></tr>` : ""}
        </table>
        
        <p style="margin-top: 20px;">Mit freundlichen Grüßen<br>Ihr Immobilien-Team</p>
      </div>
      <div style="background-color: #0066A1; color: white; padding: 15px; text-align: center; font-size: 12px;">
        <p style="margin: 0;">&copy; 2025 Immobilien Dashboard</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text email for lead confirmation (to customer)
 */
function generateLeadConfirmationText(data: LeadData): string {
  return `
Vielen Dank für Ihre Anfrage
=============================

Sehr geehrte/r ${data.firstName} ${data.lastName},

vielen Dank für Ihre Kontaktanfrage ${data.propertyTitle ? `zur Immobilie "${data.propertyTitle}"` : ""}. Wir haben Ihre Nachricht erhalten und werden uns in Kürze bei Ihnen melden.

Ihre Kontaktdaten:
- Name: ${data.firstName} ${data.lastName}
- E-Mail: ${data.email}
${data.phone ? `- Telefon: ${data.phone}` : ""}
${data.message ? `- Nachricht: ${data.message}` : ""}

Mit freundlichen Grüßen
Ihr Immobilien-Team

---
© 2025 Immobilien Dashboard
  `.trim();
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Send lead notification email to admin
 */
export async function notifyAdminLead(data: LeadData): Promise<void> {
  const config = await getEmailSettings();
  
  await sendBrevoEmail({
    sender: { name: config.fromName, email: config.fromEmail },
    to: [{ email: config.notificationEmail }],
    subject: `Neue Kontaktanfrage${data.propertyTitle ? ` - ${data.propertyTitle}` : ""}`,
    htmlContent: generateLeadNotificationHTML(data),
    textContent: generateLeadNotificationText(data),
  }, config.apiKey);
}

/**
 * Send lead confirmation email to customer
 */
export async function notifyCustomerLead(data: LeadData): Promise<void> {
  const config = await getEmailSettings();
  
  await sendBrevoEmail({
    sender: { name: config.fromName, email: config.fromEmail },
    to: [{ email: data.email, name: `${data.firstName} ${data.lastName}` }],
    subject: "Ihre Kontaktanfrage",
    htmlContent: generateLeadConfirmationHTML(data),
    textContent: generateLeadConfirmationText(data),
  }, config.apiKey);
}

/**
 * Add contact to Brevo CRM List 18 (Immobilienanfragen)
 * This creates/updates the contact and adds them to the list
 */
export async function addContactToBrevoList(data: LeadData): Promise<void> {
  const config = await getEmailSettings();
  
  const contactData: BrevoContact = {
    email: data.email,
    attributes: {
      FIRSTNAME: data.firstName,
      LASTNAME: data.lastName,
    },
    listIds: [18], // Liste 18 = Immobilienanfragen
    updateEnabled: true, // Update if contact already exists
  };
  
  // Add phone if provided
  if (data.phone) {
    contactData.attributes!.SMS = data.phone;
  }
  
  await createBrevoContact(contactData, config.apiKey);
}

/**
 * Complete lead processing: Send emails + add to CRM
 */
export async function processLead(data: LeadData): Promise<void> {
  // Send notification to admin
  await notifyAdminLead(data);
  
  // Send confirmation to customer
  await notifyCustomerLead(data);
  
  // Add contact to Brevo CRM List 18
  await addContactToBrevoList(data);
}
