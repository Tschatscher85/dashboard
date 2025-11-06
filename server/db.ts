import { eq, desc, and, or, like, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users,
  properties, InsertProperty,
  contacts, InsertContact,
  propertyImages, InsertPropertyImage,
  documents, InsertDocument,
  appointments, InsertAppointment,
  activities, InsertActivity,
  leads, InsertLead
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
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

// ============ PROPERTY OPERATIONS ============

export async function createProperty(property: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(properties).values(property);
  return result;
}

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
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
  
  const result = await query.orderBy(desc(properties.createdAt));
  return result;
}

export async function updateProperty(id: number, updates: Partial<InsertProperty>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.update(properties).set(updates).where(eq(properties.id, id));
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(contacts).values(contact);
  return result;
}

export async function getContactById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllContacts(filters?: {
  contactType?: string;
  searchTerm?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  
  let query = db.select().from(contacts);
  
  const conditions = [];
  if (filters?.contactType) conditions.push(eq(contacts.contactType, filters.contactType as any));
  if (filters?.searchTerm) {
    conditions.push(
      or(
        like(contacts.firstName, `%${filters.searchTerm}%`),
        like(contacts.lastName, `%${filters.searchTerm}%`),
        like(contacts.email, `%${filters.searchTerm}%`),
        like(contacts.company, `%${filters.searchTerm}%`)
      )!
    );
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
  
  const result = await db.insert(propertyImages).values(image);
  return result;
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

export async function createActivity(activity: InsertActivity) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(activities).values(activity);
  return result;
}

export async function getActivitiesByProperty(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(activities)
    .where(eq(activities.propertyId, propertyId))
    .orderBy(desc(activities.createdAt));
  return result;
}

export async function getActivitiesByContact(contactId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db.select().from(activities)
    .where(eq(activities.contactId, contactId))
    .orderBy(desc(activities.createdAt));
  return result;
}

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
  
  return {
    totalProperties: Number(propertiesCount.count),
    totalContacts: Number(contactsCount.count),
    newLeads: Number(leadsCount.count),
    upcomingAppointments: Number(appointmentsCount.count),
  };
}
