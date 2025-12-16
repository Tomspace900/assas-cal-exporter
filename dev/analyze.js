/**
 * Analyze CELCAT data - comprehensive parsing validation and issue detection
 *
 * NOTE: Requires dev/mock-data.json (not in git)
 * Copy dev/mock-data.example.json to dev/mock-data.json and add your own test data
 */

const fs = require('fs');
const { parseDescription } = require('../src/parser');

// Check if mock-data.json exists
if (!fs.existsSync('dev/mock-data.json')) {
  console.error('❌ Error: dev/mock-data.json not found');
  console.error('   Copy dev/mock-data.example.json to dev/mock-data.json');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync('dev/mock-data.json', 'utf8'));

console.log('=== CELCAT Data Analysis ===');
console.log(`Total events: ${data.length}\n`);

// ============================================
// 1. PARSING SAMPLES
// ============================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. PARSING SAMPLES');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const sampleIndices = [0, Math.floor(data.length / 3), Math.floor(data.length * 2 / 3), data.length - 1];

sampleIndices.forEach((idx, i) => {
  const event = data[idx];
  const parsed = parseDescription(event.description);

  console.log(`Sample ${i + 1} (index ${idx}):`);
  console.log(`  Category: ${parsed.category || '(empty)'}`);
  console.log(`  Module:   ${parsed.module || '(empty)'}`);
  console.log(`  Staff:    ${parsed.staff || '(empty)'}`);
  console.log(`  Group:    ${parsed.group || '(empty)'}`);
  console.log(`  Room:     ${parsed.room || '(none)'}`);
  console.log('');
});

// ============================================
// 2. GLOBAL STATISTICS
// ============================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('2. GLOBAL STATISTICS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

let withGroup = 0;
let withoutGroup = 0;
let withRoom = 0;
let withStaff = 0;
let emptyModule = 0;

data.forEach(event => {
  const parsed = parseDescription(event.description);
  if (parsed.group) withGroup++;
  else withoutGroup++;
  if (parsed.room) withRoom++;
  if (parsed.staff) withStaff++;
  if (!parsed.module) emptyModule++;
});

console.log(`With group:  ${withGroup.toString().padStart(3)} (${Math.round(withGroup/data.length*100)}%)`);
console.log(`Without:     ${withoutGroup.toString().padStart(3)} (${Math.round(withoutGroup/data.length*100)}%)`);
console.log(`With room:   ${withRoom.toString().padStart(3)} (${Math.round(withRoom/data.length*100)}%)`);
console.log(`With staff:  ${withStaff.toString().padStart(3)} (${Math.round(withStaff/data.length*100)}%)`);
console.log(`Empty module: ${emptyModule.toString().padStart(3)} ${emptyModule > 0 ? '⚠️' : '✓'}`);
console.log('');

// ============================================
// 3. EVENT CATEGORIES
// ============================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('3. EVENT CATEGORIES');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const categories = {};
data.forEach(e => {
  const cat = e.eventCategory || '(empty)';
  categories[cat] = (categories[cat] || 0) + 1;
});

Object.entries(categories)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cat, count]) => {
    const percentage = Math.round(count/data.length*100);
    console.log(`  ${cat.padEnd(30)} ${count.toString().padStart(3)} (${percentage}%)`);
  });
console.log('');

// ============================================
// 4. GROUP ANALYSIS
// ============================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('4. GROUP ANALYSIS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const groups = {};
data.forEach(e => {
  const parsed = parseDescription(e.description);
  if (parsed.group) {
    groups[parsed.group] = (groups[parsed.group] || 0) + 1;
  }
});

if (Object.keys(groups).length > 0) {
  console.log('Groups found:');
  Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .forEach(([group, count]) => {
      console.log(`  "${group}": ${count} events`);
    });
} else {
  console.log('No groups detected');
}
console.log('');

// ============================================
// 5. ISSUE DETECTION
// ============================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('5. ISSUE DETECTION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 5.1 Events without staff
const noStaff = data.filter(e => {
  const parsed = parseDescription(e.description);
  return !parsed.staff;
});

console.log(`5.1 Events WITHOUT staff: ${noStaff.length} ${noStaff.length > 0 ? '⚠️' : '✓'}`);
if (noStaff.length > 0 && noStaff.length <= 5) {
  console.log('     Examples:');
  noStaff.slice(0, 3).forEach((e, idx) => {
    console.log(`     - ${e.eventCategory || '(no category)'}`);
    const lines = e.description
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
    lines.forEach(line => console.log(`       ${line}`));
  });
}
console.log('');

// 5.2 Unparsed groups (description contains "Groupe" or "OPTION" but not detected)
const unparsedGroups = data.filter(e => {
  const desc = e.description || '';
  const parsed = parseDescription(desc);
  return (desc.includes('Groupe') || desc.includes('OPTION')) && !parsed.group;
});

console.log(`5.2 Unparsed groups: ${unparsedGroups.length} ${unparsedGroups.length > 0 ? '⚠️' : '✓'}`);
if (unparsedGroups.length > 0) {
  console.log('     Examples:');
  unparsedGroups.slice(0, 3).forEach((e, idx) => {
    const shortDesc = e.description.replace(/\r\n/g, ' ').replace(/<br \/>/g, ' | ').substring(0, 80);
    console.log(`     - ${shortDesc}...`);
  });
}
console.log('');

// 5.3 Complex descriptions (>4 lines)
const complex = data.filter(e => {
  const lines = e.description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
  return lines.length > 4;
});

console.log(`5.3 Complex descriptions (>4 lines): ${complex.length} ${complex.length > 0 ? '⚠️' : 'ℹ️'}`);
if (complex.length > 0) {
  const sample = complex[0];
  console.log('\n     Example:');
  const lines = sample.description
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
  lines.forEach(line => console.log(`       ${line}`));

  const parsed = parseDescription(sample.description);
  console.log('\n     Parsed result:');
  console.log(`       Category: ${parsed.category || '(empty)'}`);
  console.log(`       Module:   ${parsed.module || '(empty)'}`);
  console.log(`       Staff:    ${parsed.staff || '(empty)'}`);
  console.log(`       Group:    ${parsed.group || '(empty)'}`);
  console.log(`       Room:     ${parsed.room || '(empty)'}`);
}
console.log('');

// ============================================
// SUMMARY
// ============================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const issuesFound = emptyModule + noStaff.length + unparsedGroups.length;

if (issuesFound === 0) {
  console.log('✓ No critical issues detected!');
  console.log('  All events parsed successfully');
} else {
  console.log(`⚠️  ${issuesFound} potential issues detected:`);
  if (emptyModule > 0) console.log(`  - ${emptyModule} events with empty module`);
  if (noStaff.length > 0) console.log(`  - ${noStaff.length} events without staff`);
  if (unparsedGroups.length > 0) console.log(`  - ${unparsedGroups.length} unparsed groups`);
}

if (complex.length > 0) {
  console.log(`\nℹ️  ${complex.length} events have complex descriptions (>4 lines)`);
  console.log('   This is informational - may be normal depending on data format');
}

console.log('');
