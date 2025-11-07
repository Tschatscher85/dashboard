import { createClient, WebDAVClient } from "webdav";
import { ENV } from "./_core/env";

let _client: WebDAVClient | null = null;

/**
 * Get or create WebDAV client for NAS connection
 */
export function getNasClient(): WebDAVClient {
  if (!_client) {
    const nasUrl = process.env.NAS_WEBDAV_URL || "";
    const nasUsername = process.env.NAS_USERNAME || "";
    const nasPassword = process.env.NAS_PASSWORD || "";

    if (!nasUrl || !nasUsername || !nasPassword) {
      throw new Error("NAS credentials not configured. Please set NAS_WEBDAV_URL, NAS_USERNAME, and NAS_PASSWORD in settings.");
    }

    _client = createClient(nasUrl, {
      username: nasUsername,
      password: nasPassword,
    });
  }

  return _client;
}

/**
 * Get base path for property files on NAS
 */
export function getPropertyBasePath(): string {
  return process.env.NAS_BASE_PATH || "/volume1/Daten/Allianz/Agentur Jaeger/Beratung/Immobilienmakler/Verkauf";
}

/**
 * Generate folder name from property address
 * Example: "Klingenweg 15, 73312 Geislingen an der Steige"
 */
export function getPropertyFolderName(street: string, houseNumber: string, postalCode: string, city: string): string {
  return `${street} ${houseNumber}, ${postalCode} ${city}`;
}

/**
 * Get full path for property images folder
 */
export function getPropertyImagesPath(street: string, houseNumber: string, postalCode: string, city: string): string {
  const basePath = getPropertyBasePath();
  const folderName = getPropertyFolderName(street, houseNumber, postalCode, city);
  return `${basePath}/${folderName}/Bilder`;
}

/**
 * Get full path for property documents folder
 */
export function getPropertyDocumentsPath(street: string, houseNumber: string, postalCode: string, city: string): string {
  const basePath = getPropertyBasePath();
  const folderName = getPropertyFolderName(street, houseNumber, postalCode, city);
  return `${basePath}/${folderName}/Objektunterlagen`;
}

/**
 * Ensure directory exists on NAS, create if it doesn't
 */
export async function ensureDirectoryExists(path: string): Promise<void> {
  const client = getNasClient();
  
  try {
    const exists = await client.exists(path);
    if (!exists) {
      await client.createDirectory(path, { recursive: true });
      console.log(`[NAS] Created directory: ${path}`);
    }
  } catch (error) {
    console.error(`[NAS] Failed to create directory ${path}:`, error);
    throw error;
  }
}

/**
 * Upload file to NAS
 */
export async function uploadFileToNas(
  localPath: string,
  remotePath: string,
  fileBuffer: Buffer
): Promise<void> {
  const client = getNasClient();

  try {
    // Ensure parent directory exists
    const parentDir = remotePath.substring(0, remotePath.lastIndexOf("/"));
    await ensureDirectoryExists(parentDir);

    // Upload file
    await client.putFileContents(remotePath, fileBuffer, {
      overwrite: true,
    });

    console.log(`[NAS] Uploaded file: ${remotePath}`);
  } catch (error) {
    console.error(`[NAS] Failed to upload file ${remotePath}:`, error);
    throw error;
  }
}

/**
 * Delete file from NAS
 */
export async function deleteFileFromNas(remotePath: string): Promise<void> {
  const client = getNasClient();

  try {
    await client.deleteFile(remotePath);
    console.log(`[NAS] Deleted file: ${remotePath}`);
  } catch (error) {
    console.error(`[NAS] Failed to delete file ${remotePath}:`, error);
    throw error;
  }
}

/**
 * List files in directory on NAS
 */
export async function listFilesInDirectory(path: string): Promise<any[]> {
  const client = getNasClient();

  try {
    const contents = await client.getDirectoryContents(path);
    return contents as any[];
  } catch (error) {
    console.error(`[NAS] Failed to list files in ${path}:`, error);
    return [];
  }
}

/**
 * Get public URL for file on NAS
 * This assumes the NAS is publicly accessible via the configured domain
 */
export function getPublicFileUrl(remotePath: string): string {
  const nasUrl = process.env.NAS_WEBDAV_URL || "";
  const publicDomain = process.env.NAS_PUBLIC_DOMAIN || nasUrl;
  
  // Remove /volume1 prefix if present and construct public URL
  const cleanPath = remotePath.replace("/volume1", "");
  return `${publicDomain}${cleanPath}`;
}
