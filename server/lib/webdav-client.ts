import { createClient, WebDAVClient } from 'webdav';

/**
 * WebDAV Client for Synology NAS integration
 * 
 * Folder structure on NAS:
 * /volume1/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf/
 *   └── [Straße Hausnummer, PLZ Ort]/
 *       ├── Bilder/              (public - for exposé, landing page)
 *       ├── Objektunterlagen/    (public - for prospects)
 *       ├── Sensible Daten/      (internal only)
 *       └── Vertragsunterlagen/  (not visible in app, NAS only)
 */

let webdavClient: WebDAVClient | null = null;

interface WebDAVConfig {
  url: string;
  username: string;
  password: string;
}

/**
 * Get WebDAV client instance (singleton pattern)
 */
export function getWebDAVClient(config?: WebDAVConfig): WebDAVClient {
  if (!webdavClient) {
    let url = config?.url || process.env.NAS_WEBDAV_URL || 'https://ugreen.tschatscher.eu:2002';
    // Remove trailing slash if present (causes connection issues)
    if (url.endsWith('/')) {
      url = url.slice(0, -1);
    }
    const username = config?.username || process.env.NAS_USERNAME || 'tschatscher';
    const password = config?.password || process.env.NAS_PASSWORD || '';

    console.log('[WebDAV] Initializing client with config:', {
      url,
      username,
      hasPassword: !!password,
      basePath: BASE_PATH,
    });

    webdavClient = createClient(url, {
      username,
      password,
    });
  }

  return webdavClient;
}

/**
 * Reset WebDAV client (useful for testing or config changes)
 */
export function resetWebDAVClient(): void {
  webdavClient = null;
}

/**
 * Base path for property files on NAS
 * Note: This is the WebDAV-relative path, not the filesystem path.
 * The /volume1/ prefix is handled by the NAS internally.
 */
const BASE_PATH = '/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf';

/**
 * Generate property folder name from address
 * Format: "Straße Hausnummer, PLZ Ort"
 */
export function getPropertyFolderName(property: {
  street?: string | null;
  houseNumber?: string | null;
  zipCode?: string | null;
  city?: string | null;
}): string {
  const street = property.street || 'Unbekannte Straße';
  const houseNumber = property.houseNumber || '';
  const zipCode = property.zipCode || '';
  const city = property.city || 'Unbekannte Stadt';

  return `${street} ${houseNumber}, ${zipCode} ${city}`.trim();
}

/**
 * Get full path for property folder
 */
export function getPropertyPath(propertyFolderName: string): string {
  return `${BASE_PATH}/${propertyFolderName}`;
}

/**
 * Get full path for category folder
 */
export function getCategoryPath(propertyFolderName: string, category: string): string {
  return `${getPropertyPath(propertyFolderName)}/${category}`;
}

/**
 * Category folders that should be created for each property
 */
export const PROPERTY_CATEGORIES = [
  'Bilder',
  'Objektunterlagen',
  'Sensible Daten',
  'Vertragsunterlagen',
] as const;

/**
 * Ensure property folder structure exists on NAS
 */
export async function ensurePropertyFolders(propertyFolderName: string): Promise<void> {
  const client = getWebDAVClient();
  const propertyPath = getPropertyPath(propertyFolderName);

  console.log('[WebDAV] Ensuring folders for property:', propertyFolderName);
  console.log('[WebDAV] Property path:', propertyPath);

  try {
    // Create main property folder
    console.log('[WebDAV] Checking if property folder exists...');
    const exists = await client.exists(propertyPath);
    console.log('[WebDAV] Property folder exists:', exists);
    
    if (!exists) {
      console.log('[WebDAV] Creating property folder:', propertyPath);
      await client.createDirectory(propertyPath, { recursive: true });
      console.log(`[WebDAV] ✓ Created property folder: ${propertyPath}`);
    }

    // Create category subfolders
    for (const category of PROPERTY_CATEGORIES) {
      const categoryPath = getCategoryPath(propertyFolderName, category);
      console.log(`[WebDAV] Checking category folder: ${category}`);
      const categoryExists = await client.exists(categoryPath);
      
      if (!categoryExists) {
        console.log(`[WebDAV] Creating category folder: ${categoryPath}`);
        await client.createDirectory(categoryPath);
        console.log(`[WebDAV] ✓ Created category folder: ${category}`);
      }
    }
    
    console.log('[WebDAV] ✓ All folders ready');
  } catch (error: any) {
    console.error('[WebDAV] ✗ Error creating folders');
    console.error('[WebDAV] Error details:', {
      message: error.message,
      status: error.status,
      response: error.response?.statusText,
    });
    throw new Error(`Failed to create property folders: ${error.message || error}`);
  }
}

