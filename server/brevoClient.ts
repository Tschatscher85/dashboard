import { ENV } from './_core/env';

interface BrevoContact {
  email: string;
  attributes?: Record<string, any>;
  listIds?: number[];
  updateEnabled?: boolean;
}

interface BrevoCreateContactResponse {
  id: number;
}

interface BrevoList {
  id: number;
  name: string;
  totalSubscribers: number;
}

interface BrevoEmailRecipient {
  email: string;
  name?: string;
}

interface BrevoEmailParams {
  to: BrevoEmailRecipient[];
  subject: string;
  htmlContent?: string;
  textContent?: string;
  sender?: BrevoEmailRecipient;
  replyTo?: BrevoEmailRecipient;
  templateId?: number;
  params?: Record<string, any>;
}

interface BrevoSendEmailResponse {
  messageId: string;
}

/**
 * Brevo API Client for contact synchronization
 * Documentation: https://developers.brevo.com/
 */
export class BrevoClient {
  private apiKey: string;
  private baseUrl = 'https://api.brevo.com/v3';

  constructor() {
    const apiKey = ENV.BREVO_API_KEY;
    if (!apiKey) {
      throw new Error('BREVO_API_KEY environment variable is not set');
    }
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'api-key': this.apiKey,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Brevo API error (${response.status}): ${errorText}`
      );
    }

    return response.json();
  }

  /**
   * Get all contact lists from Brevo
   */
  async getLists(): Promise<BrevoList[]> {
    const response = await this.request<{ lists: BrevoList[] }>('/contacts/lists');
    return response.lists;
  }

  /**
   * Find list ID by name
   */
  async findListByName(name: string): Promise<number | null> {
    const lists = await this.getLists();
    const list = lists.find(l => l.name.toLowerCase() === name.toLowerCase());
    return list ? list.id : null;
  }

  /**
   * Create or update a contact in Brevo
   */
  async createOrUpdateContact(contact: BrevoContact): Promise<BrevoCreateContactResponse> {
    return this.request<BrevoCreateContactResponse>('/contacts', {
      method: 'POST',
      body: JSON.stringify({
        ...contact,
        updateEnabled: true, // Update if contact already exists
      }),
    });
  }

  /**
   * Sync a property lead to Brevo (Immobilienanfrage list)
   */
  async syncPropertyLead(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    message?: string;
    propertyTitle?: string;
    source?: string;
  }): Promise<void> {
    // Find or use the "Immobilienanfrage" list
    const listId = await this.findListByName('Immobilienanfrage');
    
    if (!listId) {
      console.warn('Brevo list "Immobilienanfrage" not found. Contact will be created without list assignment.');
    }

    const attributes: Record<string, any> = {};
    
    if (data.firstName) attributes.FIRSTNAME = data.firstName;
    if (data.lastName) attributes.LASTNAME = data.lastName;
    if (data.phone) attributes.SMS = data.phone;
    if (data.message) attributes.MESSAGE = data.message;
    if (data.propertyTitle) attributes.PROPERTY = data.propertyTitle;
    if (data.source) attributes.SOURCE = data.source;

    await this.createOrUpdateContact({
      email: data.email,
      attributes,
      listIds: listId ? [listId] : undefined,
    });
  }

  /**
   * Sync a property owner inquiry to Brevo (Eigentümeranfrage list)
   */
  async syncOwnerInquiry(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    message?: string;
    propertyAddress?: string;
  }): Promise<void> {
    // Find or use the "Eigentümeranfrage" list
    const listId = await this.findListByName('Eigentümeranfrage');
    
    if (!listId) {
      console.warn('Brevo list "Eigentümeranfrage" not found. Contact will be created without list assignment.');
    }

    const attributes: Record<string, any> = {};
    
    if (data.firstName) attributes.FIRSTNAME = data.firstName;
    if (data.lastName) attributes.LASTNAME = data.lastName;
    if (data.phone) attributes.SMS = data.phone;
    if (data.message) attributes.MESSAGE = data.message;
    if (data.propertyAddress) attributes.PROPERTY_ADDRESS = data.propertyAddress;

    await this.createOrUpdateContact({
      email: data.email,
      attributes,
      listIds: listId ? [listId] : undefined,
    });
  }

  /**
   * Sync a general contact to Brevo
   */
  async syncContact(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    contactType?: string;
  }): Promise<void> {
    const attributes: Record<string, any> = {};
    
    if (data.firstName) attributes.FIRSTNAME = data.firstName;
    if (data.lastName) attributes.LASTNAME = data.lastName;
    if (data.phone) attributes.SMS = data.phone;
    if (data.contactType) attributes.CONTACT_TYPE = data.contactType;

    await this.createOrUpdateContact({
      email: data.email,
      attributes,
    });
  }

  /**
   * Send a transactional email via Brevo
   */
  async sendEmail(params: BrevoEmailParams): Promise<BrevoSendEmailResponse> {
    const payload: any = {
      to: params.to,
      subject: params.subject,
      sender: params.sender || {
        email: 'noreply@immo-jaeger.eu',
        name: 'Immo-Jaeger',
      },
    };

    if (params.htmlContent) {
      payload.htmlContent = params.htmlContent;
    }

    if (params.textContent) {
      payload.textContent = params.textContent;
    }

    if (params.replyTo) {
      payload.replyTo = params.replyTo;
    }

    if (params.templateId) {
      payload.templateId = params.templateId;
      payload.params = params.params || {};
    }

    return this.request<BrevoSendEmailResponse>('/smtp/email', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Send inquiry notification email to admin
   */
  async sendInquiryNotification(data: {
    adminEmail: string;
    inquiryType: 'property' | 'owner' | 'general';
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    message?: string;
    propertyTitle?: string;
    propertyAddress?: string;
  }): Promise<void> {
    const typeLabels = {
      property: 'Immobilienanfrage',
      owner: 'Eigentümeranfrage',
      general: 'Allgemeine Anfrage',
    };

    const subject = `Neue ${typeLabels[data.inquiryType]}: ${data.contactName}`;

    let htmlContent = `
      <h2>Neue ${typeLabels[data.inquiryType]}</h2>
      <p><strong>Von:</strong> ${data.contactName}</p>
      <p><strong>E-Mail:</strong> ${data.contactEmail}</p>
    `;

    if (data.contactPhone) {
      htmlContent += `<p><strong>Telefon:</strong> ${data.contactPhone}</p>`;
    }

    if (data.propertyTitle) {
      htmlContent += `<p><strong>Immobilie:</strong> ${data.propertyTitle}</p>`;
    }

    if (data.propertyAddress) {
      htmlContent += `<p><strong>Adresse:</strong> ${data.propertyAddress}</p>`;
    }

    if (data.message) {
      htmlContent += `<p><strong>Nachricht:</strong></p><p>${data.message.replace(/\n/g, '<br>')}</p>`;
    }

    await this.sendEmail({
      to: [{ email: data.adminEmail, name: 'Immo-Jaeger Admin' }],
      subject,
      htmlContent,
      replyTo: { email: data.contactEmail, name: data.contactName },
    });
  }

  /**
   * Send appointment confirmation email to contact
   */
  async sendAppointmentConfirmation(data: {
    contactEmail: string;
    contactName: string;
    appointmentDate: string;
    appointmentTime: string;
    propertyTitle?: string;
    propertyAddress?: string;
    notes?: string;
  }): Promise<void> {
    const subject = 'Terminbestätigung - Immo-Jaeger';

    let htmlContent = `
      <h2>Terminbestätigung</h2>
      <p>Sehr geehrte/r ${data.contactName},</p>
      <p>Ihr Termin wurde erfolgreich bestätigt:</p>
      <p><strong>Datum:</strong> ${data.appointmentDate}</p>
      <p><strong>Uhrzeit:</strong> ${data.appointmentTime}</p>
    `;

    if (data.propertyTitle) {
      htmlContent += `<p><strong>Immobilie:</strong> ${data.propertyTitle}</p>`;
    }

    if (data.propertyAddress) {
      htmlContent += `<p><strong>Adresse:</strong> ${data.propertyAddress}</p>`;
    }

    if (data.notes) {
      htmlContent += `<p><strong>Hinweise:</strong></p><p>${data.notes.replace(/\n/g, '<br>')}</p>`;
    }

    htmlContent += `
      <p>Wir freuen uns auf Ihren Besuch!</p>
      <p>Mit freundlichen Grüßen,<br>Ihr Immo-Jaeger Team</p>
    `;

    await this.sendEmail({
      to: [{ email: data.contactEmail, name: data.contactName }],
      subject,
      htmlContent,
    });
  }

  /**
   * Send follow-up email to contact
   */
  async sendFollowUpEmail(data: {
    contactEmail: string;
    contactName: string;
    subject: string;
    message: string;
    propertyTitle?: string;
  }): Promise<void> {
    let htmlContent = `
      <p>Sehr geehrte/r ${data.contactName},</p>
      ${data.message.replace(/\n/g, '<br>')}
    `;

    if (data.propertyTitle) {
      htmlContent += `<p><strong>Bezug:</strong> ${data.propertyTitle}</p>`;
    }

    htmlContent += `
      <p>Mit freundlichen Grüßen,<br>Ihr Immo-Jaeger Team</p>
    `;

    await this.sendEmail({
      to: [{ email: data.contactEmail, name: data.contactName }],
      subject: data.subject,
      htmlContent,
    });
  }
}

// Singleton instance
let brevoClient: BrevoClient | null = null;

export function getBrevoClient(): BrevoClient {
  if (!brevoClient) {
    brevoClient = new BrevoClient();
  }
  return brevoClient;
}
