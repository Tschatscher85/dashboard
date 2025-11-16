import { mysqlTable, int, varchar, text, timestamp, decimal, mysqlEnum, boolean, float, date } from "drizzle-orm/mysql-core";

/**
 * Properties - Real estate properties managed in the system
 */
export const properties = mysqlTable("properties", {
  id: int("id").primaryKey().autoincrement(),
  
  // Basic info
  title: varchar("title", { length: 255 }).notNull(),
  headline: varchar("headline", { length: 255 }), // Landing page headline
  description: text("description"),
  descriptionObject: text("descriptionObject"), // 📝 Objektbeschreibung
  descriptionHighlights: text("descriptionHighlights"), // ⭐ Ausstattung & Highlights
  descriptionLocation: text("descriptionLocation"), // 📍 Lage
  descriptionFazit: text("descriptionFazit"), // 💚 Fazit
  descriptionCTA: text("descriptionCTA"), // 📞 Kontaktieren Sie uns direkt!
  
  // Property type
  propertyType: mysqlEnum("propertyType", [
    "apartment",
    "house",
    "commercial",
    "land",
    "parking",
    "other",
  ]).notNull(),
  subType: varchar("subType", { length: 100 }), // Wohnung, Etagenwohnung, etc.
  marketingType: mysqlEnum("marketingType", ["sale", "rent", "lease"]).notNull(),
  status: mysqlEnum("status", ["acquisition", "preparation", "marketing", "reserved", "notary", "sold", "completed"]).default("acquisition").notNull(),
  
  // Address
  street: varchar("street", { length: 255 }),
  houseNumber: varchar("houseNumber", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }),
  country: varchar("country", { length: 100 }).default("Deutschland"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Property details
  livingArea: decimal("livingArea", { precision: 10, scale: 2 }),
  usableArea: decimal("usableArea", { precision: 10, scale: 2 }),
  plotArea: decimal("plotArea", { precision: 10, scale: 2 }),
  rooms: decimal("rooms", { precision: 4, scale: 1 }),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  floors: int("floors"),
  floor: int("floor"),
  
  // Condition & features
  condition: mysqlEnum("condition", [
    "first_time_use",
    "first_time_use_after_refurbishment",
    "mint_condition",
    "refurbished",
    "in_need_of_renovation",
    "by_arrangement",
  ]),
  yearBuilt: int("yearBuilt"),
  lastModernization: int("lastModernization"),
  
  hasBalcony: boolean("hasBalcony").default(false),
  hasTerrace: boolean("hasTerrace").default(false),
  hasGarden: boolean("hasGarden").default(false),
  hasElevator: boolean("hasElevator").default(false),
  hasBasement: boolean("hasBasement").default(false),
  hasGarage: boolean("hasGarage").default(false),
  hasGuestToilet: boolean("hasGuestToilet").default(false),
  hasBuiltInKitchen: boolean("hasBuiltInKitchen").default(false),
  
  balconyTerraceArea: decimal("balconyTerraceArea", { precision: 10, scale: 2 }),
  gardenArea: decimal("gardenArea", { precision: 10, scale: 2 }),
  
  // Parking
  parkingSpaces: int("parkingSpaces"),
  parkingType: varchar("parkingType", { length: 255 }), // JSON array of parking types
  parkingPrice: decimal("parkingPrice", { precision: 10, scale: 2 }),
  
  // Furnishing
  furnishingQuality: mysqlEnum("furnishingQuality", ["simple", "normal", "upscale", "luxurious"]),
  flooring: varchar("flooring", { length: 255 }), // JSON array of flooring types
  hasStorageRoom: boolean("hasStorageRoom").default(false),
  
  // Rental details
  baseRent: decimal("baseRent", { precision: 10, scale: 2 }),
  additionalCosts: decimal("additionalCosts", { precision: 10, scale: 2 }),
  heatingCosts: decimal("heatingCosts", { precision: 10, scale: 2 }),
  totalRent: decimal("totalRent", { precision: 10, scale: 2 }),
  deposit: decimal("deposit", { precision: 10, scale: 2 }),
  heatingCostsInServiceCharge: boolean("heatingCostsInServiceCharge").default(false),
  
  // Purchase details
  purchasePrice: decimal("purchasePrice", { precision: 12, scale: 2 }),
  priceOnRequest: boolean("priceOnRequest").default(false),
  priceByNegotiation: boolean("priceByNegotiation").default(false),
  
  // Commission
  buyerCommission: varchar("buyerCommission", { length: 50 }),
  
  // Investment
  rentalIncome: decimal("rentalIncome", { precision: 10, scale: 2 }),
  isRented: boolean("isRented").default(false),
  
  // Energy certificate
  energyCertificateAvailability: mysqlEnum("energyCertificateAvailability", [
    "available",
    "not_available",
    "not_required",
  ]),
  energyCertificateCreationDate: date("energyCertificateCreationDate"),
  energyCertificateType: mysqlEnum("energyCertificateType", [
    "bedarfsausweis",
    "verbrauchsausweis",
  ]),
  energyConsumption: int("energyConsumption"),
  energyConsumptionElectricity: int("energyConsumptionElectricity"),
  energyConsumptionHeat: int("energyConsumptionHeat"),
  co2Emissions: int("co2Emissions"),
  energyClass: mysqlEnum("energyClass", [
    "a_plus",
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g",
    "h",
  ]),
  energyCertificateIssueDate: date("energyCertificateIssueDate"),
  energyCertificateValidUntil: date("energyCertificateValidUntil"),
  includesWarmWater: boolean("includesWarmWater").default(false),
  heatingType: mysqlEnum("heatingType", [
    "zentralheizung",
    "etagenheizung",
    "fernwaerme",
    "ofenheizung",
    "fussboden",
  ]),
  mainEnergySource: mysqlEnum("mainEnergySource", [
    "gas",
    "oel",
    "strom",
    "solar",
    "erdwaerme",
    "pellets",
    "holz",
    "fernwaerme",
  ]),
  buildingYearUnknown: boolean("buildingYearUnknown").default(false),
  
  // Contacts & Partners
  supervisorId: int("supervisorId"), // Betreuer
  ownerId: int("ownerId"), // Eigentümer
  buyerId: int("buyerId"), // Käufer
  notaryId: int("notaryId"), // Notar
  propertyManagementId: int("propertyManagementId"), // Hausverwaltung
  tenantId: int("tenantId"), // Mieter
  linkedContactIds: text("linkedContactIds"), // JSON array of contact IDs for "Verknüpfte Kontakte"
  
  // Court & Land Registry
  courtName: varchar("courtName", { length: 255 }),
  courtCity: varchar("courtCity", { length: 100 }),
  landRegisterNumber: varchar("landRegisterNumber", { length: 100 }),
  landRegisterSheet: varchar("landRegisterSheet", { length: 100 }),
  parcelNumber: varchar("parcelNumber", { length: 100 }),
  
  // Plot details
  plotNumber: varchar("plotNumber", { length: 100 }),
  developmentStatus: mysqlEnum("developmentStatus", [
    "fully_developed",
    "partially_developed",
    "undeveloped",
    "raw_building_land",
  ]),
  siteArea: decimal("siteArea", { precision: 10, scale: 2 }),
  
  // Assignment
  assignmentType: mysqlEnum("assignmentType", [
    "alleinauftrag",
    "qualifizierter_alleinauftrag",
    "einfacher_auftrag",
  ]),
  assignmentDuration: mysqlEnum("assignmentDuration", [
    "unbefristet",
    "befristet",
  ]),
  assignmentFrom: date("assignmentFrom"),
  assignmentTo: date("assignmentTo"),
  
  // Commission (Internal)
  internalCommissionPercent: varchar("internalCommissionPercent", { length: 50 }),
  internalCommissionType: mysqlEnum("internalCommissionType", ["percent", "euro"]),
  externalCommissionInternalPercent: varchar("externalCommissionInternalPercent", { length: 50 }),
  externalCommissionInternalType: mysqlEnum("externalCommissionInternalType", ["percent", "euro"]),
  totalCommission: decimal("totalCommission", { precision: 10, scale: 2 }),
  
  // Commission (External/Expose)
  externalCommissionForExpose: varchar("externalCommissionForExpose", { length: 255 }),
  commissionNote: text("commissionNote"),
  
  // Portal settings
  autoSendToPortals: boolean("autoSendToPortals").default(false),
  
  // Warning/Notes
  warningNote: text("warningNote"),
  
  // Archive
  isArchived: boolean("isArchived").default(false),
  
  // Internal notes
  internalNotes: text("internalNotes"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Property Images - Images associated with properties
 */
export const propertyImages = mysqlTable("propertyImages", {
  id: int("id").primaryKey().autoincrement(),
  propertyId: int("propertyId").notNull(),
  imageUrl: varchar("imageUrl", { length: 500 }).notNull(),
  title: varchar("title", { length: 255 }),
  description: text("description"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PropertyImage = typeof propertyImages.$inferSelect;
export type InsertPropertyImage = typeof propertyImages.$inferInsert;

/**
 * Property Links - Custom links for properties (virtual tours, business cards, etc.)
 */
export const propertyLinks = mysqlTable("propertyLinks", {
  id: int("id").primaryKey().autoincrement(),
  propertyId: int("propertyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "360° Rundgang", "Visitenkarte"
  url: varchar("url", { length: 500 }).notNull(),
  showOnLandingPage: boolean("showOnLandingPage").default(true),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PropertyLink = typeof propertyLinks.$inferSelect;
export type InsertPropertyLink = typeof propertyLinks.$inferInsert;

/**
 * Contacts - People and companies in the system
 */
export const contacts = mysqlTable("contacts", {
  id: int("id").primaryKey().autoincrement(),
  
  // Type
  type: mysqlEnum("type", ["person", "company"]).notNull(),
  
  // Basic info (Person)
  salutation: mysqlEnum("salutation", ["herr", "frau", "divers"]),
  title: varchar("title", { length: 50 }),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  
  // Basic info (Company)
  companyName: varchar("companyName", { length: 255 }),
  
  // Contact details
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  mobile: varchar("mobile", { length: 50 }),
  fax: varchar("fax", { length: 50 }),
  website: varchar("website", { length: 255 }),
  
  // Address
  street: varchar("street", { length: 255 }),
  houseNumber: varchar("houseNumber", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 100 }),
  
  // Additional info
  notes: text("notes"),
  source: varchar("source", { length: 100 }), // where did they come from
  status: mysqlEnum("status", ["sonstiges", "partner", "dienstleister", "kunde", "versicherung", "hausverwaltung", "objekteigentuemer"]).default("sonstiges"),
  tags: text("tags"), // JSON array of tags with categories: ["Dienstleister: Architekt", "Kunde: Käufer", "Partner: Makler", etc.]
  
  // Brevo sync
  brevoContactId: varchar("brevoContactId", { length: 100 }),
  brevoSyncStatus: mysqlEnum("brevoSyncStatus", ["not_synced", "synced", "error"]).default("not_synced"),
  brevoLastSyncAt: timestamp("brevoLastSyncAt"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

/**
 * Documents - Files associated with properties
 */
export const documents = mysqlTable("documents", {
  id: int("id").primaryKey().autoincrement(),
  propertyId: int("propertyId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileType: varchar("fileType", { length: 50 }),
  fileSize: int("fileSize"),
  category: varchar("category", { length: 100 }),
  description: text("description"),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Users - System users with authentication
 */
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  role: mysqlEnum("role", ["admin", "agent", "viewer"]).default("agent").notNull(),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  isActive: boolean("isActive").default(true),
  lastLogin: timestamp("lastLogin"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Settings - Application-wide settings
 */
export const settings = mysqlTable("settings", {
  id: int("id").primaryKey().autoincrement(),
  
  // Company branding
  companyName: varchar("companyName", { length: 255 }),
  companyLogo: varchar("companyLogo", { length: 500 }),
  companyAddress: text("companyAddress"),
  companyPhone: varchar("companyPhone", { length: 50 }),
  companyEmail: varchar("companyEmail", { length: 255 }),
  companyWebsite: varchar("companyWebsite", { length: 255 }),
  
  // Legal texts
  imprintText: text("imprintText"),
  privacyPolicyText: text("privacyPolicyText"),
  termsText: text("termsText"),
  
  // Portal credentials (encrypted)
  immoscout24ApiKey: text("immoscout24ApiKey"),
  immobilienscout24Username: varchar("immobilienscout24Username", { length: 255 }),
  immobilienscout24Password: text("immobilienscout24Password"),
  
  // Other settings
  defaultCommission: varchar("defaultCommission", { length: 50 }),
  
  // E-Mail settings (Brevo)
  brevoApiKey: text("brevoApiKey"),
  
  // E-Mail settings - Immobilienmakler
  realestateEmailFrom: varchar("realestateEmailFrom", { length: 255 }),
  realestateEmailFromName: varchar("realestateEmailFromName", { length: 255 }),
  realestateEmailNotificationTo: varchar("realestateEmailNotificationTo", { length: 255 }),
  
  // E-Mail settings - Versicherungen
  insuranceEmailFrom: varchar("insuranceEmailFrom", { length: 255 }),
  insuranceEmailFromName: varchar("insuranceEmailFromName", { length: 255 }),
  insuranceEmailNotificationTo: varchar("insuranceEmailNotificationTo", { length: 255 }),
  
  // E-Mail settings - Hausverwaltung
  propertyMgmtEmailFrom: varchar("propertyMgmtEmailFrom", { length: 255 }),
  propertyMgmtEmailFromName: varchar("propertyMgmtEmailFromName", { length: 255 }),
  propertyMgmtEmailNotificationTo: varchar("propertyMgmtEmailNotificationTo", { length: 255 }),
  
  // Legacy E-Mail settings (for backward compatibility)
  emailFrom: varchar("emailFrom", { length: 255 }),
  emailFromName: varchar("emailFromName", { length: 255 }),
  emailNotificationTo: varchar("emailNotificationTo", { length: 255 }),
  
  // Landing Page Settings
  landingPageTemplate: varchar("landingPageTemplate", { length: 50 }).default("modern"), // Template für Property Landing Pages
  
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;

/**
 * Property Links - Flexible links for properties (virtual tours, videos, etc.)
 */
export const propertyLinks = mysqlTable("propertyLinks", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  showOnLandingPage: boolean("showOnLandingPage").default(false),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  createdBy: int("createdBy"),
});

export type PropertyLink = typeof propertyLinks.$inferSelect;
export type InsertPropertyLink = typeof propertyLinks.$inferInsert;

/**
 * Appointments - Scheduled property viewings and meetings
 */
export const appointments = mysqlTable("appointments", {
  id: int("id").primaryKey().autoincrement(),
  
  // Basic info
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  
  // Timing
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  
  // Associations
  propertyId: int("propertyId"),
  contactId: int("contactId"),
  
  // Status
  status: mysqlEnum("status", ["scheduled", "completed", "cancelled", "no_show"]).default("scheduled"),
  
  // Notes
  notes: text("notes"),
  
  // Google Calendar integration
  googleCalendarEventId: varchar("googleCalendarEventId", { length: 255 }),
  googleCalendarSyncStatus: mysqlEnum("googleCalendarSyncStatus", ["not_synced", "synced", "error"]).default("not_synced"),
  googleCalendarLastSyncAt: timestamp("googleCalendarLastSyncAt"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

/**
 * Leads - Potential customers from contact forms
 */
export const leads = mysqlTable("leads", {
  id: int("id").primaryKey().autoincrement(),
  
  // Contact info
  firstName: varchar("firstName", { length: 100 }).notNull(),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  
  // Lead details
  source: varchar("source", { length: 255 }), // where did they come from
  propertyId: int("propertyId"), // which property are they interested in
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

/**
 * Property Management - Contracts for managing properties
 */
export const propertyManagementContracts = mysqlTable("propertyManagementContracts", {
  id: int("id").primaryKey().autoincrement(),
  
  // Associations
  propertyId: int("propertyId").notNull(),
  ownerId: int("ownerId"), // Contact ID of property owner
  
  // Contract details
  contractNumber: varchar("contractNumber", { length: 100 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  
  // Status
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active"),
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PropertyManagementContract = typeof propertyManagementContracts.$inferSelect;
export type InsertPropertyManagementContract = typeof propertyManagementContracts.$inferInsert;

/**
 * Rental Contracts - Rental agreements for properties
 */
export const rentalContracts = mysqlTable("rentalContracts", {
  id: int("id").primaryKey().autoincrement(),
  
  // Associations
  propertyId: int("propertyId").notNull(),
  tenantId: int("tenantId").notNull(), // Contact ID of tenant
  
  // Contract details
  contractNumber: varchar("contractNumber", { length: 100 }),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  
  // Status
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active"),
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RentalContract = typeof rentalContracts.$inferSelect;
export type InsertRentalContract = typeof rentalContracts.$inferInsert;

/**
 * Insurance Policies - Insurance contracts for properties
 */
export const insurancePolicies = mysqlTable("insurancePolicies", {
  id: int("id").primaryKey().autoincrement(),
  
  // Associations
  propertyId: int("propertyId").notNull(),
  insuranceCompanyId: int("insuranceCompanyId"), // Contact ID of insurance company
  
  // Policy details
  policyNumber: varchar("policyNumber", { length: 100 }),
  policyType: varchar("policyType", { length: 100 }), // e.g., "Gebäudeversicherung", "Haftpflicht"
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  
  // Status
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active"),
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type InsertInsurancePolicy = typeof insurancePolicies.$inferInsert;

/**
 * Maintenance Records - Maintenance and repair work on properties
 */
export const maintenanceRecords = mysqlTable("maintenanceRecords", {
  id: int("id").primaryKey().autoincrement(),
  
  // Associations
  propertyId: int("propertyId").notNull(),
  
  // Maintenance details
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  scheduledDate: timestamp("scheduledDate"),
  completedDate: timestamp("completedDate"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  vendor: varchar("vendor", { length: 255 }), // company/person who did the work
  
  // Status
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = typeof maintenanceRecords.$inferInsert;

/**
 * Utility Bills - Utility bills for properties
 */
export const utilityBills = mysqlTable("utilityBills", {
  id: int("id").primaryKey().autoincrement(),
  
  // Associations
  propertyId: int("propertyId").notNull(),
  
  // Bill details
  utilityType: varchar("utilityType", { length: 100 }), // e.g., "Strom", "Wasser", "Gas"
  billDate: timestamp("billDate").notNull(),
  dueDate: timestamp("dueDate"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paidBy: mysqlEnum("paidBy", ["owner", "tenant", "management"]),
  
  // Status
  status: mysqlEnum("status", ["pending", "paid", "overdue"]).default("pending"),
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UtilityBill = typeof utilityBills.$inferSelect;
export type InsertUtilityBill = typeof utilityBills.$inferInsert;

/**
 * Portal Inquiries - Inquiries from external portals (ImmoScout24, etc.)
 */
export const portalInquiries = mysqlTable("portalInquiries", {
  id: int("id").primaryKey().autoincrement(),
  
  // Portal info
  portalName: varchar("portalName", { length: 100 }), // e.g., "ImmoScout24"
  portalInquiryId: varchar("portalInquiryId", { length: 255 }), // ID from the portal
  
  // Inquiry details
  propertyId: int("propertyId"),
  inquirerName: varchar("inquirerName", { length: 255 }),
  inquirerEmail: varchar("inquirerEmail", { length: 255 }),
  inquirerPhone: varchar("inquirerPhone", { length: 50 }),
  messageText: text("messageText"),
  
  // Status and assignment
  status: mysqlEnum("status", ["new", "in_progress", "replied", "closed"]).default("new"),
  assignedTo: int("assignedTo"), // User ID of assigned agent
  
  // Response tracking
  firstResponseAt: timestamp("firstResponseAt"),
  lastResponseAt: timestamp("lastResponseAt"),
  
  // Metadata
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortalInquiry = typeof portalInquiries.$inferSelect;
export type InsertPortalInquiry = typeof portalInquiries.$inferInsert;

/**
 * App Configuration - Persistent application settings
 * Stores configuration values that persist across deployments
 */
export const appConfig = mysqlTable("appConfig", {
  configKey: varchar("configKey", { length: 255 }).primaryKey(),
  configValue: text("configValue"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AppConfig = typeof appConfig.$inferSelect;
export type InsertAppConfig = typeof appConfig.$inferInsert;
