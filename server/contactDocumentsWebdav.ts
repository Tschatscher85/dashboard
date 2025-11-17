/**
 * Contact Documents WebDAV Service
 * 
 * Manages document storage for contacts across three business modules:
 * - Immobilienmakler: /Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Kontakte/[Name]/
 * - Versicherungen: /Daten/Allianz/Agentur Jaeger/Versicherungen/[Name]/
 * - Hausverwaltung: /Daten/Allianz/Agentur Jaeger/Hausverwaltung/[Address]/
 */

import { createClient, WebDAVClient } from 'webdav';
import { getDb } from './db';
import path from 'path';

interface ContactDocumentUpload {
  contactId: number;
  module: 'immobilienmakler' | 'versicherungen' | 'hausverwaltung';
  category?: string;
  subcategory?: string;
  fileName: string;
  fileBuffer: Buffer;
  fileType?: string;
  fileSize?: number;
  description?: string;
  uploadedBy?: number;
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  street?: string;
  houseNumber?: string;
  city?: string;
}

/**
 * Get WebDAV client from settings
 */
async function getWebDAVClient(): Promise<WebDAVClient | null> {
  const db = await getDb();
  if (!db) return null;

  const { settings } = await import('../drizzle/schema');
  const settingsData = await db.select().from(settings).limit(1);
  
  if (!settingsData || settingsData.length === 0) {
    console.warn('[ContactDocuments] No settings found');
    return null;
  }

  const config = settingsData[0];
  
  // Check WebDAV configuration
  if (!config.webdavUrl || !config.webdavUsername || !config.webdavPassword) {
    console.warn('[ContactDocuments] WebDAV not configured');
    return null;
  }

  const webdavUrl = `${config.webdavUrl}:${config.webdavPort || '2002'}`;
  
  return createClient(webdavUrl, {
    username: config.webdavUsername,
    password: config.webdavPassword,
  });
}

/**
 * Get base path from settings
 */
async function getBasePath(): Promise<string> {
  const db = await getDb();
  if (!db) return '/Daten/Allianz/Agentur Jaeger';

  const { settings } = await import('../drizzle/schema');
  const settingsData = await db.select().from(settings).limit(1);
  
  if (!settingsData || settingsData.length === 0) {
    return '/Daten/Allianz/Agentur Jaeger';
  }

  return settingsData[0].nasBasePath || '/Daten/Allianz/Agentur Jaeger';
}

/**
 * Build folder path for contact based on module
 */
function buildContactFolderPath(
  basePath: string,
  module: 'immobilienmakler' | 'versicherungen' | 'hausverwaltung',
  contactInfo: ContactInfo,
  category?: string,
  subcategory?: string
): string {
  const contactName = `${contactInfo.firstName} ${contactInfo.lastName}`.trim();
  
  let modulePath: string;
  
  if (module === 'immobilienmakler') {
    // /Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Kontakte/[Name]/[Category]/[Subcategory]
    modulePath = path.join(basePath, 'Beratung', 'Immobilienmakler', 'Kontakte', contactName);
    if (category) modulePath = path.join(modulePath, category);
    if (subcategory) modulePath = path.join(modulePath, subcategory);
  } else if (module === 'versicherungen') {
    // /Daten/Allianz/Agentur Jaeger/Versicherungen/[Name]/[Category]
    modulePath = path.join(basePath, 'Versicherungen', contactName);
    if (category) modulePath = path.join(modulePath, category);
    if (subcategory) modulePath = path.join(modulePath, subcategory);
  } else if (module === 'hausverwaltung') {
    // /Daten/Allianz/Agentur Jaeger/Hausverwaltung/[Address]/[Category]
    const address = contactInfo.street && contactInfo.houseNumber && contactInfo.city
      ? `${contactInfo.street} ${contactInfo.houseNumber}, ${contactInfo.city}`
      : contactName;
    modulePath = path.join(basePath, 'Hausverwaltung', address);
    if (category) modulePath = path.join(modulePath, category);
    if (subcategory) modulePath = path.join(modulePath, subcategory);
  } else {
    modulePath = path.join(basePath, 'Kontakte', contactName);
  }
  
  return modulePath;
}

