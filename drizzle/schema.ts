import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Properties/Immobilien table
 */
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Property type and status
  propertyType: mysqlEnum("propertyType", [
    "apartment", "house", "commercial", "land", "parking", "other"
  ]).notNull(),
  marketingType: mysqlEnum("marketingType", ["sale", "rent", "lease"]).notNull(),
  status: mysqlEnum("status", ["available", "reserved", "sold", "rented", "inactive"]).default("available").notNull(),
  
  // Address
  street: varchar("street", { length: 255 }),
  houseNumber: varchar("houseNumber", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Deutschland"),
  
  // Property details
  livingArea: int("livingArea"), // in sqm
  plotArea: int("plotArea"), // in sqm
  rooms: int("rooms"),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  floor: int("floor"),
  totalFloors: int("totalFloors"),
  
  // Financial
  price: int("price"), // in cents to avoid decimal issues
  pricePerSqm: int("pricePerSqm"), // calculated, in cents
  additionalCosts: int("additionalCosts"), // Nebenkosten in cents
  heatingCosts: int("heatingCosts"), // in cents
  deposit: int("deposit"), // Kaution in cents
  
  // Features
  hasBalcony: boolean("hasBalcony").default(false),
  hasTerrace: boolean("hasTerrace").default(false),
  hasGarden: boolean("hasGarden").default(false),
  hasElevator: boolean("hasElevator").default(false),
  hasParking: boolean("hasParking").default(false),
  hasBasement: boolean("hasBasement").default(false),
  
  // Energy certificate
  energyClass: varchar("energyClass", { length: 10 }), // A+, A, B, C, etc.
  energyConsumption: int("energyConsumption"), // kWh/(m²*a)
  heatingType: varchar("heatingType", { length: 100 }),
  
  // Construction
  yearBuilt: int("yearBuilt"),
  condition: mysqlEnum("condition", ["new", "renovated", "good", "needs_renovation", "demolished"]),
  
  // Contact and availability
  availableFrom: timestamp("availableFrom"),
  contactPersonId: int("contactPersonId"), // reference to users or contacts
  
  // Landing page
  hasLandingPage: boolean("hasLandingPage").default(false),
  landingPageSlug: varchar("landingPageSlug", { length: 255 }).unique(),
  landingPagePublished: boolean("landingPagePublished").default(false),
  
  // Metadata
  viewCount: int("viewCount").default(0),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Contacts/Customers table
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  
  // Type of contact
  contactType: mysqlEnum("contactType", ["buyer", "seller", "tenant", "landlord", "interested", "other"]).notNull(),
  
  // Personal information
  salutation: mysqlEnum("salutation", ["mr", "ms", "diverse"]),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  company: varchar("company", { length: 255 }),
  
  // Contact details
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 50 }),
  mobile: varchar("mobile", { length: 50 }),
  
  // Address
  street: varchar("street", { length: 255 }),
  houseNumber: varchar("houseNumber", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  
  // Additional info
  notes: text("notes"),
  source: varchar("source", { length: 100 }), // where did they come from
  
  // Brevo sync
  brevoContactId: varchar("brevoContactId", { length: 100 }),
  lastSyncedToBrevo: timestamp("lastSyncedToBrevo"),
  
  // Metadata
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Property Images
 */
export const propertyImages = mysqlTable("propertyImages", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  
  // Image storage (NAS path or S3 URL)
  imageUrl: text("imageUrl").notNull(),
  nasPath: text("nasPath"), // original path on NAS
  
  // Image details
  title: varchar("title", { length: 255 }),
  description: text("description"),
  imageType: mysqlEnum("imageType", ["main", "exterior", "interior", "floorplan", "map", "other"]).default("other"),
  sortOrder: int("sortOrder").default(0),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PropertyImage = typeof propertyImages.$inferSelect;
export type InsertPropertyImage = typeof propertyImages.$inferInsert;

/**
 * Documents table
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  
  // Document info
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  documentType: mysqlEnum("documentType", [
    "contract", "expose", "floorplan", "energy_certificate", "other"
  ]).default("other"),
  
  // Storage
  fileUrl: text("fileUrl"), // S3 URL
  nasPath: text("nasPath"), // NAS path
  fileName: varchar("fileName", { length: 255 }),
  fileSize: int("fileSize"), // in bytes
  mimeType: varchar("mimeType", { length: 100 }),
  
  // Relations
  propertyId: int("propertyId"), // can be null for general documents
  contactId: int("contactId"), // can be null
  
  // Metadata
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Appointments/Viewings table
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  
  // Appointment details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  appointmentType: mysqlEnum("appointmentType", [
    "viewing", "meeting", "phone_call", "other"
  ]).default("viewing"),
  
  // Timing
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  
  // Relations
  propertyId: int("propertyId"),
  contactId: int("contactId"),
  
  // Status
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled", "no_show"]).default("scheduled"),
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Activities/Notes table - interaction history
 */
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  
  activityType: mysqlEnum("activityType", [
    "note", "email", "call", "meeting", "viewing", "other"
  ]).notNull(),
  
  subject: varchar("subject", { length: 255 }),
  content: text("content"),
  
  // Relations
  propertyId: int("propertyId"),
  contactId: int("contactId"),
  
  // Metadata
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

/**
 * Lead inquiries from public forms
 */
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  
  // Lead source
  propertyId: int("propertyId"),
  source: varchar("source", { length: 100 }), // "landing_page", "public_listing", etc.
  
  // Contact info
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  
  // Message
  message: text("message"),
  
  // Status
  status: mysqlEnum("status", ["new", "contacted", "qualified", "converted", "rejected"]).default("new"),
  convertedToContactId: int("convertedToContactId"), // if converted to contact
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
