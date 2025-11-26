import { eq, desc, asc, and, or, like, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
// For PostgreSQL migration: import { drizzle } from "drizzle-orm/postgres-js";
// For PostgreSQL migration: import postgres from "postgres";
import { 
  InsertUser, users,
  properties, InsertProperty,
  contacts, InsertContact,
  propertyImages, InsertPropertyImage,
  documents, InsertDocument,
  propertyLinks, InsertPropertyLink,
  appointments, InsertAppointment,
  leads, InsertLead,
  insurances, InsertInsurance,
  contactTags, InsertContactTag,
  contactTagAssignments, InsertContactTagAssignment,
  kanbanBoards, InsertKanbanBoard,
  kanbanColumns, InsertKanbanColumn,
  kanbanCards, InsertKanbanCard,
  customerUsers, InsertCustomerUser,
  documentTemplates, InsertDocumentTemplate
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      // For PostgreSQL: const client = postgres(process.env.DATABASE_URL); _db = drizzle(client);
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(users).orderBy(users.createdAt);
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete user: database not available");
    return;
  }
  
  await db.delete(users).where(eq(users.id, id));
}

// ============ PROPERTY OPERATIONS ============

export async function createProperty(property: InsertProperty) {
  // Filter out undefined, null, and empty string values
  const cleanProperty = Object.fromEntries(
    Object.entries(property).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
  
  // Build dynamic SQL with only provided fields
  const fields = Object.keys(cleanProperty);
  const values = Object.values(cleanProperty);
  
  if (fields.length === 0) {
    throw new Error("No fields provided for property creation");
  }
  
  const placeholders = fields.map(() => '?').join(', ');
  const fieldList = fields.map(f => `\`${f}\``).join(', ');
  const sql = `INSERT INTO properties (${fieldList}) VALUES (${placeholders})`;
  
  // Use mysql2 directly
  const mysql2 = await import('mysql2/promise');
  const connection = await mysql2.createConnection(process.env.DATABASE_URL!);
  
  try {
    const [result] = await connection.execute(sql, values);
    return result;
  } finally {
    await connection.end();
  }
}

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  if (result.length === 0) return undefined;
  
  const property = result[0];
  // Convert Date objects to ISO strings for frontend
  if (property.availableFrom && property.availableFrom instanceof Date) {
    (property as any).availableFrom = property.availableFrom.toISOString().split('T')[0];
  }
  
  // Load images for this property
  const images = await getPropertyImages(id);
  
  return {
    ...property,
    images,
  };
}

