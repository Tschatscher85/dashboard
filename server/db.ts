import { eq, and, desc, asc } from "drizzle-orm";
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
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(users);
  return result;
}

// ============ PROPERTY OPERATIONS ============

export async function createProperty(property: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(properties).values(property);
  
  // Get the last inserted property
  const result = await db.select().from(properties)
    .orderBy(desc(properties.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllProperties(filters?: {
  category?: string;
  status?: string;
  marketingType?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(properties);

  // Apply filters if provided
  const conditions = [];
  if (filters?.category) {
    conditions.push(eq(properties.category, filters.category));
  }
  if (filters?.status) {
    conditions.push(eq(properties.status, filters.status));
  }
  if (filters?.marketingType) {
    conditions.push(eq(properties.marketingType, filters.marketingType));
  }
  if (filters?.city) {
    conditions.push(eq(properties.city, filters.city));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const result = await query.orderBy(desc(properties.createdAt));
  return result;
}

export async function updateProperty(id: number, updates: Partial<InsertProperty> & { availableFrom?: string | Date | null, [key: string]: any }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  console.log('[Database] updateProperty called with:', JSON.stringify({ id, updates }, null, 2));
  
  // COMPREHENSIVE DATA VALIDATION AND TRANSFORMATION
  const processedUpdates: any = {};
  
  // All ENUM fields that need special handling
  const enumFields = [
    'energyCertificateAvailability', 'energyCertificateType', 'heatingType', 
    'mainEnergySource', 'energyClass', 'condition', 'assignmentType', 
    'assignmentDuration', 'furnishingQuality', 'developmentStatus'
  ];
  
  // All date fields
  const dateFields = [
    'assignmentFrom', 'assignmentTo', 'availableFrom', 
    'energyCertificateIssueDate', 'energyCertificateValidUntil', 
    'energyCertificateCreationDate'
  ];
  
  // COMPLETE German/Frontend to Database ENUM value mappings
  const enumValueMappings: { [key: string]: { [key: string]: string } } = {
    energyCertificateAvailability: {
      // Frontend values → Database values
      'liegt_vor': 'available',
      'zur_besichtigung': 'available',
      'vorhanden': 'available',
      'nicht_vorhanden': 'not_available',
      'nicht_benoetigt': 'not_required',
      'wird_nicht_benoetigt': 'not_required',
      // Already correct values (pass-through)
      'available': 'available',
      'not_available': 'not_available',
      'not_required': 'not_required'
    },
    heatingType: {
      // Frontend values → Database values
      'pelletheizung': 'fussboden',  // Map to closest match or set to null
      'nachtspeicher': 'etagenheizung',
      'blockheizkraftwerk': 'zentralheizung',
      'waermepumpe': 'zentralheizung',
      'ofen': 'ofenheizung',
      // Already correct values (pass-through)
      'zentralheizung': 'zentralheizung',
      'etagenheizung': 'etagenheizung',
      'fernwaerme': 'fernwaerme',
      'ofenheizung': 'ofenheizung',
      'fussboden': 'fussboden'
    },
    energyClass: {
      // Frontend values → Database values
      'a_plus': 'a_plus',
      'A+': 'a_plus',
      'A': 'a',
      'B': 'b',
      'C': 'c',
      'D': 'd',
      'E': 'e',
      'F': 'f',
      'G': 'g',
      'H': 'h',
      // Already correct values (pass-through)
      'a': 'a',
      'b': 'b',
      'c': 'c',
      'd': 'd',
      'e': 'e',
      'f': 'f',
      'g': 'g',
      'h': 'h'
    },
    energyCertificateType: {
      // Already correct German values in DB
      'bedarfsausweis': 'bedarfsausweis',
      'verbrauchsausweis': 'verbrauchsausweis'
    },
    mainEnergySource: {
      // Already correct German values in DB
      'gas': 'gas',
      'oel': 'oel',
      'strom': 'strom',
      'solar': 'solar',
      'erdwaerme': 'erdwaerme',
      'pellets': 'pellets',
      'holz': 'holz',
      'fernwaerme': 'fernwaerme'
    },
    condition: {
      // Already correct English values in DB
      'first_time_use': 'first_time_use',
      'first_time_use_after_refurbishment': 'first_time_use_after_refurbishment',
      'mint_condition': 'mint_condition',
      'refurbished': 'refurbished',
      'in_need_of_renovation': 'in_need_of_renovation',
      'by_arrangement': 'by_arrangement'
    },
    assignmentType: {
      // Already correct German values in DB
      'alleinauftrag': 'alleinauftrag',
      'qualifizierter_alleinauftrag': 'qualifizierter_alleinauftrag',
      'einfacher_auftrag': 'einfacher_auftrag'
    },
    assignmentDuration: {
      // Already correct German values in DB
      'unbefristet': 'unbefristet',
      'befristet': 'befristet'
    },
    furnishingQuality: {
      // Already correct English values in DB
      'simple': 'simple',
      'normal': 'normal',
      'upscale': 'upscale',
      'luxurious': 'luxurious'
    },
    developmentStatus: {
      // Already correct English values in DB
      'fully_developed': 'fully_developed',
      'partially_developed': 'partially_developed',
      'undeveloped': 'undeveloped',
      'raw_building_land': 'raw_building_land'
    }
  };
  
  // Process each field
  for (const [key, value] of Object.entries(updates)) {
    // Skip undefined
    if (value === undefined) continue;
    
    // Handle empty strings - convert to NULL
    if (value === '' || (typeof value === 'string' && value.trim() === '')) {
      processedUpdates[key] = null;
      continue;
    }
    
    // Handle NULL
    if (value === null) {
      processedUpdates[key] = null;
      continue;
    }
    
    // Handle ENUM fields - map values or set to NULL if invalid
    if (enumFields.includes(key)) {
      if (typeof value === 'string' && value.trim()) {
        const trimmedValue = value.trim();
        // Check if we have a mapping for this field
        if (enumValueMappings[key]) {
          const mappedValue = enumValueMappings[key][trimmedValue];
          if (mappedValue) {
            processedUpdates[key] = mappedValue;
          } else {
            // Unknown value - set to NULL to avoid truncation error
            console.warn(`[Database] Unknown ENUM value for ${key}: "${trimmedValue}" - setting to NULL`);
            processedUpdates[key] = null;
          }
        } else {
          // No mapping defined - pass through (assume it's correct)
          processedUpdates[key] = trimmedValue;
        }
      } else {
        processedUpdates[key] = null;
      }
      continue;
    }
    
    // Handle date fields
    if (dateFields.includes(key)) {
      if (typeof value === 'string') {
        // Check if it's a valid ISO date
        if (value.match(/^\d{4}-\d{2}-\d{2}/)) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            // Convert to MySQL datetime format
            processedUpdates[key] = date.toISOString().slice(0, 19).replace('T', ' ');
          } else {
            processedUpdates[key] = null;
          }
        } else {
          // Invalid format (like 'ab_2014'), set to NULL
          console.warn(`[Database] Invalid date format for ${key}: "${value}" - setting to NULL`);
          processedUpdates[key] = null;
        }
      } else if (value instanceof Date) {
        processedUpdates[key] = value.toISOString().slice(0, 19).replace('T', ' ');
      } else {
        processedUpdates[key] = null;
      }
      continue;
    }
    
    // Handle number fields - convert empty strings to NULL
    if (typeof value === 'string' && value.trim() === '' && 
        (key.includes('Price') || key.includes('Area') || key.includes('Cost') || 
         key.includes('rooms') || key.includes('bedrooms') || key.includes('bathrooms') ||
         key.includes('floor') || key.includes('Consumption') || key.includes('Emissions'))) {
      processedUpdates[key] = null;
      continue;
    }
    
    // All other fields - pass through
    processedUpdates[key] = value;
  }
  
  console.log('[Database] Processed updates:', JSON.stringify(processedUpdates, null, 2));
  
  // Build dynamic SQL with only provided fields to avoid Drizzle ORM issues
  const fields = Object.keys(processedUpdates);
  const values = Object.values(processedUpdates);
  
  if (fields.length === 0) {
    console.log('[Database] No fields to update');
    return { success: true };
  }
  
  const setClause = fields.map(f => `\`${f}\` = ?`).join(', ');
  const sql = `UPDATE properties SET ${setClause} WHERE id = ?`;
  
  // Add id to the end of values array
  const allValues = [...values, id];
  
  console.log('[Database] Executing SQL:', sql);
  console.log('[Database] With values:', allValues);
  
  // Use mysql2 directly for more control
  const mysql2 = await import('mysql2/promise');
  const connection = await mysql2.createConnection(process.env.DATABASE_URL!);
  
  try {
    const [result] = await connection.execute(sql, allValues);
    console.log('[Database] Update result:', result);
    return result;
  } catch (error) {
    console.error('[Database] Update error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

export async function deleteProperty(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(properties).where(eq(properties.id, id));
  return result;
}

// ============ CONTACT OPERATIONS ============

export async function createContact(contact: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(contacts).values(contact);
  
  // Get the last inserted contact
  const result = await db.select().from(contacts)
    .orderBy(desc(contacts.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllContacts(filters?: {
  type?: string;
  category?: string;
  city?: string;
  searchTerm?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(contacts);

  // Apply filters if provided
  const conditions = [];
  if (filters?.type) {
    conditions.push(eq(contacts.type, filters.type));
  }
  if (filters?.category) {
    conditions.push(eq(contacts.category, filters.category));
  }
  if (filters?.city) {
    conditions.push(eq(contacts.city, filters.city));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const result = await query.orderBy(desc(contacts.createdAt));
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(propertyImages).values(image);
  
  // Get the last inserted image
  const result = await db.select().from(propertyImages)
    .orderBy(desc(propertyImages.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getPropertyImages(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId))
    .orderBy(asc(propertyImages.sortOrder));
  
  return result;
}

export async function updatePropertyImage(id: number, updates: Partial<InsertPropertyImage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(propertyImages).set(updates).where(eq(propertyImages.id, id));
  return result;
}

export async function deletePropertyImage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(propertyImages).where(eq(propertyImages.id, id));
  return result;
}

// ============ DOCUMENT OPERATIONS ============

export async function createDocument(document: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(documents).values(document);
  
  // Get the last inserted document
  const result = await db.select().from(documents)
    .orderBy(desc(documents.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllDocuments(filters?: {
  propertyId?: number;
  contactId?: number;
  type?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(documents);

  const conditions = [];
  if (filters?.propertyId) {
    conditions.push(eq(documents.propertyId, filters.propertyId));
  }
  if (filters?.contactId) {
    conditions.push(eq(documents.contactId, filters.contactId));
  }
  if (filters?.type) {
    conditions.push(eq(documents.type, filters.type));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const result = await query.orderBy(desc(documents.createdAt));
  return result;
}

export async function updateDocument(id: number, updates: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(documents).set(updates).where(eq(documents.id, id));
  return result;
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(documents).where(eq(documents.id, id));
  return result;
}

// ============ PROPERTY LINK OPERATIONS ============

export async function createPropertyLink(link: InsertPropertyLink) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(propertyLinks).values(link);
  
  // Get the last inserted link
  const result = await db.select().from(propertyLinks)
    .orderBy(desc(propertyLinks.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getPropertyLinks(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(propertyLinks)
    .where(eq(propertyLinks.propertyId, propertyId))
    .orderBy(desc(propertyLinks.createdAt));
  
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
  if (filters?.propertyId) {
    conditions.push(eq(appointments.propertyId, filters.propertyId));
  }
  if (filters?.contactId) {
    conditions.push(eq(appointments.contactId, filters.contactId));
  }
  if (filters?.status) {
    conditions.push(eq(appointments.status, filters.status));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const result = await query.orderBy(asc(appointments.startTime));
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

// ============ LEAD OPERATIONS ============

export async function createLead(lead: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(leads).values(lead);
  
  // Get the last inserted lead
  const result = await db.select().from(leads)
    .orderBy(desc(leads.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getLeadById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllLeads(filters?: {
  status?: string;
  source?: string;
  assignedTo?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(leads);

  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(leads.status, filters.status));
  }
  if (filters?.source) {
    conditions.push(eq(leads.source, filters.source));
  }
  if (filters?.assignedTo) {
    conditions.push(eq(leads.assignedTo, filters.assignedTo));
  }

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

// ============ INSURANCE OPERATIONS ============

export async function createInsurance(insurance: InsertInsurance) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(insurances).values(insurance);
  
  // Get the last inserted insurance
  const result = await db.select().from(insurances)
    .orderBy(desc(insurances.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getInsuranceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(insurances).where(eq(insurances.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllInsurances(filters?: {
  propertyId?: number;
  type?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(insurances);

  const conditions = [];
  if (filters?.propertyId) {
    conditions.push(eq(insurances.propertyId, filters.propertyId));
  }
  if (filters?.type) {
    conditions.push(eq(insurances.type, filters.type));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  const result = await query.orderBy(desc(insurances.createdAt));
  return result;
}

export async function updateInsurance(id: number, updates: Partial<InsertInsurance>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(insurances).set(updates).where(eq(insurances.id, id));
  return result;
}

export async function deleteInsurance(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(insurances).where(eq(insurances.id, id));
  return result;
}

// ============ CONTACT TAG OPERATIONS ============

export async function createContactTag(tag: InsertContactTag) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(contactTags).values(tag);
  
  const result = await db.select().from(contactTags)
    .orderBy(desc(contactTags.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getAllContactTags() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(contactTags).orderBy(asc(contactTags.name));
  return result;
}

export async function updateContactTag(id: number, updates: Partial<InsertContactTag>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(contactTags).set(updates).where(eq(contactTags.id, id));
  return result;
}

export async function deleteContactTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.delete(contactTags).where(eq(contactTags.id, id));
  return result;
}

// ============ CONTACT TAG ASSIGNMENT OPERATIONS ============

export async function assignTagToContact(assignment: InsertContactTagAssignment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(contactTagAssignments).values(assignment);
}

export async function getContactTags(contactId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select({
    id: contactTags.id,
    name: contactTags.name,
    color: contactTags.color,
  })
  .from(contactTagAssignments)
  .innerJoin(contactTags, eq(contactTagAssignments.tagId, contactTags.id))
  .where(eq(contactTagAssignments.contactId, contactId));
  
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

// ============ KANBAN OPERATIONS ============

export async function createKanbanBoard(board: InsertKanbanBoard) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(kanbanBoards).values(board);
  
  const result = await db.select().from(kanbanBoards)
    .orderBy(desc(kanbanBoards.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getAllKanbanBoards() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(kanbanBoards).orderBy(asc(kanbanBoards.name));
  return result;
}

export async function createKanbanColumn(column: InsertKanbanColumn) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(kanbanColumns).values(column);
  
  const result = await db.select().from(kanbanColumns)
    .orderBy(desc(kanbanColumns.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getKanbanColumns(boardId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(kanbanColumns)
    .where(eq(kanbanColumns.boardId, boardId))
    .orderBy(asc(kanbanColumns.position));
  
  return result;
}

export async function createKanbanCard(card: InsertKanbanCard) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(kanbanCards).values(card);
  
  const result = await db.select().from(kanbanCards)
    .orderBy(desc(kanbanCards.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getKanbanCards(columnId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(kanbanCards)
    .where(eq(kanbanCards.columnId, columnId))
    .orderBy(asc(kanbanCards.position));
  
  return result;
}

export async function updateKanbanCard(id: number, updates: Partial<InsertKanbanCard>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(kanbanCards).set(updates).where(eq(kanbanCards.id, id));
  return result;
}

// ============ CUSTOMER USER OPERATIONS ============

export async function createCustomerUser(user: InsertCustomerUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(customerUsers).values(user);
  
  const result = await db.select().from(customerUsers)
    .orderBy(desc(customerUsers.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getCustomerUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(customerUsers).where(eq(customerUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllCustomerUsers() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(customerUsers).orderBy(asc(customerUsers.email));
  return result;
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

export async function createDocumentTemplate(template: InsertDocumentTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(documentTemplates).values(template);
  
  const result = await db.select().from(documentTemplates)
    .orderBy(desc(documentTemplates.id))
    .limit(1);
  
  return result[0]?.id || 0;
}

export async function getDocumentTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(documentTemplates).where(eq(documentTemplates.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllDocumentTemplates() {
  const db = await getDb();
  if (!db) return [];

  const result = await db.select().from(documentTemplates).orderBy(asc(documentTemplates.name));
  return result;
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

// ============ PROPERTY MANAGEMENT CONTRACT OPERATIONS ============

export async function getAllPropertyManagementContracts() {
  const db = await getDb();
  if (!db) return [];

  const { propertyManagementContracts } = await import("../drizzle/schema");
  
  const result = await db.select().from(propertyManagementContracts).orderBy(desc(propertyManagementContracts.startDate));
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