/**
 * Ensure directory exists on WebDAV
 */
async function ensureDirectory(client: WebDAVClient, dirPath: string): Promise<void> {
  try {
    const exists = await client.exists(dirPath);
    if (!exists) {
      await client.createDirectory(dirPath, { recursive: true });
    }
  } catch (error) {
    console.error(`[ContactDocuments] Failed to create directory ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Get contact info from database
 */
async function getContactInfo(contactId: number): Promise<ContactInfo | null> {
  const db = await getDb();
  if (!db) return null;

  const { contacts } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  const result = await db.select().from(contacts).where(eq(contacts.id, contactId)).limit(1);
  
  if (!result || result.length === 0) {
    return null;
  }

  const contact = result[0];
  return {
    firstName: contact.firstName || '',
    lastName: contact.lastName || '',
    street: contact.street || undefined,
    houseNumber: contact.houseNumber || undefined,
    city: contact.city || undefined,
  };
}

/**
 * Upload document for contact
 */
export async function uploadContactDocument(data: ContactDocumentUpload): Promise<{ id: number; fileUrl: string }> {
  const client = await getWebDAVClient();
  if (!client) {
    throw new Error('WebDAV not configured');
  }

  const contactInfo = await getContactInfo(data.contactId);
  if (!contactInfo) {
    throw new Error('Contact not found');
  }

  const basePath = await getBasePath();
  const folderPath = buildContactFolderPath(basePath, data.module, contactInfo, data.category, data.subcategory);
  
  // Ensure directory exists
  await ensureDirectory(client, folderPath);
  
  // Upload file
  const filePath = path.join(folderPath, data.fileName);
  await client.putFileContents(filePath, data.fileBuffer);
  
  // Save to database
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const { contactDocuments } = await import('../drizzle/schema');
  
  const result = await db.insert(contactDocuments).values({
    contactId: data.contactId,
    module: data.module,
    fileName: data.fileName,
    fileUrl: filePath,
    fileType: data.fileType,
    fileSize: data.fileSize,
    category: data.category,
    subcategory: data.subcategory,
    description: data.description,
    uploadedBy: data.uploadedBy,
  });
  
  return {
    id: result[0].insertId,
    fileUrl: filePath,
  };
}

/**
 * List documents for contact
 */
export async function listContactDocuments(contactId: number, module?: string): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  
  const { contactDocuments } = await import('../drizzle/schema');
  const { eq, and } = await import('drizzle-orm');
  
  let query = db.select().from(contactDocuments).where(eq(contactDocuments.contactId, contactId));
  
  if (module) {
    query = db.select().from(contactDocuments).where(
      and(
        eq(contactDocuments.contactId, contactId),
        eq(contactDocuments.module, module as any)
      )
    );
  }
  
  return await query;
}

/**
 * Download document
 */
export async function downloadContactDocument(documentId: number): Promise<Buffer | null> {
  const db = await getDb();
  if (!db) return null;
  
  const { contactDocuments } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  const result = await db.select().from(contactDocuments).where(eq(contactDocuments.id, documentId)).limit(1);
  
  if (!result || result.length === 0) {
    return null;
  }
  
  const doc = result[0];
  const client = await getWebDAVClient();
  if (!client) return null;
  
  try {
    const fileContents = await client.getFileContents(doc.fileUrl);
    return fileContents as Buffer;
  } catch (error) {
    console.error('[ContactDocuments] Failed to download:', error);
    return null;
  }
}

/**
 * Delete document
 */
export async function deleteContactDocument(documentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const { contactDocuments } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  
  const result = await db.select().from(contactDocuments).where(eq(contactDocuments.id, documentId)).limit(1);
  
  if (!result || result.length === 0) {
    return false;
  }
  
  const doc = result[0];
  const client = await getWebDAVClient();
  
  // Delete from WebDAV
  if (client) {
    try {
      await client.deleteFile(doc.fileUrl);
    } catch (error) {
      console.error('[ContactDocuments] Failed to delete from WebDAV:', error);
    }
  }
  
  // Delete from database
  await db.delete(contactDocuments).where(eq(contactDocuments.id, documentId));
  
  return true;
}
