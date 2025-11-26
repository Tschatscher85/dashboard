// Simple inline test of field mapping logic

console.log('=== FIELD MAPPING TEST ===\n');

// Replicate the mapping logic
function mapRouterFieldsToSchema(routerData) {
  const mapped = { ...routerData };
  
  const fieldMappings = {
    'price': 'purchasePrice',
    'coldRent': 'baseRent',
    'warmRent': 'totalRent',
    'balconyArea': 'balconyTerraceArea',
    'parkingCount': 'parkingSpaces',
    'flooringTypes': 'flooring',
    'heatingIncludedInAdditional': 'heatingCostsInServiceCharge',
    'monthlyRentalIncome': 'rentalIncome',
  };
  
  for (const [routerField, schemaField] of Object.entries(fieldMappings)) {
    if (routerField in mapped) {
      mapped[schemaField] = mapped[routerField];
      delete mapped[routerField];
    }
  }
  
  return mapped;
}

// Test data
const testData = {
  price: 135000,
  coldRent: 500,
  warmRent: 650,
  balconyArea: 15.5,
  parkingCount: 2,
  title: 'Test Property',
  heatingCosts: 100,
};

console.log('Input (Router field names):');
console.log(JSON.stringify(testData, null, 2));
console.log('');

const mapped = mapRouterFieldsToSchema(testData);

console.log('Output (Schema field names):');
console.log(JSON.stringify(mapped, null, 2));
console.log('');

// Verify
const tests = [
  { name: 'price → purchasePrice', pass: mapped.purchasePrice === 135000 && !('price' in mapped) },
  { name: 'coldRent → baseRent', pass: mapped.baseRent === 500 && !('coldRent' in mapped) },
  { name: 'warmRent → totalRent', pass: mapped.totalRent === 650 && !('warmRent' in mapped) },
  { name: 'balconyArea → balconyTerraceArea', pass: mapped.balconyTerraceArea === 15.5 && !('balconyArea' in mapped) },
  { name: 'parkingCount → parkingSpaces', pass: mapped.parkingSpaces === 2 && !('parkingCount' in mapped) },
  { name: 'title unchanged', pass: mapped.title === 'Test Property' },
  { name: 'heatingCosts unchanged', pass: mapped.heatingCosts === 100 },
];

console.log('=== VERIFICATION ===\n');
let allPassed = true;
for (const test of tests) {
  if (test.pass) {
    console.log(`✅ ${test.name}`);
  } else {
    console.log(`❌ ${test.name}`);
    allPassed = false;
  }
}

console.log('');
if (allPassed) {
  console.log('🎉 ALL TESTS PASSED!');
} else {
  console.log('❌ SOME TESTS FAILED!');
  process.exit(1);
}
