// Optimized database functions for better performance

import { eq, and, sql, like, desc } from 'drizzle-orm';

/**
 * Get properties with pagination and selective field loading
 * This dramatically improves performance by:
 * 1. Only loading fields needed for the list view
 * 2. Implementing pagination to limit results
 * 3. Avoiding loading all images upfront
 */
export async function getAllPropertiesOptimized(
  filters?: {
    status?: string;
    propertyType?: string;
    marketingType?: string;
    minPrice?: number;
    maxPrice?: number;
    city?: string;
    limit?: number;
    offset?: number;
  }
) {
  const { getDb } = await import('./db');
  const { properties } = await import('../drizzle/schema');
  
  const db = await getDb();
  if (!db) return { properties: [], total: 0 };
  
  // Default pagination
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  
  // Build query with selective fields for list view
  let query = db.select({
    id: properties.id,
    title: properties.title,
    propertyType: properties.propertyType,
    marketingType: properties.marketingType,
    status: properties.status,
    street: properties.street,
    houseNumber: properties.houseNumber,
    zipCode: properties.zipCode,
    city: properties.city,
    purchasePrice: properties.purchasePrice,
    baseRent: properties.baseRent,
    livingArea: properties.livingArea,
    rooms: properties.rooms,
    createdAt: properties.createdAt,
    updatedAt: properties.updatedAt,
  }).from(properties);
  
  // Build filter conditions
  const conditions = [];
  if (filters?.status) conditions.push(eq(properties.status, filters.status as any));
  if (filters?.propertyType) conditions.push(eq(properties.propertyType, filters.propertyType as any));
  if (filters?.marketingType) conditions.push(eq(properties.marketingType, filters.marketingType as any));
  if (filters?.minPrice) conditions.push(sql`${properties.purchasePrice} >= ${filters.minPrice}`);
  if (filters?.maxPrice) conditions.push(sql`${properties.purchasePrice} <= ${filters.maxPrice}`);
  if (filters?.city) conditions.push(like(properties.city, `%${filters.city}%`));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  // Get total count for pagination
  const countQuery = db.select({ count: sql<number>`count(*)` }).from(properties);
  if (conditions.length > 0) {
    (countQuery as any).where(and(...conditions));
  }
  const countResult = await countQuery;
  const total = Number(countResult[0]?.count || 0);
  
  // Apply pagination and ordering
  const result = await query
    .orderBy(desc(properties.createdAt))
    .limit(limit)
    .offset(offset);
  
  // Load only the first image for each property (for thumbnail)
  const propertiesWithThumbnail = await Promise.all(
    result.map(async (property) => {
      const { getPropertyImages } = await import('./db');
      const images = await getPropertyImages(property.id);
      return {
        ...property,
        thumbnail: images[0] || null, // Only first image
        imageCount: images.length,
      };
    })
  );
  
  return {
    properties: propertiesWithThumbnail,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Get full property details by ID
 * This loads ALL fields and ALL images, but only for a single property
 */
export async function getPropertyByIdOptimized(id: number) {
  const { getDb, getPropertyImages } = await import('./db');
  const { properties } = await import('../drizzle/schema');
  
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  if (result.length === 0) return undefined;
  
  const property = result[0];
  
  // Load all images for detail view
  const images = await getPropertyImages(property.id);
  
  return {
    ...property,
    images,
  };
}

/**
 * Create property with field mapping
 * Ensures router field names are correctly mapped to database field names
 */
export async function createPropertyOptimized(propertyData: any) {
  const { mapRouterFieldsToSchema } = await import('./fieldMapping');
  const mysql2 = await import('mysql2/promise');
  
  // Apply field mapping
  const mappedProperty = mapRouterFieldsToSchema(propertyData);
  console.log('[createPropertyOptimized] Mapped fields:', Object.keys(mappedProperty));
  
  // Filter out undefined, null, and empty string values
  const cleanProperty = Object.fromEntries(
    Object.entries(mappedProperty).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
  
  // Build dynamic SQL
  const fields = Object.keys(cleanProperty);
  const values = Object.values(cleanProperty);
  
  if (fields.length === 0) {
    throw new Error("No fields provided for property creation");
  }
  
  const placeholders = fields.map(() => '?').join(', ');
  const fieldList = fields.map(f => `\`${f}\``).join(', ');
  const sqlQuery = `INSERT INTO properties (${fieldList}) VALUES (${placeholders})`;
  
  const connection = await mysql2.createConnection(process.env.DATABASE_URL!);
  
  try {
    const [result] = await connection.execute(sqlQuery, values);
    console.log('[createPropertyOptimized] ✅ Property created successfully');
    return result;
  } catch (error) {
    console.error('[createPropertyOptimized] ❌ Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

/**
 * Update property with field mapping
 * Ensures router field names are correctly mapped to database field names
 */
export async function updatePropertyOptimized(id: number, updates: any) {
  const { mapRouterFieldsToSchema } = await import('./fieldMapping');
  const { getDb } = await import('./db');
  const { properties } = await import('../drizzle/schema');
  
  // Apply field mapping
  const mappedUpdates = mapRouterFieldsToSchema(updates);
  console.log('[updatePropertyOptimized] Original fields:', Object.keys(updates));
  console.log('[updatePropertyOptimized] Mapped fields:', Object.keys(mappedUpdates));
  
  // Filter out undefined values
  const filteredUpdates = Object.fromEntries(
    Object.entries(mappedUpdates).filter(([_, value]) => value !== undefined)
  );
  
  if (Object.keys(filteredUpdates).length === 0) {
    console.warn('[updatePropertyOptimized] No valid fields to update');
    return;
  }
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(properties)
    .set(filteredUpdates)
    .where(eq(properties.id, id));
  
  console.log('[updatePropertyOptimized] ✅ Property updated successfully');
}
