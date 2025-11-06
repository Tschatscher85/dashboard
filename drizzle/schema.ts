import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json } from "drizzle-orm/mysql-core";

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
  
  // Stammdaten
  unitNumber: varchar("unitNumber", { length: 100 }), // Einheitennummer
  apartmentNumber: varchar("apartmentNumber", { length: 50 }), // Wohnungsnummer
  parkingNumber: varchar("parkingNumber", { length: 50 }), // Stellplatz Nr.
  headline: varchar("headline", { length: 500 }), // Überschrift
  headlineScore: int("headlineScore"), // 99/100 Bewertung
  project: varchar("project", { length: 255 }), // Projekt
  features: text("features"), // Merkmale (JSON or comma-separated)
  warning: text("warning"), // Warnhinweis
  archived: boolean("archived").default(false), // Archiviert
  internalNotes: text("internalNotes"), // Interne Notiz
  
  // Property type and status
  category: varchar("category", { length: 100 }), // Kategorie (Kauf, Miete)
  propertyType: mysqlEnum("propertyType", [
    "apartment", "house", "commercial", "land", "parking", "other"
  ]).notNull(),
  subType: varchar("subType", { length: 100 }), // Wohnung, Etagenwohnung, etc.
  marketingType: mysqlEnum("marketingType", ["sale", "rent", "lease"]).notNull(),
  status: mysqlEnum("status", ["acquisition", "preparation", "marketing", "reserved", "sold", "rented", "inactive"]).default("acquisition").notNull(),
  
  // Address
  street: varchar("street", { length: 255 }),
  houseNumber: varchar("houseNumber", { length: 50 }),
  zipCode: varchar("zipCode", { length: 20 }),
  city: varchar("city", { length: 100 }),
  region: varchar("region", { length: 100 }), // Region / Land
  country: varchar("country", { length: 100 }).default("Deutschland"),
  latitude: varchar("latitude", { length: 50 }), // Koordinaten
  longitude: varchar("longitude", { length: 50 }),
  hideStreetOnPortals: boolean("hideStreetOnPortals").default(false),
  
  // Grundbuch
  districtCourt: varchar("districtCourt", { length: 255 }), // Amtsgericht
  landRegisterSheet: varchar("landRegisterSheet", { length: 100 }), // Grundbuchblatt
  landRegisterOf: varchar("landRegisterOf", { length: 255 }), // Grundbuch von
  cadastralDistrict: varchar("cadastralDistrict", { length: 100 }), // Gemarkung
  corridor: varchar("corridor", { length: 100 }), // Flur
  parcel: varchar("parcel", { length: 100 }), // Flurstück
  
  // Property details
  livingArea: int("livingArea"), // in sqm
  plotArea: int("plotArea"), // in sqm
  usableArea: int("usableArea"), // Nutzfläche (Wohnen)
  balconyArea: int("balconyArea"), // Balkon/Terrasse Fläche
  gardenArea: int("gardenArea"), // Gartenfläche
  rooms: int("rooms"),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  floor: int("floor"),
  floorLevel: varchar("floorLevel", { length: 100 }), // Etagenlage
  totalFloors: int("totalFloors"),
  
  // Financial
  price: int("price"), // in cents
  priceOnRequest: boolean("priceOnRequest").default(false), // Preis auf Anfrage
  priceByNegotiation: boolean("priceByNegotiation").default(false), // Preis gegen Gebot
  coldRent: int("coldRent"), // Kaltmiete in cents
  warmRent: int("warmRent"), // Warmmiete in cents
  pricePerSqm: int("pricePerSqm"), // calculated, in cents
  additionalCosts: int("additionalCosts"), // Nebenkosten in cents
  heatingCosts: int("heatingCosts"), // in cents
  heatingIncludedInAdditional: boolean("heatingIncludedInAdditional").default(false),
  nonRecoverableCosts: int("nonRecoverableCosts"), // Nicht umlegbare Kosten
  houseMoney: int("houseMoney"), // Hausgeld/Monat
  maintenanceReserve: int("maintenanceReserve"), // Instandhaltungsrücklage
  parkingPrice: int("parkingPrice"), // Stellplatz-Preis
  monthlyRentalIncome: int("monthlyRentalIncome"), // Mtl. Mieteinnahmen
  deposit: int("deposit"), // Kaution in cents
  
  // Ausstattung / Features
  hasElevator: boolean("hasElevator").default(false), // Aufzug
  isBarrierFree: boolean("isBarrierFree").default(false), // Barrierefrei
  hasBasement: boolean("hasBasement").default(false), // Keller
  hasGuestToilet: boolean("hasGuestToilet").default(false), // Gäste-WC
  hasBuiltInKitchen: boolean("hasBuiltInKitchen").default(false), // Einbauküche
  hasBalcony: boolean("hasBalcony").default(false), // Balkon/Terrasse
  hasTerrace: boolean("hasTerrace").default(false),
  hasLoggia: boolean("hasLoggia").default(false), // Loggia
  hasGarden: boolean("hasGarden").default(false), // Garten
  isMonument: boolean("isMonument").default(false), // Denkmalschutz
  suitableAsHoliday: boolean("suitableAsHoliday").default(false), // Als Ferienwohnung geeignet
  hasStorageRoom: boolean("hasStorageRoom").default(false), // Abstellraum
  hasFireplace: boolean("hasFireplace").default(false), // Kamin
  hasPool: boolean("hasPool").default(false), // Pool
  hasSauna: boolean("hasSauna").default(false), // Sauna
  hasAlarm: boolean("hasAlarm").default(false), // Alarmanlage
  hasWinterGarden: boolean("hasWinterGarden").default(false), // Wintergarten
  hasAirConditioning: boolean("hasAirConditioning").default(false), // Klimaanlage
  hasParking: boolean("hasParking").default(false),
  parkingCount: int("parkingCount"), // Anzahl Parkplätze
  parkingType: varchar("parkingType", { length: 100 }), // Stellplatztyp (Garage, etc.)
  
  // Bad (Multi-select: Dusche, Wanne, Fenster, Bidet, Urinal)
  // Stored as comma-separated values
  bathroomFeatures: text("bathroomFeatures"),
  
  // Bodenbelag (Multi-select)
  // Stored as comma-separated values
  flooringTypes: text("flooringTypes"),
  
  // Energy certificate (Energieausweis)
  energyCertificateAvailability: varchar("energyCertificateAvailability", { length: 100 }), // wird nicht benötigt, liegt vor, liegt zur Besichtigung vor
  energyCertificateCreationDate: varchar("energyCertificateCreationDate", { length: 50 }), // ab 1. Mai 2014, bis 30. April 2014
  energyCertificateIssueDate: varchar("energyCertificateIssueDate", { length: 20 }), // Date as string
  energyCertificateValidUntil: varchar("energyCertificateValidUntil", { length: 20 }), // Date as string
  energyCertificateType: varchar("energyCertificateType", { length: 50 }), // Bedarfsausweis, Verbrauchsausweis
  energyClass: varchar("energyClass", { length: 10 }), // A+, A, B, C, D, E, F, G, H
  energyConsumption: int("energyConsumption"), // Energiekennwert kWh/(m²*a)
  energyConsumptionElectricity: int("energyConsumptionElectricity"), // Energiekennwert Strom
  energyConsumptionHeat: int("energyConsumptionHeat"), // Energiekennwert Wärme
  co2Emissions: int("co2Emissions"), // CO2-Emissionen
  includesWarmWater: boolean("includesWarmWater").default(false), // Energieverbrauch für Warmwasser enthalten
  heatingType: varchar("heatingType", { length: 100 }), // Heizungsart
  mainEnergySource: varchar("mainEnergySource", { length: 100 }), // Wesentlicher Energieträger
  buildingYearUnknown: boolean("buildingYearUnknown").default(false), // Baujahr unbekannt
  heatingSystemYear: int("heatingSystemYear"), // Baujahr Anlagentechnik
  
  // Construction
  yearBuilt: int("yearBuilt"),
  lastModernization: int("lastModernization"), // Letzte Modernisierung (Jahr)
  condition: mysqlEnum("condition", [
    "erstbezug", "erstbezug_nach_sanierung", "neuwertig", "saniert", "teilsaniert",
    "sanierungsbedürftig", "baufällig", "modernisiert", "vollständig_renoviert",
    "teilweise_renoviert", "gepflegt", "renovierungsbedürftig", "nach_vereinbarung", "abbruchreif"
  ]),
  buildingPhase: varchar("buildingPhase", { length: 100 }), // Bauphase
  equipmentQuality: varchar("equipmentQuality", { length: 100 }), // Qualität der Ausstattung
  
  // Contact and availability
  isRented: boolean("isRented").default(false), // Vermietet
  availableFrom: timestamp("availableFrom"),
  contactPersonId: int("contactPersonId"), // reference to users or contacts
  
  // Ansprechpartner (Contact Persons)
  supervisorId: int("supervisorId"), // Betreuer (user)
  ownerId: int("ownerId"), // Eigentümer (contact)
  ownerType: varchar("ownerType", { length: 100 }), // Typ (optional)
  buyerId: int("buyerId"), // Käufer (contact)
  notaryId: int("notaryId"), // Notar (contact)
  propertyManagementId: int("propertyManagementId"), // Hausverwaltung (contact)
  tenantId: int("tenantId"), // Mieter (contact)
  linkedContactIds: text("linkedContactIds"), // Verknüpfte Kontakte (JSON array)
  
  // Portale (Portal Export)
  portalExports: text("portalExports"), // JSON array of portal exports
  is24ContactPerson: varchar("is24ContactPerson", { length: 255 }), // IS24-Ansprechpartner
  is24Id: varchar("is24Id", { length: 100 }), // IS24-ID
  is24GroupNumber: varchar("is24GroupNumber", { length: 100 }), // IS24-Gruppen-Nr
  translations: text("translations"), // Übersetzungen (JSON)
  
  // Auftrag (Assignment)
  assignmentType: varchar("assignmentType", { length: 100 }), // Auftragsart (Alleinauftrag, etc.)
  assignmentDuration: varchar("assignmentDuration", { length: 100 }), // Laufzeit (Unbefristet, Befristet)
  assignmentFrom: timestamp("assignmentFrom"), // Auftrag von
  assignmentTo: timestamp("assignmentTo"), // Auftrag bis
  
  // Verkauf (Sale)
  saleInfo: text("saleInfo"), // JSON for sale information
  
  // Provision Intern (Internal Commission)
  internalCommissionPercent: varchar("internalCommissionPercent", { length: 50 }), // Innenprovision (intern)
  internalCommissionType: mysqlEnum("internalCommissionType", ["percent", "euro"]).default("percent"), // % or €
  externalCommissionInternalPercent: varchar("externalCommissionInternalPercent", { length: 50 }), // Außenprovision (intern)
  externalCommissionInternalType: mysqlEnum("externalCommissionInternalType", ["percent", "euro"]).default("percent"),
  totalCommission: int("totalCommission"), // Gesamtprovision (calculated, in cents)
  
  // Provision Extern (External Commission)
  externalCommissionForExpose: varchar("externalCommissionForExpose", { length: 255 }), // Außenprovision für Exposé
  commissionNote: text("commissionNote"), // Provisionshinweis
  
  // Verrechnung (Billing)
  billingInfo: text("billingInfo"), // JSON for billing information
  
  // Fahrzeiten (Travel Times)
  walkingTimeToPublicTransport: int("walkingTimeToPublicTransport"), // in minutes
  distanceToPublicTransport: int("distanceToPublicTransport"), // in meters
  drivingTimeToHighway: int("drivingTimeToHighway"), // in minutes
  distanceToHighway: int("distanceToHighway"), // in meters
  drivingTimeToMainStation: int("drivingTimeToMainStation"), // in minutes
  distanceToMainStation: int("distanceToMainStation"), // in meters
  drivingTimeToAirport: int("drivingTimeToAirport"), // in minutes
  distanceToAirport: int("distanceToAirport"), // in meters
  
  // Auto-export settings
  autoExpose: boolean("autoExpose").default(true), // kein automatischer Exposéversand
  
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
  status: mysqlEnum("status", ["sonstiges", "partner", "dienstleister", "kunde", "versicherung", "hausverwaltung", "objekteigentuemer"]).default("sonstiges"),
  tags: text("tags"), // JSON array of tags with categories: ["Dienstleister: Architekt", "Kunde: Käufer", "Partner: Makler", etc.]
  
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
  
  // Google Calendar integration
  googleCalendarEventId: varchar("googleCalendarEventId", { length: 255 }),
  googleCalendarLink: text("googleCalendarLink"),
  lastSyncedToGoogleCalendar: timestamp("lastSyncedToGoogleCalendar"),
  
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

