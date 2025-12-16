/**
 * Test script for parser module
 * Validates parsing logic with various edge cases
 */

const { parseDescription } = require('../src/parser');

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    return false;
  }
  console.log(`✓ PASSED: ${message}`);
  return true;
}

function assertEqual(actual, expected, message) {
  const passed = actual === expected;
  if (!passed) {
    console.error(`❌ FAILED: ${message}`);
    console.error(`   Expected: "${expected}"`);
    console.error(`   Actual:   "${actual}"`);
    return false;
  }
  console.log(`✓ PASSED: ${message}`);
  return true;
}

console.log('=== Parser Unit Tests ===\n');

let totalTests = 0;
let passedTests = 0;

// Test 1: Standard format without room
console.log('Test 1: Standard format (category, module, staff, group)');
const test1Input = "Cours magistral\r\n\r\n<br />\r\n\r\nSanté au travail\r\n\r\n<br />\r\n\r\nFLEURY, Thibaut\r\n\r\n<br />\r\n\r\nGroupe 1\r\n";
const test1Result = parseDescription(test1Input);
totalTests += 4;
passedTests += assertEqual(test1Result.category, 'Cours magistral', 'Category parsing') ? 1 : 0;
passedTests += assertEqual(test1Result.module, 'Santé au travail', 'Module parsing') ? 1 : 0;
passedTests += assertEqual(test1Result.staff, 'FLEURY, Thibaut', 'Staff parsing') ? 1 : 0;
passedTests += assertEqual(test1Result.group, '1', 'Group parsing') ? 1 : 0;
console.log('');

// Test 2: Format with HTML entities
console.log('Test 2: HTML entity decoding');
const test2Input = "Cours magistral\r\n\r\n<br />\r\n\r\nM&#233;diation et gestion des conflits\r\n\r\n<br />\r\n\r\nCHAVAS, Herv&#233;\r\n\r\n<br />\r\n\r\nGroupe 1\r\n";
const test2Result = parseDescription(test2Input);
totalTests += 2;
passedTests += assertEqual(test2Result.module, 'Médiation et gestion des conflits', 'Module with é') ? 1 : 0;
passedTests += assertEqual(test2Result.staff, 'CHAVAS, Hervé', 'Staff name with é') ? 1 : 0;
console.log('');

// Test 3: Format with room
console.log('Test 3: Format with room (Salle)');
const test3Input = "Cours magistral\r\n\r\n<br />\r\n\r\nClinique RH, pilotage opérationnel, coaching, mentorat\r\n\r\n<br />\r\n\r\nSalle 13 ( Guy de la Brosse) [GUY-DE-LA-BROSSE]\r\n\r\n<br />\r\n\r\nPierre Gaugibert\r\n";
const test3Result = parseDescription(test3Input);
totalTests += 3;
passedTests += assertEqual(test3Result.module, 'Clinique RH, pilotage opérationnel, coaching, mentorat', 'Long module name with commas') ? 1 : 0;
passedTests += assert(test3Result.room !== null, 'Room is detected') ? 1 : 0;
passedTests += assertEqual(test3Result.staff, 'Pierre Gaugibert', 'Staff without comma format') ? 1 : 0;
console.log('');

// Test 4: Format with special group (OPTION)
console.log('Test 4: Format with special group label (OPTION)');
const test4Input = "Cours magistral\r\n\r\n<br />\r\n\r\nManagement interculturel et international des RH\r\n\r\n<br />\r\n\r\nMAYER, Paul\r\n\r\n<br />\r\n\r\nOPTION\r\n";
const test4Result = parseDescription(test4Input);
totalTests += 2;
passedTests += assertEqual(test4Result.staff, 'MAYER, Paul', 'Staff parsing with OPTION group') ? 1 : 0;
passedTests += assertEqual(test4Result.group, 'OPTION', 'Group parsing (OPTION label)') ? 1 : 0;
console.log('');

// Test 5: Format with ampersand entity
console.log('Test 5: HTML entity &amp;');
const test5Input = "Cours magistral\r\n\r\n<br />\r\n\r\nMéthodologie rech,littérature, collecte &amp; analyse de données\r\n\r\n<br />\r\n\r\nVOYNNET-FOURBOUL, Catherine\r\n\r\n<br />\r\n\r\nGroupe 2\r\n";
const test5Result = parseDescription(test5Input);
totalTests += 2;
passedTests += assert(test5Result.module.includes('&'), 'Ampersand decoded correctly') ? 1 : 0;
passedTests += assert(test5Result.staff.includes('-'), 'Hyphenated last name parsed') ? 1 : 0;
console.log('');

// Test 6: Empty or null input
console.log('Test 6: Edge cases (empty, null)');
const test6aResult = parseDescription('');
const test6bResult = parseDescription(null);
totalTests += 2;
passedTests += assert(test6aResult.category === null, 'Empty string returns null fields') ? 1 : 0;
passedTests += assert(test6bResult.category === null, 'Null input returns null fields') ? 1 : 0;
console.log('');

// Summary
console.log('===================');
console.log(`Results: ${passedTests}/${totalTests} tests passed`);
if (passedTests === totalTests) {
  console.log('✓ All tests passed!');
  process.exit(0);
} else {
  console.log(`❌ ${totalTests - passedTests} tests failed`);
  process.exit(1);
}
