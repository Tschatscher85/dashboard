import * as ftp from 'basic-ftp';
import { Readable } from 'stream';

/**
 * FTP Client for NAS integration
 * 
 * Folder structure on NAS:
 * /Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf/
 *   └── [Straße Hausnummer, PLZ Ort]/
 *       ├── Bilder/              (public - for exposé, landing page)
 *       ├── Objektunterlagen/    (public - for prospects)
 *       ├── Sensible Daten/      (internal only)
 *       └── Vertragsunterlagen/  (not visible in app, NAS only)
 */

interface FTPConfig {
  host: string;
  port?: number;
  user: string;
  password: string;
  secure?: boolean; // Use FTPS (FTP over TLS)
}

/**
 * Base path for property files on NAS
 */
const BASE_PATH = '/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf';

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
 * Create FTP client and connect
 */
async function createFTPClient(config: FTPConfig): Promise<ftp.Client> {
  const client = new ftp.Client();
  client.ftp.verbose = false; // Disable verbose logging

  try {
    await client.access({
      host: config.host,
      port: config.port || 21,
      user: config.user,
      password: config.password,
      secure: config.secure || false,
      secureOptions: config.secure ? {
        rejectUnauthorized: false, // Allow self-signed certificates
      } : undefined,
    });

    return client;
  } catch (error: any) {
    console.error('[FTP] Connection failed:', error);
    throw new Error(`FTP-Verbindung fehlgeschlagen: ${error.message}`);
  }
}

/**
 * Ensure directory exists (create if not)
 */
async function ensureDirectory(client: ftp.Client, path: string): Promise<void> {
  try {
    // Try to change to directory
    await client.cd(path);
  } catch (error) {
    // Directory doesn't exist, create it
    try {
      await client.ensureDir(path);
      console.log(`[FTP] Created directory: ${path}`);
    } catch (createError: any) {
      console.error(`[FTP] Failed to create directory ${path}:`, createError);
      throw new Error(`Ordner konnte nicht erstellt werden: ${createError.message}`);
    }
  }
}

/**
 * Ensure property folder structure exists on NAS
 */
export async function ensurePropertyFolders(
  config: FTPConfig,
  propertyFolderName: string
): Promise<void> {
  const client = await createFTPClient(config);

  try {
    const propertyPath = getPropertyPath(propertyFolderName);

    // Create main property folder
    await ensureDirectory(client, propertyPath);

    // Create category subfolders
    for (const category of PROPERTY_CATEGORIES) {
      const categoryPath = getCategoryPath(propertyFolderName, category);
      await ensureDirectory(client, categoryPath);
    }

    console.log(`[FTP] Property folders ensured: ${propertyPath}`);
  } finally {
    client.close();
  }
}

/**
 * Upload file to NAS via FTP
 */
export async function uploadFile(
  config: FTPConfig,
  propertyFolderName: string,
  category: string,
  fileName: string,
  fileBuffer: Buffer
): Promise<string> {
  const client = await createFTPClient(config);

  try {
    // Ensure folders exist
    await ensurePropertyFolders(config, propertyFolderName);

    // Upload file
    const filePath = `${getCategoryPath(propertyFolderName, category)}/${fileName}`;
    
    // Change to target directory
    const targetDir = getCategoryPath(propertyFolderName, category);
    await client.cd(targetDir);

    // Upload file from buffer (convert to Readable stream)
    const stream = Readable.from(fileBuffer);
    await client.uploadFrom(stream, fileName);

    console.log(`[FTP] Uploaded file: ${filePath}`);
    return filePath;
  } catch (error: any) {
    console.error('[FTP] Error uploading file:', error);
    
    // Provide more specific error messages
    if (error.message?.includes('ECONNREFUSED')) {
      throw new Error('FTP-Verbindung fehlgeschlagen: Server nicht erreichbar');
    } else if (error.message?.includes('ETIMEDOUT')) {
      throw new Error('FTP-Verbindung fehlgeschlagen: Zeitüberschreitung');
    } else if (error.message?.includes('530')) {
      throw new Error('FTP-Verbindung fehlgeschlagen: Zugangsdaten ungültig');
    } else {
      throw new Error(`FTP-Upload fehlgeschlagen: ${error.message || 'Unbekannter Fehler'}`);
    }
  } finally {
    client.close();
  }
}

/**
 * Delete file from NAS via FTP
 */
export async function deleteFile(
  config: FTPConfig,
  filePath: string
): Promise<void> {
  const client = await createFTPClient(config);

  try {
    await client.remove(filePath);
    console.log(`[FTP] Deleted file: ${filePath}`);
  } catch (error: any) {
    console.error('[FTP] Error deleting file:', error);
    throw new Error(`Datei konnte nicht gelöscht werden: ${error.message}`);
  } finally {
    client.close();
  }
}

/**
 * List files in a category folder
 */
export async function listFiles(
  config: FTPConfig,
  propertyFolderName: string,
  category: string
): Promise<Array<{ filename: string; basename: string; size: number; type: string }>> {
  const client = await createFTPClient(config);

  try {
    const categoryPath = getCategoryPath(propertyFolderName, category);
    
    // Try to change to directory
    try {
      await client.cd(categoryPath);
    } catch (error) {
      // Directory doesn't exist, return empty array
      return [];
    }

    const files = await client.list();
    
    return files
      .filter(file => file.type === ftp.FileType.File)
      .map(file => ({
        filename: `${categoryPath}/${file.name}`,
        basename: file.name,
        size: file.size,
        type: 'file',
      }));
  } catch (error) {
    console.error('[FTP] Error listing files:', error);
    return [];
  } finally {
    client.close();
  }
}

/**
 * Test FTP connection
 */
export async function testConnection(config: FTPConfig): Promise<boolean> {
  try {
    const client = await createFTPClient(config);
    
    // Try to access base path
    try {
      await client.cd(BASE_PATH);
    } catch (error) {
      console.log('[FTP] Base path does not exist, but connection is OK');
    }
    
    client.close();
    return true;
  } catch (error) {
    console.error('[FTP] Connection test failed:', error);
    return false;
  }
}
