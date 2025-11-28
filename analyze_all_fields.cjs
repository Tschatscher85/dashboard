#!/usr/bin/env node

/**
 * Comprehensive Field Analysis Script
 * Analyzes ALL field names across schema, router, and frontend
 * to identify mismatches and inconsistencies
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(80));
console.log('COMPREHENSIVE FIELD ANALYSIS');
console.log('='.repeat(80));

// 1. Extract fields from schema.ts
console.log('\n📋 STEP 1: Analyzing Database Schema (drizzle/schema.ts)');
console.log('-'.repeat(80));

const schemaPath = path.join(__dirname, 'drizzle/schema.ts');
const schemaContent = fs.readFileSync(schemaPath, 'utf8');

// Extract properties table fields
const propertiesMatch = schemaContent.match(/export const properties = mysqlTable\("properties", \{([\s\S]*?)\}\);/);
if (propertiesMatch) {
  const propertiesBlock = propertiesMatch[1];
  const fieldMatches = propertiesBlock.matchAll(/(\w+):\s*(?:varchar|int|decimal|boolean|text|mysqlEnum|date)/g);
  const schemaFields = Array.from(fieldMatches, m => m[1]);
  
  console.log(`\n✅ Properties Schema Fields (${schemaFields.length} total):`);
  console.log(schemaFields.sort().join(', '));
  
  // Save to file
  fs.writeFileSync('/tmp/schema_properties_fields.json', JSON.stringify(schemaFields.sort(), null, 2));
}

// Extract contacts table fields
const contactsMatch = schemaContent.match(/export const contacts = mysqlTable\("contacts", \{([\s\S]*?)\}\);/);
if (contactsMatch) {
  const contactsBlock = contactsMatch[1];
  const fieldMatches = contactsBlock.matchAll(/(\w+):\s*(?:varchar|int|decimal|boolean|text|mysqlEnum|date)/g);
  const schemaFields = Array.from(fieldMatches, m => m[1]);
  
  console.log(`\n✅ Contacts Schema Fields (${schemaFields.length} total):`);
  console.log(schemaFields.sort().join(', '));
  
  fs.writeFileSync('/tmp/schema_contacts_fields.json', JSON.stringify(schemaFields.sort(), null, 2));
}

// 2. Extract fields from router (properties create)
console.log('\n\n📋 STEP 2: Analyzing Router Input Schema (server/routers.ts)');
console.log('-'.repeat(80));

const routerPath = path.join(__dirname, 'server/routers.ts');
const routerContent = fs.readFileSync(routerPath, 'utf8');

// Extract properties create input
const propertiesCreateMatch = routerContent.match(/create: publicProcedure\s*\.input\(z\.object\(\{([\s\S]*?)\}\)\)\s*\.mutation\(async \(\{ input/);
if (propertiesCreateMatch) {
  const inputBlock = propertiesCreateMatch[1];
  const fieldMatches = inputBlock.matchAll(/(\w+):\s*z\./g);
  const routerFields = Array.from(fieldMatches, m => m[1]);
  
  console.log(`\n✅ Properties Router CREATE Fields (${routerFields.length} total):`);
  console.log(routerFields.sort().join(', '));
  
  fs.writeFileSync('/tmp/router_properties_create_fields.json', JSON.stringify(routerFields.sort(), null, 2));
}

// Extract properties update input
const propertiesUpdateMatch = routerContent.match(/update: publicProcedure\s*\.input\(z\.object\(\{\s*id: z\.number\(\),\s*data: z\.object\(\{([\s\S]*?)\}\),?\s*\}\)\)\s*\.mutation/);
if (propertiesUpdateMatch) {
  const inputBlock = propertiesUpdateMatch[1];
  const fieldMatches = inputBlock.matchAll(/(\w+):\s*z\./g);
  const routerFields = Array.from(fieldMatches, m => m[1]);
  
  console.log(`\n✅ Properties Router UPDATE Fields (${routerFields.length} total):`);
  console.log(routerFields.sort().join(', '));
  
  fs.writeFileSync('/tmp/router_properties_update_fields.json', JSON.stringify(routerFields.sort(), null, 2));
}

// 3. Compare and find mismatches
console.log('\n\n📋 STEP 3: Comparing Schema vs Router');
console.log('-'.repeat(80));

const schemaPropertiesFields = JSON.parse(fs.readFileSync('/tmp/schema_properties_fields.json', 'utf8'));
const routerCreateFields = JSON.parse(fs.readFileSync('/tmp/router_properties_create_fields.json', 'utf8'));
const routerUpdateFields = JSON.parse(fs.readFileSync('/tmp/router_properties_update_fields.json', 'utf8'));

console.log('\n❌ Fields in SCHEMA but NOT in Router CREATE:');
const missingInCreate = schemaPropertiesFields.filter(f => !routerCreateFields.includes(f));
console.log(missingInCreate.join(', ') || 'None');

console.log('\n❌ Fields in Router CREATE but NOT in SCHEMA:');
const extraInCreate = routerCreateFields.filter(f => !schemaPropertiesFields.includes(f));
console.log(extraInCreate.join(', ') || 'None');

console.log('\n❌ Fields in SCHEMA but NOT in Router UPDATE:');
const missingInUpdate = schemaPropertiesFields.filter(f => !routerUpdateFields.includes(f));
console.log(missingInUpdate.join(', ') || 'None');

console.log('\n❌ Fields in Router UPDATE but NOT in SCHEMA:');
const extraInUpdate = routerUpdateFields.filter(f => !schemaPropertiesFields.includes(f));
console.log(extraInUpdate.join(', ') || 'None');

// 4. Generate report
console.log('\n\n📊 SUMMARY REPORT');
console.log('='.repeat(80));

const report = {
  properties: {
    schema: {
      count: schemaPropertiesFields.length,
      fields: schemaPropertiesFields
    },
    router_create: {
      count: routerCreateFields.length,
      fields: routerCreateFields,
      missing: missingInCreate,
      extra: extraInCreate
    },
    router_update: {
      count: routerUpdateFields.length,
      fields: routerUpdateFields,
      missing: missingInUpdate,
      extra: extraInUpdate
    }
  }
};

fs.writeFileSync('/tmp/field_analysis_report.json', JSON.stringify(report, null, 2));

console.log(`\n✅ Schema Fields: ${schemaPropertiesFields.length}`);
console.log(`✅ Router CREATE Fields: ${routerCreateFields.length}`);
console.log(`✅ Router UPDATE Fields: ${routerUpdateFields.length}`);
console.log(`\n❌ Mismatches in CREATE: ${missingInCreate.length + extraInCreate.length}`);
console.log(`❌ Mismatches in UPDATE: ${missingInUpdate.length + extraInUpdate.length}`);

console.log('\n📄 Full report saved to: /tmp/field_analysis_report.json');
console.log('='.repeat(80));
