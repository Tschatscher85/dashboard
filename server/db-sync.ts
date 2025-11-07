import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { InsertProperty, properties } from "../drizzle/schema";

/**
 * Upsert property based on externalId
 * If property with externalId exists, update it. Otherwise, create new property.
 */
export async function upsertPropertyByExternalId(
  externalId: string,
  syncSource: string,
  propertyData: Partial<InsertProperty>,
  createdBy: number
): Promise<{ id: number; created: boolean }> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Check if property with this externalId already exists
  const existing = await db
    .select()
    .from(properties)
    .where(eq(properties.externalId, externalId))
    .limit(1);

  const now = new Date();

  if (existing.length > 0) {
    // Update existing property
    const propertyId = existing[0].id;
    
    await db
      .update(properties)
      .set({
        ...propertyData,
        syncSource,
        lastSyncedAt: now,
        updatedAt: now,
      })
      .where(eq(properties.id, propertyId));

    return { id: propertyId, created: false };
  } else {
    // Create new property
    const result = await db.insert(properties).values({
      ...propertyData,
      externalId,
      syncSource,
      lastSyncedAt: now,
      createdBy,
    } as InsertProperty);

    // Get the inserted property to return its ID
    const inserted = await db
      .select()
      .from(properties)
      .where(eq(properties.externalId, externalId))
      .limit(1);

    return { id: inserted[0].id, created: true };
  }
}

/**
 * Get property by externalId
 */
export async function getPropertyByExternalId(externalId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get property: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(properties)
    .where(eq(properties.externalId, externalId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}
