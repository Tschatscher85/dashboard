import { google } from 'googleapis';
import { db } from './db';
import { contacts } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Google Contacts Sync Service
 * Bidirectional synchronization between Dashboard and Google Contacts
 * with label mapping for modules
 */

// Google People API client
let peopleClient: any = null;

/**
 * Initialize Google People API client
 * Uses OAuth2 credentials from environment or settings
 */
export async function initGooglePeopleAPI() {
  try {
    // For now, we'll use a simple approach
    // In production, you'd use OAuth2 flow
    const auth = new google.auth.GoogleAuth({
      scopes: [
        'https://www.googleapis.com/auth/contacts',
        'https://www.googleapis.com/auth/contacts.other.readonly'
      ],
    });

    peopleClient = google.people({ version: 'v1', auth });
    return peopleClient;
  } catch (error) {
    console.error('Failed to initialize Google People API:', error);
    throw error;
  }
}

/**
 * Get label mapping from settings
 */
async function getLabelMapping() {
  const settingsResult = await db.select().from(require('../drizzle/schema').settings).where(eq(require('../drizzle/schema').settings.id, 1));
  const settings = settingsResult[0];

  return {
    realestate_buyer: settings?.googleLabelRealEstateBuyer || 'Immobilienanfrage',
    realestate_seller: settings?.googleLabelRealEstateSeller || 'Eigentümeranfragen',
    insurance: settings?.googleLabelInsurance || 'Allianz Privat',
    property_mgmt: settings?.googleLabelPropertyMgmt || 'Hausverwaltung',
  };
}

/**
 * Map dashboard contact to Google contact format
 */
