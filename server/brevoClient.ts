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
}

// Singleton instance
let brevoClient: BrevoClient | null = null;

export function getBrevoClient(): BrevoClient {
  if (!brevoClient) {
    brevoClient = new BrevoClient();
  }
  return brevoClient;
}