export async function getPropertyBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(properties)
    .where(eq(properties.landingPageSlug, slug))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllProperties(filters?: {
  status?: string;
  propertyType?: string;
  marketingType?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(properties);
  
  const conditions = [];
  if (filters?.status) conditions.push(eq(properties.status, filters.status as any));
  if (filters?.propertyType) conditions.push(eq(properties.propertyType, filters.propertyType as any));
  if (filters?.marketingType) conditions.push(eq(properties.marketingType, filters.marketingType as any));
  if (filters?.minPrice) conditions.push(sql`${properties.price} >= ${filters.minPrice}`);
  if (filters?.maxPrice) conditions.push(sql`${properties.price} <= ${filters.maxPrice}`);
  if (filters?.city) conditions.push(like(properties.city, `%${filters.city}%`));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const result = await query.orderBy(sql`createdAt DESC`);
  
  // Load images for each property
  const propertiesWithImages = await Promise.all(
    result.map(async (property) => {
      const images = await getPropertyImages(property.id);
      return {
        ...property,
        images,
      };
    })
  );
  
  return propertiesWithImages;
}

export async function updateProperty(id: number, updates: Partial<InsertProperty> & { availableFrom?: string | Date | null, [key: string]: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.log('[Database] updateProperty called with:', JSON.stringify({ id, updates }, null, 2));
  
  // Process updates: convert string dates to Date objects
  const processedUpdates: any = { ...updates };
  if (updates.availableFrom && typeof updates.availableFrom === 'string') {
    processedUpdates.availableFrom = new Date(updates.availableFrom);
  }
  
  // Remove any undefined values
  Object.keys(processedUpdates).forEach(key => {
    if (processedUpdates[key] === undefined) {
      delete processedUpdates[key];
    }
  });
  
  console.log('[Database] Processed updates:', JSON.stringify(processedUpdates, null, 2));
  
  const result = await db.update(properties).set(processedUpdates as Partial<InsertProperty>).where(eq(properties.id, id));
  
  console.log('[Database] Update result:', result);
  
  return result;
}

export async function deleteProperty(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(properties).where(eq(properties.id, id));
  return result;
}

// ============ CONTACT OPERATIONS ============

export async function createContact(contact: InsertContact) {
  // Filter out undefined, null, and empty string values
  const cleanContact = Object.fromEntries(
    Object.entries(contact).filter(([_, v]) => v !== undefined && v !== null && v !== '')
  );
  
  // Build dynamic SQL with only provided fields
  const fields = Object.keys(cleanContact);
  const values = Object.values(cleanContact);
  
  if (fields.length === 0) {
    throw new Error("No fields provided for contact creation");
  }
  
  const placeholders = fields.map(() => '?').join(', ');
  const fieldList = fields.map(f => `\`${f}\``).join(', ');
  const sql = `INSERT INTO contacts (${fieldList}) VALUES (${placeholders})`;
  
  // Use mysql2 directly
  const mysql2 = await import('mysql2/promise');
  const connection = await mysql2.createConnection(process.env.DATABASE_URL!);
  
  try {
    const [result] = await connection.execute(sql, values);
    return result;
  } finally {
    await connection.end();
  }
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllContacts(filters?: {
  // Module filters
  moduleImmobilienmakler?: boolean;
  moduleVersicherungen?: boolean;
  moduleHausverwaltung?: boolean;
  // Type & Category filters
  contactType?: "kunde" | "partner" | "dienstleister" | "sonstiges";
  contactCategory?: string;
  // Search
  searchTerm?: string;
  // Status filters
  archived?: boolean;
  // Pagination
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(contacts);
  
  const conditions = [];
  
  // Module filters
  if (filters?.moduleImmobilienmakler !== undefined) {
    conditions.push(eq(contacts.moduleImmobilienmakler, filters.moduleImmobilienmakler));
  }
  if (filters?.moduleVersicherungen !== undefined) {
    conditions.push(eq(contacts.moduleVersicherungen, filters.moduleVersicherungen));
  }
  if (filters?.moduleHausverwaltung !== undefined) {
    conditions.push(eq(contacts.moduleHausverwaltung, filters.moduleHausverwaltung));
  }
  
  // Type & Category filters
  if (filters?.contactType) {
    conditions.push(eq(contacts.contactType, filters.contactType));
  }
  if (filters?.contactCategory) {
    conditions.push(eq(contacts.contactCategory, filters.contactCategory));
  }
  
  // Archived filter
  if (filters?.archived !== undefined) {
    conditions.push(eq(contacts.archived, filters.archived));
  }
  
  // Search term
  if (filters?.searchTerm) {
    conditions.push(
      or(
        like(contacts.firstName, `%${filters.searchTerm}%`),
        like(contacts.lastName, `%${filters.searchTerm}%`),
        like(contacts.email, `%${filters.searchTerm}%`),
        like(contacts.companyName, `%${filters.searchTerm}%`)
      )!
    );
  }
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  // Order by creation date (newest first)
  query = query.orderBy(desc(contacts.createdAt)) as any;
  
  // Pagination
  if (filters?.limit) {
    query = query.limit(filters.limit) as any;
  }
  if (filters?.offset) {
    query = query.offset(filters.offset) as any;
  }
  
  const result = await query;
  return result;
}

export async function updateContact(id: number, updates: Partial<InsertContact>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(contacts).set(updates).where(eq(contacts.id, id));
  return result;
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(contacts).where(eq(contacts.id, id));
  return result;
}

// ============ PROPERTY IMAGE OPERATIONS ============

export async function createPropertyImage(image: InsertPropertyImage) {
  console.log('[Database] createPropertyImage called with:', JSON.stringify(image, null, 2));
  
  if (!process.env.DATABASE_URL) {
    console.error('[Database] DATABASE_URL not set!');
    throw new Error("Database not available");
  }
  
  // Use direct mysql2 connection instead of Drizzle
  const mysql2 = await import('mysql2/promise');
  console.log('[Database] Creating mysql2 connection...');
  
  let connection;
  try {
    // Add timeout to prevent hanging
    const connectionPromise = mysql2.createConnection(process.env.DATABASE_URL);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout after 5 seconds')), 5000)
    );
    
    connection = await Promise.race([connectionPromise, timeoutPromise]) as any;
    console.log('[Database] ✅ Connection established!');
  } catch (connError: any) {
    console.error('[Database] ❌ Connection failed:', connError.message);
    throw new Error(`Database connection failed: ${connError.message}`);
  }
  
  try {
    console.log('[Database] Executing INSERT query...');
    const [result] = await connection.execute(
      `INSERT INTO propertyImages 
       (propertyId, imageUrl, nasPath, title, description, imageType, sortOrder, category, displayName, showOnLandingPage, isFeatured) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        image.propertyId,
        image.imageUrl,
        image.nasPath || null,
        image.title || null,
        image.description || null,
        image.imageType || 'sonstiges', // Use provided imageType or default to 'sonstiges'
        image.sortOrder ?? 0,
        image.category || null,
        image.displayName || null,
        image.showOnLandingPage ?? 1,
        image.isFeatured ?? 0,
      ]
    );
    console.log('[Database] ✅ INSERT successful! Result:', result);
    return result;
  } catch (error) {
    console.error('[Database] ❌ INSERT failed:', error);
    throw error;
  } finally {
    console.log('[Database] Closing connection...');
    await connection.end();
  }
}

export async function getPropertyImages(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId))
    .orderBy(propertyImages.sortOrder);
  return result;
}

export async function deletePropertyImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // First, get the image to find its S3 key
  const image = await db.select().from(propertyImages).where(eq(propertyImages.id, id)).limit(1);
  
  if (image.length > 0) {
    const imageData = image[0];
    
    // If image is stored on S3 (has imageUrl), delete from S3
    if (imageData.imageUrl && imageData.imageUrl.includes('storage')) {
      try {
        const { storageDelete } = await import('./storage');
        // Extract S3 key from URL or use nasPath as fallback
        const s3Key = imageData.nasPath || imageData.imageUrl.split('/').slice(-3).join('/');
        await storageDelete(s3Key);
        console.log(`[Delete] Deleted image from S3: ${s3Key}`);
      } catch (error) {
        console.error('[Delete] Failed to delete from S3:', error);
        // Continue with database deletion even if S3 deletion fails
      }
    }
  }
  
  // Delete from database
  const result = await db.delete(propertyImages).where(eq(propertyImages.id, id));
  return result;
}

// ============ DOCUMENT OPERATIONS ============

export async function createDocument(document: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(documents).values(document);
  return result;
}

export async function getDocumentsByProperty(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(documents)
    .where(eq(documents.propertyId, propertyId))
    .orderBy(desc(documents.createdAt));
  return result;
}

export async function getDocumentsByContact(contactId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(documents)
    .where(eq(documents.contactId, contactId))
    .orderBy(desc(documents.createdAt));
  return result;
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(documents).where(eq(documents.id, id));
  return result;
}

// ============ PROPERTY LINKS OPERATIONS ============

export async function createPropertyLink(link: InsertPropertyLink) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(propertyLinks).values(link);
  return result[0]?.insertId || 0;
}

export async function getPropertyLinksByPropertyId(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(propertyLinks)
    .where(eq(propertyLinks.propertyId, propertyId))
    .orderBy(propertyLinks.sortOrder, propertyLinks.createdAt);
  return result;
}

export async function updatePropertyLink(id: number, updates: Partial<InsertPropertyLink>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(propertyLinks).set(updates).where(eq(propertyLinks.id, id));
  return result;
}

export async function deletePropertyLink(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(propertyLinks).where(eq(propertyLinks.id, id));
  return result;
}

// ============ APPOINTMENT OPERATIONS ============

export async function createAppointment(appointment: InsertAppointment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(appointments).values(appointment);
  
  // Get the last inserted appointment
  const result = await db.select().from(appointments)
    .orderBy(desc(appointments.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getAppointmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(appointments).where(eq(appointments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAppointments(filters?: {
  propertyId?: number;
  contactId?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(appointments);
  
  const conditions = [];
  if (filters?.propertyId) conditions.push(eq(appointments.propertyId, filters.propertyId));
  if (filters?.contactId) conditions.push(eq(appointments.contactId, filters.contactId));
  if (filters?.status) conditions.push(eq(appointments.status, filters.status as any));
  if (filters?.startDate) conditions.push(sql`${appointments.startTime} >= ${filters.startDate}`);
  if (filters?.endDate) conditions.push(sql`${appointments.endTime} <= ${filters.endDate}`);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const result = await query.orderBy(appointments.startTime);
  return result;
}

export async function updateAppointment(id: number, updates: Partial<InsertAppointment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(appointments).set(updates).where(eq(appointments.id, id));
  return result;
}

export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(appointments).where(eq(appointments.id, id));
  return result;
}

// ============ ACTIVITY OPERATIONS ============

// export async function createActivity(activity: InsertActivity) {
//   const db = await getDb();
//   if (!db) throw new Error("Database not available");
//   
//   const result = await db.insert(activities).values(activity);
//   return result;
// }
// 
// export async function getActivitiesByProperty(propertyId: number) {
//   const db = await getDb();
//   if (!db) return [];
//   
//   const result = await db.select().from(activities)
//     .where(eq(activities.propertyId, propertyId))
//     .orderBy(desc(activities.createdAt));
//   return result;
// }
// 
// export async function getActivitiesByContact(contactId: number) {
//   const db = await getDb();
//   if (!db) return [];
//   
//   const result = await db.select().from(activities)
//     .where(eq(activities.contactId, contactId))
//     .orderBy(desc(activities.createdAt));
//   return result;
// }

// ============ LEAD OPERATIONS ============

export async function createLead(lead: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(leads).values(lead);
  return result;
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllLeads(filters?: {
  status?: string;
  propertyId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(leads);
  
  const conditions = [];
  if (filters?.status) conditions.push(eq(leads.status, filters.status as any));
  if (filters?.propertyId) conditions.push(eq(leads.propertyId, filters.propertyId));
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const result = await query.orderBy(desc(leads.createdAt));
  return result;
}

export async function updateLead(id: number, updates: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(leads).set(updates).where(eq(leads.id, id));
  return result;
}

export async function deleteLead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(leads).where(eq(leads.id, id));
  return result;
}

// ============ STATISTICS ============

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;
  
  const [propertiesCount] = await db.select({ count: sql<number>`count(*)` }).from(properties);
  const [contactsCount] = await db.select({ count: sql<number>`count(*)` }).from(contacts);
  const [leadsCount] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.status, 'new'));
  const [appointmentsCount] = await db.select({ count: sql<number>`count(*)` }).from(appointments)
    .where(eq(appointments.status, 'scheduled'));
  
  // Property status distribution
  const statusDistribution = await db.select({
    status: properties.status,
    count: sql<number>`count(*)`
  })
  .from(properties)
  .groupBy(properties.status);
  
  const statusLabels: Record<string, string> = {
    'acquisition': 'Akquisition',
    'preparation': 'Vorbereitung',
    'marketing': 'Vermarktung',
    'negotiation': 'Verhandlung',
    'reserved': 'Reserviert',
    'sold': 'Verkauft',
    'rented': 'Vermietet',
    'inactive': 'Inaktiv',
  };
  
  const propertyStatusDistribution = statusDistribution.map(item => ({
    name: statusLabels[item.status || ''] || item.status,
    value: Number(item.count)
  }));
  
  // Upcoming appointments (next 7 days)
  const now = new Date();
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(now.getDate() + 7);
  
  const upcomingAppointmentsList = await db.select()
    .from(appointments)
    .where(
      and(
        gte(appointments.startTime, now),
        lte(appointments.startTime, sevenDaysLater),
        eq(appointments.status, 'scheduled')
      )
    )
    .orderBy(asc(appointments.startTime))
    .limit(5);
  
  return {
    totalProperties: Number(propertiesCount.count),
    totalContacts: Number(contactsCount.count),
    newLeads: Number(leadsCount.count),
    upcomingAppointments: Number(appointmentsCount.count),
    propertyStatusDistribution,
    upcomingAppointmentsList,
  };
}

// ============ INSURANCES ============

export async function getAllInsurances(filters?: { type?: string; status?: string }) {
  const db = await getDb();
  if (!db) return [];

  const { insurancePolicies } = await import("../drizzle/schema");
  
  let query = db.select().from(insurancePolicies);
  
  const conditions = [];
  if (filters?.type) conditions.push(sql`${insurancePolicies.insuranceType} = ${filters.type}`);
  if (filters?.status) conditions.push(sql`${insurancePolicies.status} = ${filters.status}`);
  
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }
  
  const result = await query.orderBy(desc(insurancePolicies.createdAt));
  return result;
}

export async function getInsuranceById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const { insurancePolicies } = await import("../drizzle/schema");
  
  const result = await db.select().from(insurancePolicies).where(eq(insurancePolicies.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createInsurance(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { insurancePolicies } = await import("../drizzle/schema");
  
  const result = await db.insert(insurancePolicies).values(data);
  return result;
}

export async function updateInsurance(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { insurancePolicies } = await import("../drizzle/schema");
  
  const result = await db.update(insurancePolicies).set(updates).where(eq(insurancePolicies.id, id));
  return result;
}

export async function deleteInsurance(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { insurancePolicies } = await import("../drizzle/schema");
  
  const result = await db.delete(insurancePolicies).where(eq(insurancePolicies.id, id));
  return result;
}

// ============ PROPERTY MANAGEMENT ============

export async function getAllPropertyManagementContracts() {
  const db = await getDb();
  if (!db) return [];

  const { propertyManagementContracts } = await import("../drizzle/schema");
  
  const result = await db.select().from(propertyManagementContracts).orderBy(desc(propertyManagementContracts.createdAt));
  return result;
}

export async function createPropertyManagementContract(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { propertyManagementContracts } = await import("../drizzle/schema");
  
  const result = await db.insert(propertyManagementContracts).values(data);
  return result;
}

export async function updatePropertyManagementContract(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { propertyManagementContracts } = await import("../drizzle/schema");
  
  const result = await db.update(propertyManagementContracts).set(updates).where(eq(propertyManagementContracts.id, id));
  return result;
}

export async function deletePropertyManagementContract(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { propertyManagementContracts } = await import("../drizzle/schema");
  
  const result = await db.delete(propertyManagementContracts).where(eq(propertyManagementContracts.id, id));
  return result;
}

export async function getAllMaintenanceRecords() {
  const db = await getDb();
  if (!db) return [];

  const { maintenanceRecords } = await import("../drizzle/schema");
  
  const result = await db.select().from(maintenanceRecords).orderBy(desc(maintenanceRecords.date));
  return result;
}

export async function createMaintenanceRecord(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { maintenanceRecords } = await import("../drizzle/schema");
  
  const result = await db.insert(maintenanceRecords).values(data);
  return result;
}

export async function updateMaintenanceRecord(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { maintenanceRecords } = await import("../drizzle/schema");
  
  const result = await db.update(maintenanceRecords).set(updates).where(eq(maintenanceRecords.id, id));
  return result;
}

export async function deleteMaintenanceRecord(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { maintenanceRecords } = await import("../drizzle/schema");
  
  const result = await db.delete(maintenanceRecords).where(eq(maintenanceRecords.id, id));
  return result;
}

export async function getAllUtilityBills() {
  const db = await getDb();
  if (!db) return [];

  const { utilityBills } = await import("../drizzle/schema");
  
  const result = await db.select().from(utilityBills).orderBy(desc(utilityBills.year), desc(utilityBills.month));
  return result;
}

export async function createUtilityBill(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { utilityBills } = await import("../drizzle/schema");
  
  const result = await db.insert(utilityBills).values(data);
  return result;
}

export async function updateUtilityBill(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { utilityBills } = await import("../drizzle/schema");
  
  const result = await db.update(utilityBills).set(updates).where(eq(utilityBills.id, id));
  return result;
}

export async function deleteUtilityBill(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { utilityBills } = await import("../drizzle/schema");
  
  const result = await db.delete(utilityBills).where(eq(utilityBills.id, id));
  return result;
}

// ============ INQUIRY OPERATIONS ============

// export async function createInquiry(inquiry: InsertInquiry) {
//   const db = await getDb();
//   if (!db) throw new Error("Database not available");
// 
//   const result = await db.insert(inquiries).values(inquiry);
//   return result;
// }
// 
// export async function getInquiryById(id: number) {
//   const db = await getDb();
//   if (!db) return undefined;
// 
//   const result = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
//   return result.length > 0 ? result[0] : undefined;
// }
// 
// export async function getAllInquiries(filters?: {
//   status?: string;
//   channel?: string;
//   propertyId?: number;
//   contactId?: number;
// }) {
//   const db = await getDb();
//   if (!db) return [];
// 
//   let query = db.select().from(inquiries);
// 
//   if (filters) {
//     const conditions = [];
//     if (filters.status) conditions.push(eq(inquiries.status, filters.status as any));
//     if (filters.channel) conditions.push(eq(inquiries.channel, filters.channel as any));
//     if (filters.propertyId) conditions.push(eq(inquiries.propertyId, filters.propertyId));
//     if (filters.contactId) conditions.push(eq(inquiries.contactId, filters.contactId));
// 
//     if (conditions.length > 0) {
//       query = query.where(and(...conditions)) as any;
//     }
//   }
// 
//   const result = await query.orderBy(desc(inquiries.createdAt));
//   return result;
// }
// 
// export async function updateInquiry(id: number, updates: Partial<InsertInquiry>) {
//   const db = await getDb();
//   if (!db) throw new Error("Database not available");
// 
//   const result = await db.update(inquiries).set(updates).where(eq(inquiries.id, id));
//   return result;
// }
// 
// export async function deleteInquiry(id: number) {
//   const db = await getDb();
//   if (!db) throw new Error("Database not available");
// 
//   const result = await db.delete(inquiries).where(eq(inquiries.id, id));
//   return result;
// }
// 
// export async function getInquiriesByProperty(propertyId: number) {
//   const db = await getDb();
//   if (!db) return [];
// 
//   const result = await db
//     .select()
//     .from(inquiries)
//     .where(eq(inquiries.propertyId, propertyId))
//     .orderBy(desc(inquiries.createdAt));
//   
//   return result;
// }
// 
// export async function getInquiriesByContact(contactId: number) {
//   const db = await getDb();
//   if (!db) return [];
// 
//   const result = await db
//     .select()
//     .from(inquiries)
//     .where(eq(inquiries.contactId, contactId))
//     .orderBy(desc(inquiries.createdAt));
//   
//   return result;
// }
// 
// ============ IMAGE SORTING ============
export async function updateImageSortOrder(imageId: number, sortOrder: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(propertyImages)
    .set({ sortOrder })
    .where(eq(propertyImages.id, imageId));
}

// ============ IMAGE METADATA OPERATIONS ============

export async function updateImageMetadata(data: {
  id: number;
  title?: string;
  category?: string;
  displayName?: string;
  showOnLandingPage?: number;
  isFeatured?: number;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: Record<string, any> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.displayName !== undefined) updateData.displayName = data.displayName;
  if (data.showOnLandingPage !== undefined) updateData.showOnLandingPage = data.showOnLandingPage;
  if (data.isFeatured !== undefined) {
    // If setting this image as featured, unset all other images for this property first
    if (data.isFeatured === 1) {
      const image = await db.select().from(propertyImages).where(eq(propertyImages.id, data.id)).limit(1);
      if (image.length > 0) {
        await db.update(propertyImages)
          .set({ isFeatured: 0 })
          .where(eq(propertyImages.propertyId, image[0].propertyId));
      }
    }
    updateData.isFeatured = data.isFeatured;
  }

  await db.update(propertyImages)
    .set(updateData)
    .where(eq(propertyImages.id, data.id));
}

export async function updateDocumentMetadata(data: {
  id: number;
  title?: string;
  category?: string;
  showOnLandingPage?: number;
  isFloorPlan?: number;
  useInExpose?: number;
}) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const updateData: Record<string, any> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.showOnLandingPage !== undefined) updateData.showOnLandingPage = data.showOnLandingPage;
  if (data.isFloorPlan !== undefined) updateData.isFloorPlan = data.isFloorPlan;
  if (data.useInExpose !== undefined) updateData.useInExpose = data.useInExpose;

  await db.update(documents)
    .set(updateData)
    .where(eq(documents.id, data.id));
}

// ============ NAS CONFIGURATION ============

export async function getNASConfig(): Promise<Record<string, string>> {
  const db = await getDb();
  if (!db) {
    console.warn('[Database] Cannot get NAS config: database not available');
    return {};
  }

  try {
    const { appConfig } = await import('../drizzle/schema');
    const configs = await db.select().from(appConfig);
    
    const configMap: Record<string, string> = {};
    for (const config of configs) {
      if (config.configValue) {
        configMap[config.configKey] = config.configValue;
      }
    }
    
    return configMap;
  } catch (error) {
    console.error('[Database] Failed to get NAS config:', error);
    return {};
  }
}

// ============ PROPERTY LINKS ============

export async function getPropertyLinksByProperty(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const { propertyLinks } = await import('../drizzle/schema');
  return await db
    .select()
    .from(propertyLinks)
    .where(eq(propertyLinks.propertyId, propertyId))
    .orderBy(propertyLinks.sortOrder);
}




// ============ SETTINGS OPERATIONS ============

export async function getSettings() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get settings: database not available");
    return null;
  }
  
  try {
    const { settings } = await import('../drizzle/schema');
    const result = await db.select().from(settings).limit(1);
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get settings:", error);
    return null;
  }
}




// ============ CONTACT TAG OPERATIONS ============

export async function getAllContactTags(filters?: { module?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(contactTags);
  
  if (filters?.module) {
    query = query.where(eq(contactTags.module, filters.module as any)) as any;
  }
  
  const result = await query.orderBy(contactTags.name);
  return result;
}

export async function createContactTag(tag: InsertContactTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contactTags).values(tag);
  return result[0].insertId;
}

export async function deleteContactTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(contactTags).where(eq(contactTags.id, id));
  return result;
}

export async function assignTagToContact(contactId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contactTagAssignments).values({ contactId, tagId });
  return result;
}

export async function removeTagFromContact(contactId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(contactTagAssignments)
    .where(and(
      eq(contactTagAssignments.contactId, contactId),
      eq(contactTagAssignments.tagId, tagId)
    ));
  return result;
}

export async function getContactTags(contactId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select({
      id: contactTags.id,
      name: contactTags.name,
      color: contactTags.color,
      module: contactTags.module,
    })
    .from(contactTagAssignments)
    .innerJoin(contactTags, eq(contactTagAssignments.tagId, contactTags.id))
    .where(eq(contactTagAssignments.contactId, contactId));
  
  return result;
}

// ============ KANBAN OPERATIONS ============

export async function getAllKanbanBoards(filters?: { module?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(kanbanBoards).where(eq(kanbanBoards.isActive, true));
  
  if (filters?.module) {
    query = query.where(and(
      eq(kanbanBoards.isActive, true),
      eq(kanbanBoards.module, filters.module as any)
    )) as any;
  }
  
  const result = await query.orderBy(kanbanBoards.sortOrder);
  return result;
}

export async function getKanbanBoardById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(kanbanBoards).where(eq(kanbanBoards.id, id));
  return result[0] || null;
}

export async function createKanbanBoard(board: InsertKanbanBoard) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(kanbanBoards).values(board);
  return result[0].insertId;
}

export async function updateKanbanBoard(id: number, updates: Partial<InsertKanbanBoard>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(kanbanBoards).set(updates).where(eq(kanbanBoards.id, id));
  return result;
}

export async function deleteKanbanBoard(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete all columns and cards first
  await db.delete(kanbanCards).where(eq(kanbanCards.boardId, id));
  await db.delete(kanbanColumns).where(eq(kanbanColumns.boardId, id));
  
  const result = await db.delete(kanbanBoards).where(eq(kanbanBoards.id, id));
  return result;
}

export async function getKanbanColumns(boardId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(kanbanColumns)
    .where(eq(kanbanColumns.boardId, boardId))
    .orderBy(kanbanColumns.sortOrder);
  return result;
}

export async function createKanbanColumn(column: InsertKanbanColumn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(kanbanColumns).values(column);
  return result[0].insertId;
}

export async function updateKanbanColumn(id: number, updates: Partial<InsertKanbanColumn>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(kanbanColumns).set(updates).where(eq(kanbanColumns.id, id));
  return result;
}

export async function deleteKanbanColumn(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Delete all cards in this column first
  await db.delete(kanbanCards).where(eq(kanbanCards.columnId, id));
  
  const result = await db.delete(kanbanColumns).where(eq(kanbanColumns.id, id));
  return result;
}

export async function getKanbanCards(boardId: number, columnId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(kanbanCards).where(eq(kanbanCards.boardId, boardId));
  
  if (columnId) {
    query = query.where(and(
      eq(kanbanCards.boardId, boardId),
      eq(kanbanCards.columnId, columnId)
    )) as any;
  }
  
  const result = await query.orderBy(kanbanCards.sortOrder);
  return result;
}

export async function createKanbanCard(card: InsertKanbanCard) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(kanbanCards).values(card);
  return result[0].insertId;
}

export async function updateKanbanCard(id: number, updates: Partial<InsertKanbanCard>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(kanbanCards).set(updates).where(eq(kanbanCards.id, id));
  return result;
}

export async function moveKanbanCard(id: number, newColumnId: number, newSortOrder: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(kanbanCards)
    .set({ 
      columnId: newColumnId, 
      sortOrder: newSortOrder,
      movedAt: new Date()
    })
    .where(eq(kanbanCards.id, id));
  
  return result;
}

export async function deleteKanbanCard(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(kanbanCards).where(eq(kanbanCards.id, id));
  return result;
}

// ============ CUSTOMER USER OPERATIONS ============

export async function getCustomerUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(customerUsers).where(eq(customerUsers.email, email));
  return result[0] || null;
}

export async function getCustomerUserByContactId(contactId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(customerUsers).where(eq(customerUsers.contactId, contactId));
  return result[0] || null;
}

export async function createCustomerUser(user: InsertCustomerUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(customerUsers).values(user);
  return result[0].insertId;
}

export async function updateCustomerUser(id: number, updates: Partial<InsertCustomerUser>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(customerUsers).set(updates).where(eq(customerUsers.id, id));
  return result;
}

export async function deleteCustomerUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(customerUsers).where(eq(customerUsers.id, id));
  return result;
}

// ============ DOCUMENT TEMPLATE OPERATIONS ============

export async function getAllDocumentTemplates(filters?: { category?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(documentTemplates).where(eq(documentTemplates.isActive, true));
  
  if (filters?.category) {
    query = query.where(and(
      eq(documentTemplates.isActive, true),
      eq(documentTemplates.category, filters.category as any)
    )) as any;
  }
  
  const result = await query.orderBy(documentTemplates.name);
  return result;
}

export async function getDocumentTemplateById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(documentTemplates).where(eq(documentTemplates.id, id));
  return result[0] || null;
}

export async function createDocumentTemplate(template: InsertDocumentTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(documentTemplates).values(template);
  return result[0].insertId;
}

export async function updateDocumentTemplate(id: number, updates: Partial<InsertDocumentTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(documentTemplates).set(updates).where(eq(documentTemplates.id, id));
  return result;
}

export async function deleteDocumentTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(documentTemplates).where(eq(documentTemplates.id, id));
  return result;
}