/**
 * Insurance Policies - for future Versicherungen module
 * Tracks insurance contracts linked to properties and contacts
 */
export const insurancePolicies = mysqlTable("insurancePolicies", {
  id: int("id").autoincrement().primaryKey(),
  
  // Policy details
  policyNumber: varchar("policyNumber", { length: 100 }),
  insuranceType: mysqlEnum("insuranceType", [
    "building", // Gebäudeversicherung
    "liability", // Haftpflicht
    "legal", // Rechtsschutz
    "household", // Hausrat
    "elemental", // Elementarschaden
    "glass", // Glasversicherung
    "other"
  ]).notNull(),
  provider: varchar("provider", { length: 255 }), // Allianz, etc.
  
  // Relations
  contactId: int("contactId"), // policy holder
  propertyId: int("propertyId"), // insured property
  
  // Financial
  premium: int("premium").notNull(), // in cents
  paymentInterval: mysqlEnum("paymentInterval", ["monthly", "quarterly", "yearly"]).notNull(),
  
  // Dates
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  
  // Status
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active"),
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InsurancePolicy = typeof insurancePolicies.$inferSelect;
export type InsertInsurancePolicy = typeof insurancePolicies.$inferInsert;

/**
 * Broker Contracts - for future Makler module
 * Tracks broker contracts and commissions
 */
export const brokerContracts = mysqlTable("brokerContracts", {
  id: int("id").autoincrement().primaryKey(),
  
  // Contract details
  contractNumber: varchar("contractNumber", { length: 100 }),
  contractType: mysqlEnum("contractType", [
    "exclusive", // Alleinauftrag
    "simple", // Einfacher Auftrag
    "qualified_exclusive" // Qualifizierter Alleinauftrag
  ]).notNull(),
  
  // Relations
  contactId: int("contactId").notNull(), // client
  propertyId: int("propertyId").notNull(), // property being brokered
  
  // Commission
  commissionRate: int("commissionRate"), // percentage * 100 (e.g., 350 = 3.5%)
  commissionAmount: int("commissionAmount"), // fixed amount in cents
  commissionType: mysqlEnum("commissionType", ["percentage", "fixed"]),
  
  // Dates
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  
  // Status
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active"),
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BrokerContract = typeof brokerContracts.$inferSelect;
export type InsertBrokerContract = typeof brokerContracts.$inferInsert;

/**
 * Property Management Contracts - for future Hausverwaltung module
 */
export const propertyManagementContracts = mysqlTable("propertyManagementContracts", {
  id: int("id").autoincrement().primaryKey(),
  
  // Contract details
  contractNumber: varchar("contractNumber", { length: 100 }),
  
  // Relations
  propertyId: int("propertyId").notNull(),
  managerId: int("managerId").notNull(), // contactId of property manager
  
  // Financial
  monthlyFee: int("monthlyFee"), // in cents
  services: text("services"), // JSON array of services included
  
  // Dates
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  
  // Status
  status: mysqlEnum("status", ["active", "expired", "cancelled"]).default("active"),
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PropertyManagementContract = typeof propertyManagementContracts.$inferSelect;
export type InsertPropertyManagementContract = typeof propertyManagementContracts.$inferInsert;

/**
 * Maintenance Records - for Hausverwaltung module
 */
export const maintenanceRecords = mysqlTable("maintenanceRecords", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relations
  propertyId: int("propertyId").notNull(),
  
  // Maintenance details
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", [
    "repair", // Reparatur
    "inspection", // Inspektion
    "cleaning", // Reinigung
    "renovation", // Renovierung
    "other"
  ]).notNull(),
  
  // Financial
  cost: int("cost"), // in cents
  vendor: varchar("vendor", { length: 255 }), // company/person who did the work
  
  // Status
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = typeof maintenanceRecords.$inferInsert;

/**
 * Utility Bills - for Nebenkostenabrechnung in Hausverwaltung module
 */
export const utilityBills = mysqlTable("utilityBills", {
  id: int("id").autoincrement().primaryKey(),
  
  // Relations
  propertyId: int("propertyId").notNull(),
  
  // Bill details
  year: int("year").notNull(),
  month: int("month"), // optional, for monthly bills
  type: mysqlEnum("type", [
    "heating", // Heizung
    "water", // Wasser
    "electricity", // Strom
    "gas", // Gas
    "waste", // Müll
    "cleaning", // Reinigung
    "maintenance", // Instandhaltung
    "insurance", // Versicherung
    "property_tax", // Grundsteuer
    "other"
  ]).notNull(),
  
  // Financial
  amount: int("amount").notNull(), // in cents
  paidBy: mysqlEnum("paidBy", ["owner", "tenant", "management"]),
  
  // Status
  status: mysqlEnum("status", ["pending", "paid", "overdue"]).default("pending"),
  
  // Notes
  notes: text("notes"),
  
  // Metadata
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UtilityBill = typeof utilityBills.$inferSelect;
export type InsertUtilityBill = typeof utilityBills.$inferInsert;
