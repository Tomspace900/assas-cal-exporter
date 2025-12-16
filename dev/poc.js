/**
 * POC Script: Node.js script to validate parsing and ICS generation
 * Reads mock-data.json and generates a .ics file
 *
 * NOTE: Requires dev/mock-data.json (not in git)
 * Copy dev/mock-data.example.json to dev/mock-data.json and add your own test data
 */

const fs = require('fs');
const path = require('path');
const { parseDescription } = require('../src/parser');
const { generateIcs } = require('../src/ics-generator');

console.log('=== Assas Calendar Exporter - Development POC ===\n');

// Step 1: Read mock-data.json
console.log('Step 1: Reading mock calendar data...');
const mockDataPath = path.join(__dirname, 'mock-data.json');

let mockData;
try {
  const rawData = fs.readFileSync(mockDataPath, 'utf8');
  mockData = JSON.parse(rawData);
  console.log(`✓ Loaded ${mockData.length} events from mock-data.json\n`);
} catch (error) {
  console.error('❌ Error reading mock-data.json:', error.message);
  process.exit(1);
}

// Step 2: Parse each event
console.log('Step 2: Parsing event descriptions...');
const parsedEvents = mockData.map((event, index) => {
  const parsed = parseDescription(event.description);

  // Debug output for first few events
  if (index < 3) {
    console.log(`\nEvent ${index + 1}:`);
    console.log(`  Category: ${parsed.category}`);
    console.log(`  Module:   ${parsed.module}`);
    console.log(`  Staff:    ${parsed.staff}`);
    console.log(`  Group:    ${parsed.group}`);
    console.log(`  Room:     ${parsed.room || '(none)'}`);
  }

  return {
    ...event,
    parsed: parsed
  };
});

console.log(`\n✓ Parsed ${parsedEvents.length} events successfully\n`);

// Step 3: Generate ICS content
console.log('Step 3: Generating ICS file...');
let icsContent;
try {
  icsContent = generateIcs(parsedEvents);
  console.log(`✓ Generated ICS content (${icsContent.length} bytes)\n`);
} catch (error) {
  console.error('❌ Error generating ICS:', error.message);
  console.error(error.stack);
  process.exit(1);
}

// Step 4: Write to output file
console.log('Step 4: Writing to output file...');
const outputPath = path.join(__dirname, 'output/assas-calendar.ics');

try {
  fs.writeFileSync(outputPath, icsContent, 'utf8');
  console.log(`✓ ICS file written to: ${outputPath}\n`);
} catch (error) {
  console.error('❌ Error writing ICS file:', error.message);
  process.exit(1);
}

// Summary
console.log('===================');
console.log('✓ POC completed successfully!');
console.log(`✓ ${parsedEvents.length} events processed`);
console.log(`✓ Output file: dev/output/assas-calendar.ics`);
console.log('\nNext steps:');
console.log('1. Validate ICS file at: https://icalendar.org/validator.html');
console.log('2. Import into Google Calendar to test');
console.log('3. Re-import to verify no duplicates (UID check)');
console.log('4. Build bookmarklet: npm run build');
