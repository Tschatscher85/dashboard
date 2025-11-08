import { eq, desc, and, or, like, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
// For PostgreSQL migration: import { drizzle } from "drizzle-orm/postgres-js";
// For PostgreSQL migration: import postgres from "postgres";
import { 
  InsertUser, users,
  properties, InsertProperty,
  contacts, InsertContact,
  propertyImages, InsertPropertyImage,
  documents, InsertDocument,
  appointments, InsertAppointment,
  activities, InsertActivity,
  leads, InsertLead,
  inquiries, InsertInquiry
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
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(properties).values(property);
  return result;
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
  
  return property;
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

export async function updateProperty(id: number, updates: Partial<InsertProperty> & { availableFrom?: string | Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Convert string dates to Date objects
  const processedUpdates: any = { ...updates };
  if (updates.availableFrom && typeof updates.availableFrom === 'string') {
    processedUpdates.availableFrom = new Date(updates.availableFrom);
  }
  
  const result = await db.update(properties).set(processedUpdates as Partial<InsertProperty>).where(eq(properties.id, id));
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

export async function createInquiry(inquiry: InsertInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(inquiries).values(inquiry);
  return result;
}

export async function getInquiryById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllInquiries(filters?: {
  status?: string;
  channel?: string;
  propertyId?: number;
  contactId?: number;
}) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(inquiries);

  if (filters) {
    const conditions = [];
    if (filters.status) conditions.push(eq(inquiries.status, filters.status as any));
    if (filters.channel) conditions.push(eq(inquiries.channel, filters.channel as any));
    if (filters.propertyId) conditions.push(eq(inquiries.propertyId, filters.propertyId));
    if (filters.contactId) conditions.push(eq(inquiries.contactId, filters.contactId));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
  }

  const result = await query.orderBy(desc(inquiries.createdAt));
  return result;
}

export async function updateInquiry(id: number, updates: Partial<InsertInquiry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.update(inquiries).set(updates).where(eq(inquiries.id, id));
  return result;
}

export async function deleteInquiry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.delete(inquiries).where(eq(inquiries.id, id));
  return result;
}

export async function getInquiriesByProperty(propertyId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.propertyId, propertyId))
    .orderBy(desc(inquiries.createdAt));
  
  return result;
}

export async function getInquiriesByContact(contactId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(inquiries)
    .where(eq(inquiries.contactId, contactId))
    .orderBy(desc(inquiries.createdAt));
  
  return result;
}