function mapToGoogleContact(contact: any, labels: string[]) {
  const names = [];
  if (contact.firstName || contact.lastName) {
    names.push({
      givenName: contact.firstName || '',
      familyName: contact.lastName || '',
      displayName: `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
    });
  }

  const emailAddresses = [];
  if (contact.email) {
    emailAddresses.push({ value: contact.email, type: 'work' });
  }
  if (contact.alternativeEmail) {
    emailAddresses.push({ value: contact.alternativeEmail, type: 'home' });
  }

  const phoneNumbers = [];
  if (contact.phone) {
    phoneNumbers.push({ value: contact.phone, type: 'work' });
  }
  if (contact.mobile) {
    phoneNumbers.push({ value: contact.mobile, type: 'mobile' });
  }

  const addresses = [];
  if (contact.street || contact.city) {
    addresses.push({
      streetAddress: `${contact.street || ''} ${contact.houseNumber || ''}`.trim(),
      city: contact.city || '',
      postalCode: contact.zip || '',
      country: contact.country || '',
      type: 'home',
    });
  }

  const organizations = [];
  if (contact.company) {
    organizations.push({
      name: contact.company,
      title: contact.position || '',
      type: 'work',
    });
  }

  return {
    names,
    emailAddresses,
    phoneNumbers,
    addresses,
    organizations,
    userDefined: [
      { key: 'dashboardId', value: contact.id.toString() },
      { key: 'modules', value: JSON.stringify({
        realestate: contact.moduleRealestate,
        insurance: contact.moduleInsurance,
        propertyMgmt: contact.modulePropertyMgmt,
      })},
      { key: 'contactType', value: contact.contactType || '' },
      { key: 'category', value: contact.category || '' },
    ],
  };
}

/**
 * Map Google contact to dashboard format
 */
function mapFromGoogleContact(googleContact: any): any {
  const names = googleContact.names?.[0] || {};
  const emails = googleContact.emailAddresses || [];
  const phones = googleContact.phoneNumbers || [];
  const addresses = googleContact.addresses?.[0] || {};
  const orgs = googleContact.organizations?.[0] || {};
  const userDefined = googleContact.userDefined || [];

  // Extract dashboard-specific fields
  const dashboardId = userDefined.find((f: any) => f.key === 'dashboardId')?.value;
  const modulesStr = userDefined.find((f: any) => f.key === 'modules')?.value;
  const modules = modulesStr ? JSON.parse(modulesStr) : {};

  return {
    googleContactId: googleContact.resourceName,
    firstName: names.givenName || '',
    lastName: names.familyName || '',
    email: emails.find((e: any) => e.type === 'work')?.value || emails[0]?.value || '',
    alternativeEmail: emails.find((e: any) => e.type === 'home')?.value || '',
    phone: phones.find((p: any) => p.type === 'work')?.value || '',
    mobile: phones.find((p: any) => p.type === 'mobile')?.value || phones[0]?.value || '',
    street: addresses.streetAddress || '',
    city: addresses.city || '',
    zip: addresses.postalCode || '',
    country: addresses.country || '',
    company: orgs.name || '',
    position: orgs.title || '',
    moduleRealestate: modules.realestate || false,
    moduleInsurance: modules.insurance || false,
    modulePropertyMgmt: modules.propertyMgmt || false,
    contactType: userDefined.find((f: any) => f.key === 'contactType')?.value || 'customer',
    category: userDefined.find((f: any) => f.key === 'category')?.value || '',
    lastGoogleSync: new Date(),
  };
}

/**
 * Sync contact from Dashboard to Google
 */
export async function syncContactToGoogle(contactId: number) {
  try {
    if (!peopleClient) {
      await initGooglePeopleAPI();
    }

    // Get contact from database
    const contactResult = await db.select().from(contacts).where(eq(contacts.id, contactId));
    if (contactResult.length === 0) {
      throw new Error(`Contact ${contactId} not found`);
    }
    const contact = contactResult[0];

    // Determine labels based on modules
    const labels: string[] = [];
    const labelMapping = await getLabelMapping();

    if (contact.moduleRealestate) {
      // Check if buyer or seller based on category
      if (contact.category?.includes('Käufer') || contact.category?.includes('Kaufinteressent')) {
        labels.push(labelMapping.realestate_buyer);
      } else if (contact.category?.includes('Verkäufer') || contact.category?.includes('Eigentümer')) {
        labels.push(labelMapping.realestate_seller);
      }
    }
    if (contact.moduleInsurance) {
      labels.push(labelMapping.insurance);
    }
    if (contact.modulePropertyMgmt) {
      labels.push(labelMapping.property_mgmt);
    }

    // Map to Google format
    const googleContact = mapToGoogleContact(contact, labels);

    let resourceName = contact.googleContactId;

    if (resourceName) {
      // Update existing contact
      await peopleClient.people.updateContact({
        resourceName,
        updatePersonFields: 'names,emailAddresses,phoneNumbers,addresses,organizations,userDefined',
        requestBody: googleContact,
      });
    } else {
      // Create new contact
      const response = await peopleClient.people.createContact({
        requestBody: googleContact,
      });
      resourceName = response.data.resourceName;

      // Update dashboard with Google contact ID
      await db.update(contacts)
        .set({ googleContactId: resourceName, lastGoogleSync: new Date() })
        .where(eq(contacts.id, contactId));
    }

    console.log(`Synced contact ${contactId} to Google: ${resourceName}`);
    return resourceName;
  } catch (error) {
    console.error(`Failed to sync contact ${contactId} to Google:`, error);
    throw error;
  }
}

/**
 * Sync contact from Google to Dashboard
 */
export async function syncContactFromGoogle(resourceName: string) {
  try {
    if (!peopleClient) {
      await initGooglePeopleAPI();
    }

    // Get contact from Google
    const response = await peopleClient.people.get({
      resourceName,
      personFields: 'names,emailAddresses,phoneNumbers,addresses,organizations,userDefined',
    });

    const googleContact = response.data;
    const mappedContact = mapFromGoogleContact(googleContact);

    // Check if contact already exists in dashboard
    const existingResult = await db.select().from(contacts)
      .where(eq(contacts.googleContactId, resourceName));

    if (existingResult.length > 0) {
      // Update existing contact
      await db.update(contacts)
        .set(mappedContact)
        .where(eq(contacts.googleContactId, resourceName));
      console.log(`Updated contact from Google: ${resourceName}`);
      return existingResult[0].id;
    } else {
      // Create new contact
      const result = await db.insert(contacts).values(mappedContact).returning();
      console.log(`Created new contact from Google: ${resourceName}`);
      return result[0].id;
    }
  } catch (error) {
    console.error(`Failed to sync contact from Google ${resourceName}:`, error);
    throw error;
  }
}

/**
 * Sync all contacts from Dashboard to Google
 */
export async function syncAllToGoogle() {
  try {
    const allContacts = await db.select().from(contacts);
    const results = [];

    for (const contact of allContacts) {
      try {
        const resourceName = await syncContactToGoogle(contact.id);
        results.push({ id: contact.id, success: true, resourceName });
      } catch (error: any) {
        results.push({ id: contact.id, success: false, error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to sync all contacts to Google:', error);
    throw error;
  }
}

/**
 * Sync all contacts from Google to Dashboard
 */
export async function syncAllFromGoogle() {
  try {
    if (!peopleClient) {
      await initGooglePeopleAPI();
    }

    // Get all contacts from Google
    const response = await peopleClient.people.connections.list({
      resourceName: 'people/me',
      pageSize: 1000,
      personFields: 'names,emailAddresses,phoneNumbers,addresses,organizations,userDefined',
    });

    const googleContacts = response.data.connections || [];
    const results = [];

    for (const googleContact of googleContacts) {
      try {
        const contactId = await syncContactFromGoogle(googleContact.resourceName);
        results.push({ resourceName: googleContact.resourceName, success: true, contactId });
      } catch (error: any) {
        results.push({ resourceName: googleContact.resourceName, success: false, error: error.message });
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to sync all contacts from Google:', error);
    throw error;
  }
}

/**
 * Bidirectional sync - sync both ways
 */
export async function bidirectionalSync() {
  try {
    console.log('Starting bidirectional sync...');

    // First, sync from Google to Dashboard (to get latest changes)
    const fromGoogleResults = await syncAllFromGoogle();
    console.log(`Synced ${fromGoogleResults.length} contacts from Google`);

    // Then, sync from Dashboard to Google (to push our changes)
    const toGoogleResults = await syncAllToGoogle();
    console.log(`Synced ${toGoogleResults.length} contacts to Google`);

    return {
      fromGoogle: fromGoogleResults,
      toGoogle: toGoogleResults,
    };
  } catch (error) {
    console.error('Bidirectional sync failed:', error);
    throw error;
  }
}
