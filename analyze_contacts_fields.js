// Extract contacts update schema fields from router (lines 2028-2037)
const routerFields = [
  "moduleImmobilienmakler",
  "moduleVersicherungen", 
  "moduleHausverwaltung",
  "contactType",
  "firstName",
  "lastName",
  "email",
  "phone"
];

// Schema fields from drizzle/schema.ts (lines 319-400+)
const schemaFields = [
  "id", "moduleImmobilienmakler", "moduleVersicherungen", "moduleHausverwaltung",
  "contactType", "contactCategory", "type", "salutation", "title", "firstName",
  "lastName", "language", "age", "birthDate", "birthPlace", "birthCountry",
  "idType", "idNumber", "issuingAuthority", "taxId", "nationality",
  "email", "alternativeEmail", "phone", "mobile", "fax", "website",
  "street", "houseNumber", "zipCode", "city", "country",
  "companyName", "position", "companyStreet", "companyHouseNumber",
  "companyZipCode", "companyCity", "companyCountry", "companyWebsite",
  "companyPhone", "companyMobile", "companyFax", "isBusinessContact",
  "advisor", "coAdvisor", "followUpDate", "source", "status", "tags",
  "archived", "notes", "availability", "blockContact", "sharedWithTeams",
  "sharedWithUsers", "dsgvoStatus", "dsgvoConsentGranted", "dsgvoDeleteBy",
  "dsgvoDeleteReason", "newsletterConsent"
];

console.log("=== CONTACTS FIELD ANALYSIS ===\n");

// Find fields in router
console.log("Fields in ROUTER update schema:");
routerFields.forEach(f => console.log(`  - ${f}`));

console.log("\n");

// Find fields in schema but not in router
const missingInRouter = schemaFields.filter(f => !routerFields.includes(f) && f !== 'id');
console.log("⚠️  Fields in SCHEMA but NOT in ROUTER update (cannot be updated via UI):");
console.log(`Total: ${missingInRouter.length} fields`);
missingInRouter.forEach(f => console.log(`  - ${f}`));

console.log("\n");

// Check if all router fields exist in schema
const missingInSchema = routerFields.filter(f => !schemaFields.includes(f));
if (missingInSchema.length > 0) {
  console.log("❌ Fields in ROUTER but NOT in SCHEMA (will NOT be saved):");
  missingInSchema.forEach(f => console.log(`  - ${f}`));
} else {
  console.log("✅ All router fields exist in schema!");
}

console.log("\n=== CONCLUSION ===");
console.log(`Router has only ${routerFields.length} fields`);
console.log(`Schema has ${schemaFields.length} fields`);
console.log(`Missing in router: ${missingInRouter.length} fields`);
console.log("\nThis means most contact fields CANNOT be updated via the UI!");