/**
 * Upload file to NAS
 */
export async function uploadFile(
  propertyFolderName: string,
  category: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<string> {
  const client = getWebDAVClient();

  try {
    // Test connection first
    const connectionOk = await testConnection();
    if (!connectionOk) {
      throw new Error('NAS nicht erreichbar. Bitte prüfen Sie die Netzwerkverbindung.');
    }

    // Ensure folders exist
    await ensurePropertyFolders(propertyFolderName);

    // Upload file
    const filePath = `${getCategoryPath(propertyFolderName, category)}/${fileName}`;
    await client.putFileContents(filePath, fileBuffer, {
      overwrite: true,
    });

    console.log(`[WebDAV] Uploaded file: ${filePath}`);
    return filePath;
  } catch (error: any) {
    console.error('[WebDAV] Error uploading file:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('ECONNREFUSED')) {
      throw new Error('NAS-Verbindung fehlgeschlagen: Server nicht erreichbar');
    } else if (error.message?.includes('ETIMEDOUT')) {
      throw new Error('NAS-Verbindung fehlgeschlagen: Zeitüberschreitung');
    } else if (error.message?.includes('401')) {
      throw new Error('NAS-Verbindung fehlgeschlagen: Zugangsdaten ungültig');
    } else if (error.message?.includes('nicht erreichbar')) {
      throw error; // Already has good message
    } else {
      throw new Error(`Upload fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`);
    }
  }
}

/**
 * Delete file from NAS
 */
export async function deleteFile(filePath: string): Promise<void> {
  const client = getWebDAVClient();

  try {
    const exists = await client.exists(filePath);
    if (exists) {
      await client.deleteFile(filePath);
      console.log(`[WebDAV] Deleted file: ${filePath}`);
    }
  } catch (error) {
    console.error('[WebDAV] Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error}`);
  }
}

/**
 * List files in a category folder
 */
export async function listFiles(
  propertyFolderName: string,
  category: string
): Promise<Array<{ filename: string; basename: string; size: number; type: string }>> {
  const client = getWebDAVClient();
  const categoryPath = getCategoryPath(propertyFolderName, category);

  try {
    const exists = await client.exists(categoryPath);
    if (!exists) {
      return [];
    }

    const contents = await client.getDirectoryContents(categoryPath) as any[];
    return contents.map((item: any) => ({
      filename: item.filename,
      basename: item.basename,
      size: item.size,
      type: item.type,
    }));
  } catch (error) {
    console.error('[WebDAV] Error listing files:', error);
    return [];
  }
}

/**
 * Get file content from NAS
 */
export async function getFileContent(filePath: string): Promise<Buffer> {
  const client = getWebDAVClient();

  try {
    const content = await client.getFileContents(filePath);
    return Buffer.from(content as ArrayBuffer);
  } catch (error) {
    console.error('[WebDAV] Error getting file content:', error);
    throw new Error(`Failed to get file content: ${error}`);
  }
}

/**
 * Check if WebDAV connection is working
 */
export async function testConnection(): Promise<boolean> {
  const client = getWebDAVClient();

  console.log('[WebDAV] Testing connection to:', BASE_PATH);
  
  try {
    const exists = await client.exists(BASE_PATH);
    console.log('[WebDAV] ✓ Connection successful, base path exists:', exists);
    return true;
  } catch (error: any) {
    console.error('[WebDAV] ✗ Connection test failed');
    console.error('[WebDAV] Error details:', {
      message: error.message,
      status: error.status,
      code: error.code,
    });
    return false;
  }
}
