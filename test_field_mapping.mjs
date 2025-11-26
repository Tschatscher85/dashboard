// Test script for field mapping functionality
import { mapRouterFieldsToSchema, validateSchemaFields } from './dist/index.js';

console.log('=== FIELD MAPPING TEST ===\n');

// Test data with router field names
const testData = {
  price: 135000,
  coldRent: 500,
  warmRent: 650,
  balconyArea: 15.5,
  parkingCount: 2,
  flooringTypes: 'Parkett, Fliesen',
  heatingIncludedInAdditional: true,
  monthlyRentalIncome: 1200,
  // Fields that match schema
  title: 'Test Property',
  street: 'Teststraße',
  city: 'München',
  heatingCosts: 100,
  additionalCosts: 200,
};

console.log('Input (Router field names):');
console.log(JSON.stringify(testData, null, 2));
console.log('\n');

// Apply mapping
const mapped = mapRouterFieldsToSchema(testData);

console.log('Output (Schema field names):');
console.log(JSON.stringify(mapped, null, 2));
console.log('\n');

// Validate
const unknownFields = validateSchemaFields(mapped);

if (unknownFields.length > 0) {
  console.log('❌ VALIDATION FAILED - Unknown fields:', unknownFields);
} else {
  console.log('✅ VALIDATION PASSED - All fields are valid!');
}

console.log('\n=== FIELD MAPPING VERIFICATION ===\n');

// Verify critical mappings
const verifications = [
  { router: 'price', schema: 'purchasePrice', value: 135000 },
  { router: 'coldRent', schema: 'baseRent', value: 500 },
  { router: 'warmRent', schema: 'totalRent', value: 650 },
  { router: 'balconyArea', schema: 'balconyTerraceArea', value: 15.5 },
  { router: 'parkingCount', schema: 'parkingSpaces', value: 2 },
];

let allPassed = true;

for (const { router, schema, value } of verifications) {
  const routerExists = router in testData;
  const schemaExists = schema in mapped;
  const valueMatches = mapped[schema] === value;
  const routerRemoved = !(router in mapped);
  
  const passed = routerExists && schemaExists && valueMatches && routerRemoved;
  
  if (passed) {
    console.log(`✅ ${router} → ${schema}: ${value}`);
  } else {
    console.log(`❌ ${router} → ${schema}: FAILED`);
    if (!schemaExists) console.log(`   Schema field '${schema}' not found`);
    if (!valueMatches) console.log(`   Value mismatch: expected ${value}, got ${mapped[schema]}`);
    if (!routerRemoved) console.log(`   Router field '${router}' not removed`);
    allPassed = false;
  }
}

console.log('\n');
if (allPassed) {
  console.log('🎉 ALL TESTS PASSED! Field mapping is working correctly.');
} else {
  console.log('❌ SOME TESTS FAILED! Please check the field mapping implementation.');
  process.exit(1);
}
